import { dataConfig, predicateToQueries } from "./gbif_data_config.js";

const Storage = sessionStorage; //localStorage;

//wrap retrieval of occ counts in this async function to return a promise, which elsewhere waits for data
export async function getStoredOccCnts() {
    let sOccCnts; let storeName = `occCnts-${dataConfig.atlasAbbrev}`;
        if (Storage.getItem(storeName)) {
        sOccCnts = JSON.parse(Storage.getItem(storeName));
        console.log(`Storage.getItem(${storeName}) returned`, sOccCnts);
    } else {
        sOccCnts = getAggOccCounts(); //returns a promise. handle that downstream with occs.then(occs => {}).
        console.log(`getAccOccCounts returned`, sOccCnts); //this returns 'Promise { <state>: "pending" }'
        sOccCnts.then(occCnts => { //convert promise to data object...
        Storage.setItem(storeName, JSON.stringify(occCnts));
        });
    }
    return sOccCnts; //return a JSON data object from async function wraps the object in a promise. the caller should await or .then() it.
}

/*
    Iterate over root predicate queries. Sum aggregate occurrence counts across queries.
*/
export async function getAggOccCounts(occCnts = {}) {
    let qrys = predicateToQueries();

    try {
        for (var i=0; i<qrys.length; i++) { //necessary: wait for a synchronous loop
            let qry = qrys[i]
            let aoc = await getAggOccCount(qry);
            for await (const [key,val] of Object.entries(aoc)) {
                if (occCnts[key]) {occCnts[key] += Number(val);}
                else {occCnts[key] = Number(val);}
            }
            console.log(`getAggOccCounts RESULT`, qry, aoc, occCnts);
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
export async function getAggOccCount(filter = dataConfig.occurrenceFilter) {
    let reqHost = dataConfig.gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?limit=0&${filter}&facet=taxonKey&facetLimit=1199999`
    let url = reqHost+reqRoute+reqFilter;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        //console.log(`getAggOccCount(${filter}) QUERY:`, enc);
        //console.log(`getAggOccCount(${filter}) RESULT:`, json);
        let aCount = json.facets[0].counts; //array of occurrence-counts by taxonKey
        let oCount = {};
        for (var i=0; i<aCount.length; i++) { //put array into object like {taxonKey:count, taxonKey:count, ...}
            oCount[aCount[i].name]=Number(aCount[i].count);
        }
        oCount.query = enc;
        return oCount;
    } catch (err) {
        err.query = enc;
        console.log(`getAggOccCount(${filter}) ERROR:`, err);
        return new Error(err)
    }
}

/*
    Get occurrence-counts aggregated by facet taxonKey for a filter query.
    Return an object like {taxonKey:count, taxonKey:count, ...}
    https://api.gbif.org/v1/occurrence/search?gadmGid=USA.46_1&limit=0&taxonKey=5&facet=taxonKey&facetLimit=100000
    https://api.gbif.org/v1/occurrence/search?stateProvince=vermont&hasCoordinate=false&limit=0&taxonKey=5&facet=taxonKey&facetLimit=100000
    IMPORTANT NOTE: It appears that this approach returns occurrence counts for nubKeys. Everywhere that uses these must do the same.
*/
export async function getAggOImgCount(filter = dataConfig.occurrenceFilter) {
    let reqHost = dataConfig.gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?limit=0&${filter}`
    let reqFacet = `&facet=mediaType&facetLimit=1199999`
    let url = reqHost+reqRoute+reqFilter;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        console.log(`getAggOImgCount(${filter}) RAW RESULT:`, res);
        let json = await res.json();
        //console.log(`getAggOImgCount(${filter}) QUERY:`, enc);
        console.log(`getAggOImgCount(${filter}) RESULT:`, json);
        let aCount = json.facets[0].counts; //array of occurrence-counts by taxonKey
        let oCount = {};
        for (var i=0; i<aCount.length; i++) { //put array into object like {taxonKey:count, taxonKey:count, ...}
            oCount[aCount[i].name]=Number(aCount[i].count);
        }
        oCount.query = enc;
        return oCount;
    } catch (err) {
        err.query = enc;
        console.log(`getAggOImgCount(${filter}) ERROR:`, err);
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
export async function getImgCount(key) {
    let reqHost = dataConfig.gbifApi;
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

/*
This is deprecated in favor of getAggOccCounts.
*/
async function getOccCountsByKey(key) {
    let qrys = predicateToQueries();
    var occs = 0;

    try {
        //await qrys.forEach(async qry => {
        for (var i=0; i<qrys.length; i++) { //again, this is how to wait for a synchronous loop. batshit crazy.
        let occ = await getOccCountByKey(key, qrys[i]);
        occs += occ.count;
        //console.log(`getOccCountsByKey RESULT`, qrys[i], occ, occs);
        }
        return {"count":occs}
    } catch (err) {
        console.log(`getOccCountsByKey ERROR`, err);
        throw new Error(err)
    }
}

/*
This is deprecated in favor of getAggOccCount.
get an occurrence count from the occurrence API by taxonKey occurrenceFilter
*/
async function getOccCountByKey(key, filter = dataConfig.occurrenceFilter) {
    let reqHost = dataConfig.gbifApi;
    let reqRoute = "/occurrence/search";
    let reqFilter = `?advanced=1&limit=0&${filter}&taxon_key=${key}`
    let url = reqHost+reqRoute+reqFilter;
    let enc = encodeURI(url);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        //console.log(`getOccCountByKey(${key}) QUERY:`, enc);
        //console.log(`getOccCountByKey(${key}) RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`getOccCountByKey(${key}) ERROR:`, err);
        return new Error(err)
    }
}
