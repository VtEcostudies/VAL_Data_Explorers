/*
localStorage is a property that allows JavaScript sites and apps to save key-value pairs in a web browser with no expiration date. 
This means the data stored persists even after the user closes the browser or restarts the computer.
sessionStorage is similar to localStorage; the difference is that while data in localStorage doesn't expire, data in sessionStorage 
is cleared when the page session ends. Whenever a document is loaded in a particular tab in the browser, a unique page session gets 
created and assigned to that particular tab.
*/
const gbifApi = "https://api.gbif.org/v1";
const Storage = sessionStorage; //localStorage;

//wrap retrieval of occ counts in this async function to return a promise, which elsewhere waits for data
export async function getStoredOccCnts(fileConfig, searchTerm='') {
    let sOccCnts; let storeName = `occCnts-${fileConfig.dataConfig.atlasAbbrev}`;
    if (searchTerm) {storeName += `-${searchTerm}`;}
    if (Storage.getItem(storeName)) {
        sOccCnts = JSON.parse(Storage.getItem(storeName));
        console.log(`Storage.getItem(${storeName}) returned`, sOccCnts);
    } else {
        sOccCnts = getAggOccCounts(fileConfig, searchTerm); //returns a promise. handle that downstream with occs.then(occs => {}).
        console.log(`getAggOccCounts returned`, sOccCnts); //this returns 'Promise { <state>: "pending" }'
        sOccCnts.then(occCnts => { //convert promise to data object...
            Storage.setItem(storeName, JSON.stringify(occCnts));
        });
    }
    return sOccCnts; //return a JSON data object from async function wraps the object in a promise. the caller should await or .then() it.
}

/*
    For a given species-list higherTaxonKey, get a list of all its species-list sub-taxonKeys. 
    This is primarily used to sum occurrence counts across ACCEPTED and NON-ACCEPTED taxa when 
    GBIF does not agree with the species-list's taxon definitions.

    NOTE: We MUST return the nubKeys of the returned results b/c occCnts uses nubKeys,
    and the GBIF occurrence/search api only works with nubKeys.

    We already do this elsewhere, like this:

    https://api.gbif.org/v1/species/search?datasetKey=73eb16f0-4b06-4347-8069-459bc2d96ddb&higherTaxonKey=177419414
*/
export async function getListSubTaxonKeys(fileConfig, higherTaxonKey) {
    let speciesFilter = fileConfig.dataConfig.speciesFilter;
    let reqHost = gbifApi;
    let reqRoute = "/species/search";
    let reqFilter = `?${speciesFilter}&higherTaxonKey=${higherTaxonKey}`;
    let url = reqHost+reqRoute+reqFilter;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        //console.log(`getListSubTaxonKeys(${speciesFilter}, ${higherTaxonKey}) QUERY:`, enc);
        //console.log(`getListSubTaxonKeys(${speciesFilter}, ${higherTaxonKey}) RESULT:`, json);
        let arr = [];
        for (const idx in json.results) { //returns array indexes of array of objects
            //console.log(`element of array:`, idx);
            if (json.results[idx].nubKey) {arr.push(json.results[idx].nubKey);}
        }
        console.log(`getListSubTaxonKeys(${speciesFilter}, ${higherTaxonKey})`, arr);
        return {'keys':arr, 'query':enc};
    } catch (err) {
        err.query = enc;
        console.log(`getListSubTaxonKeys(${speciesFilter}, ${higherTaxonKey}) ERROR:`, err);
        return new Error(err)
    }
}
/*
    For a given GBIF backbone higherTaxonKey, get a list of all its backbone sub-taxonKeys. 
    This is used as a list of keys to remove from a retrieved list of species-list keys NOT
    recognized by the GBIF backbone.
*/
export async function getBoneSubTaxonKeys(higherTaxonKey) {
    let reqHost = gbifApi;
    let reqRoute = "/species/search";
    let reqFilter = `?higherTaxonKey=${higherTaxonKey}`;
    let url = reqHost+reqRoute+reqFilter;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        //console.log(`getBoneSubTaxonKeys(${higherTaxonKey}) QUERY:`, enc);
        //console.log(`getBoneSubTaxonKeys(${higherTaxonKey}) RESULT:`, json);
        let arr = [];
        for (const idx in json.results) { //returns array indexes of array of objects
            //console.log(`element of array:`, idx);
            if (json.results[idx].nubKey) {arr.push(json.results[idx].nubKey);}
        }
        console.log(`getBoneSubTaxonKeys(${higherTaxonKey})`, arr);
        return {'keys':arr, 'query':enc};
    } catch (err) {
        err.query = enc;
        console.log(`getBoneSubTaxonKeys(${higherTaxonKey}) ERROR:`, err);
        return new Error(err)
    }
}
/*
NOTE: higherTaxonKey must be from species-list overlay (NOT nubKey) but occCounts is indexed by nubKey.
This means several things...
- getListSubTaxonKeys returns subTaxon nubKeys to be used in our stored backbone indexes
- getBoneSubTaxonKeys returns subTaxon nubKeys to remove from the above list (becuase GBIF already counts them by default)
*/
export async function sumSubTaxonOccs(fileConfig, occCounts, higherTaxonKey, nubKey=0) {
    try {
        console.log(`sumSubTaxonOccs(${higherTaxonKey}, ${nubKey})`);
        let res = await getListSubTaxonKeys(fileConfig, higherTaxonKey);
        let nub = nubKey ? await getBoneSubTaxonKeys(nubKey) : [];
        let sum = 0;
        for (const idx in res.keys) {
            if (nub.keys.find(ele => {return ele ==  res.keys[idx]})) {
                console.log(`sumSubTaxonOccs SKIPPING higherTaxonKey ${res.keys[idx]} equal to nubKey`);
            } else {
                console.log(`sumSubTaxonOccs Adding taxon ${res.keys[idx]}`, occCounts[res.keys[idx]]);
                sum += occCounts[res.keys[idx]] ? occCounts[res.keys[idx]] : 0;
            }
        }
        console.log(`sumSubTaxonOccs(${higherTaxonKey})`, sum);
        res.sum = sum;
        return res;
    } catch(err) {
        console.log(`sumSubTaxonOccs(${higherTaxonKey}) ERROR:`, err);
        return new Error(err)
    }
}
/*
    Iterate over root predicate queries. Sum aggregate occurrence counts across queries.

    To potentially order species-list results across a large number of results, we need an
    ordered list of occurrence counts by taxonKey and taxonRank. The taxonKey facet results
    are a descending-ordered array by occurrence-count, but since we sum those across more
    than one rootPredicate query, list-sums are not necessarily ordered.

    This idea requires that for a specific species-list query, we somehow pre-query all taxonIds
    within it (filtered by user-defined constraints) then compare that list to our ordered list
    of occurrence-counts and present the union, ordered by those counts. This seems impossible
    unless we find a way to retrieve all results for any query all the time.
*/
export async function getAggOccCounts(fileConfig, searchTerm='', occCnts = {}, arrCnts = []) {
    let qrys = fileConfig.predicateToQueries();

    try {
        for (var i=0; i<qrys.length; i++) { //necessary: wait for a synchronous loop
            let qry = `${qrys[i]}&${searchTerm}`;
            let aoc = await getAggOccCount(fileConfig.dataConfig, qry);
            for await (const [key,val] of Object.entries(aoc.obj)) {
                if (occCnts[key]) {occCnts[key] += Number(val);}
                else {occCnts[key] = Number(val);}
            }
            console.log(`getAggOccCounts RESULT`, occCnts);
        }
        return occCnts;
    } catch (err) {
        console.log(`getAggOccCounts ERROR`, err);
        //throw new Error(err)
        return new Error(err);
    }
}
  
/*
    Get occurrence-counts aggregated by facet taxonKey for a filter query.
    Return an object like {taxonKey:count, taxonKey:count, ...}
    https://api.gbif.org/v1/occurrence/search?gadmGid=USA.46_1&limit=0&taxonKey=5&facet=taxonKey&facetLimit=100000
    https://api.gbif.org/v1/occurrence/search?stateProvince=vermont&hasCoordinate=false&limit=0&taxonKey=5&facet=taxonKey&facetLimit=100000
    IMPORTANT NOTE: It appears that this approach returns occurrence counts for nubKeys. Everywhere that uses these must do the same.
*/
export async function getAggOccCount(dataConfig, filter = dataConfig.occurrenceFilter) {
    let reqHost = gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?limit=0&${filter}`;
    let reqFacet = `&facet=taxonKey&facetLimit=1199999`;
    let url = reqHost+reqRoute+reqFilter+reqFacet;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        console.log(`getAggOccCount(${filter}) QUERY:`, enc);
        console.log(`getAggOccCount(${filter}) RESULT:`, json);
        let aCount = json.facets[0].counts; //array of occurrence-counts by taxonKey
        let bCount = [];
        let oCount = {};
        for (var i=0; i<aCount.length; i++) { //put array into object like {taxonKey:count, taxonKey:count, ...}
            oCount[aCount[i].name]=Number(aCount[i].count);
            bCount[i] = {'taxonKey':aCount[i].name, 'occurrences':Number(aCount[i].count)};
        }
        //oCount.query = enc;
        //return oCount;
        return {'obj':oCount, 'arr':bCount, 'count':bCount.length, 'query':enc};
    } catch (err) {
        err.query = enc;
        console.log(`getAggOccCount(${filter}) ERROR:`, err);
        return new Error(err)
    }
}

/*
    Get occurrence-counts aggregated by facet mediaType for a filter query.
    Return an object like {taxonKey:count, taxonKey:count, ...}
    https://api.gbif.org/v1/occurrence/search?gadmGid=USA.46_1&limit=0&taxonKey=5&facet=mediaType&facetLimit=100000
    https://api.gbif.org/v1/occurrence/search?stateProvince=vermont&hasCoordinate=false&limit=0&taxonKey=5&facet=mediaType&facetLimit=100000
    IMPORTANT NOTE: It appears that this approach returns occurrence counts for nubKeys. Everywhere that uses these must do the same.
*/
export async function getAggImgCount(dataConfig, filter = dataConfig.occurrenceFilter) {
    let reqHost = gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?limit=0&${filter}`;
    let reqFacet = `&facet=mediaType&facetLimit=1199999`;
    let url = reqHost+reqRoute+reqFilter+reqFacet;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        console.log(`getAggImgCount(${filter}) RAW RESULT:`, res);
        let json = await res.json();
        //console.log(`getAggImgCount(${filter}) QUERY:`, enc);
        console.log(`getAggImgCount(${filter}) RESULT:`, json);
        let aCount = json.facets[0].counts; //array of occurrence-counts by taxonKey
        let oCount = {};
        for (var i=0; i<aCount.length; i++) { //put array into object like {taxonKey:count, taxonKey:count, ...}
            oCount[aCount[i].name]=Number(aCount[i].count);
        }
        oCount.query = enc;
        return oCount;
    } catch (err) {
        err.query = enc;
        console.log(`getAggImgCount(${filter}) ERROR:`, err);
        return new Error(err)
    }
}

/*
Get an image count from the occurrence API by taxonKey and occurrenceFilter
https://api.gbif.org/v1/occurrence/search?gadm_gid=USA.46_1&taxonKey=9510564&limit=0&facet=mediaType
results are like
{
    offset: 0,
    limit: 0,
    endOfRecords: false,
    count: 217526.
    results: [],
    facets [
    field: "MEDIA_TYPE",
    counts [
        counts[0].name:"StillImage"
        counts[0].count:2837
        counts[1].name:"Sound"
        counts[1].count:149
        counts[2].name:"MovingImage"
        counts[2].count:149
    ]
    ]
}
*/
export async function getImgCount(dataConfig, key) {
    let reqHost = gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?advanced=1&limit=0&${dataConfig.occurrenceFilter}&taxon_key=${key}`
    let reqFacet = `&facet=mediaType`;
    let reqLimit = `&limit=0`;
    let url = reqHost+reqRoute+reqFilter+reqLimit+reqFacet;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        console.log(`getImgCount(${key}) QUERY:`, enc);
        console.log(`getImgCount(${key}) RESULT:`, json);
        let jret = json.facets[0].counts[0];
        jret = typeof jret === 'object' ? jret : {count:0};
        return jret;
    } catch (err) {
        err.query = enc;
        console.log(`getImgCount(${key}) ERROR:`, err);
        return new Error(err)
    }
}