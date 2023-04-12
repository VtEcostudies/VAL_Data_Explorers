import { dataConfig } from '../VAL_Web_Utilities/js/gbifDataConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_widget.js"></script>

const gbifPortal = dataConfig.gbifPortal; //'https://hp-vtatlasoflife.gbif.org'; // "https://hp-vtatlasoflife.gbif-staging.org";
const gbifApi = dataConfig.gbifApi; //"https://api.gbif.org/v1";
const datasetKey = dataConfig.datasetKey; //'0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const speciesFilter = dataConfig.speciesFilter; //generalize species filter to be anything allowable in species API
const exploreUrl = dataConfig.exploreUrl;
const resultsUrl = dataConfig.resultsUrl;

console.log('Explorer URL:', exploreUrl);
console.log('Results URL:', resultsUrl);

/*
  https://api.gbif.org/v1/species?name=Turdus%20migratorius
  Lists name usages across all or some checklists that share the exact same canonical name, i.e. without authorship.

  https://api.gbif.org/v1/species/search?q=Turdus%20migratorius
  Full text search of name usages covering the scientific and vernacular name, the species description,
  distribution and the entire classification across all name usages of all or some checklists. Results
  are ordered by relevance as this search usually returns a lot of results.

  https://api.gbif.org/v1/species/suggest?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=Turdus%20migratorius
  A quick and simple autocomplete service that returns up to 20 name usages by doing prefix matching against
  the scientific name. Results are ordered by relevance.

  NOTE: otherParms must be in the form '&key=value&key=value&...'
*/
export async function speciesSearch(searchTerm="", offset=0, limit=20, qField='', otherParms='') {

  let s = searchTerm.split("&"); //allow searchTerm inline query params delmited by &
  for (var i=1; i<s.length; i++) {otherParms += "&" + s[i];}
  searchTerm = s[0]; //arbitrarily assign the q= search param to the first term in the list

  let reqHost = gbifApi;
  let reqRoute = "/species/search";
  let reqQuery = searchTerm?`?q=${searchTerm}&`:'?';
  //let reqFilter = `&datasetKey=${datasetKey}${otherParms}`;
  let reqFilter = speciesFilter;
  let reqQfield = `&qField=${qField}`; //compare the searchTerm to just this field (SCIENTIFIC, VERNACULAR, DESCRIPTION)
  let reqSize = `&offset=${offset}&limit=${limit}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter+reqQfield+otherParms+reqSize;
  let enc = encodeURI(url);

  console.log(`speciesSearch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    console.log(`speciesSearch(${searchTerm}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`speciesSearch(${searchTerm}) ERROR:`, err);
    throw new Error(err)
  }
}

/*
https://api.gbif.org/v1/species/search?qField=VERNACULAR&status=ACCEPTED&q=spotted%20salamander&datasetKey=0b1735ff-6a66-454b-8686-cae1cbc732a2
*/
export async function commonSearch(searchTerm) {
  let reqHost = gbifApi;
  let reqRoute = "/species/search";
  let reqQuery = `?q=${searchTerm}`;
  let reqFilter = `&qField=VERNACULAR&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`commonSearch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    console.log(`commonSearch(${searchTerm}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`commonSearch(${searchTerm}) ERROR:`, err);
    return new Error(err)
  }
}

/*
  https://api.gbif.org/v1/species/match?name=Turdus%20migratorius

  Fuzzy matches scientific names against the GBIF Backbone Taxonomy with the optional classification provided.
  If a classification is provided and strict is not set to true, the default matching will also try to match
  against these if no direct match is found for the name parameter alone.
*/
export async function speciesMatch(searchTerm) {
  let reqHost = gbifApi;
  let reqRoute = "/species/match";
  let reqQuery = `?name=${searchTerm}`;
  let url = reqHost+reqRoute+reqQuery;
  let enc = encodeURI(url);

  console.log(`speciesMatch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    console.log(`speciesMatch(${searchTerm}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`speciesMatch(${searchTerm}) ERROR:`, err);
    return new Error(err)
  }
}

// Navigate to Occurrence Search page with speciesMatch results from html element occ_search
export async function speciesMatchLoadExplorer(searchValue=null) {
  if (!searchValue) {searchValue = document.getElementById("occ_search").value;}
  let frame = document.getElementById("gbif_frame");
  let react = document.getElementById("gbif_react");
  console.log(`speciesMatchLoadExplorer(${searchValue})`);

  let mRes = await speciesMatch(searchValue); //single result: match or null

  if (mRes.usageKey) { //successful match API results always have usageKey (aka nubKey?)
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifPortal}/occurrence/search/?taxonKey=${mRes.result.usageKey}&view=MAP`;}
    else {
      window.location.assign(`${exploreUrl}?taxonKey=${mRes.result.usageKey}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  } else { //send raw text for search
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifPortal}/occurrence/search/?q=${searchValue}&view=MAP`;}
    else {
      window.location.assign(`${exploreUrl}?q=${searchValue}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  }
}

/*
  search for text value and load the results page URL with query param
  NOTE: this can be done 2 ways, with a list of taxonKeys or with ?q=search

  NOTE: this is primarily used with ?q=search. using taxonKeys is a legacy holdover.

  NOTE: taxonKeys is a flag. set to true to send list of taxonKeys to species-explorer
*/
export async function speciesSearchLoadResults(searchValue=null, taxonKeys=0) {

  console.log(`speciesSearchLoadResults(${searchValue})`);

  let sRes = await speciesSearch(searchValue); //includes both scientificName and vernacularName

  let keyQ = ''; //a list of taxonKeys as a query param

  sRes.results.forEach((obj, i) => {
    let key = obj.nubKey ? obj.nubKey : obj.key;
    keyQ += `taxonKey=${key}&`;
  });

  let encKey, encQry = null;

  encKey = encodeURI(`${resultsUrl}?${keyQ}`); //this converts the search to a list of taxonKeys and calls the species-explorer
  encQry = encodeURI(`${resultsUrl}?q=${searchValue}`); //this just passes the same q=search term to the species-explorer

  console.log('Query:', encQry);

  if (taxonKeys) {
    window.location.assign(encKey);
  } else {
    window.location.assign(encQry);
  }
}

/*
  Add listeners to activate search results of search text on Enter key.
*/
function addListeners() {

  if (document.getElementById("species_search")) {
      document.getElementById("species_search").addEventListener("keypress", function(e) {
          //console.log('species_search got keypress', e);
          if (e.which == 13) {
            //alert('gbif_species_search.js event listener for elementId "species_search"');
            let sValue = document.getElementById("species_search").value;
            speciesSearchLoadResults(sValue);
          }
      });
  }
  if (document.getElementById("species_search_button")) {
      document.getElementById("species_search_button").addEventListener("mouseup", function(e) {
        //alert('gbif_species_search.js event listener for elementId "species_search_button"');
        let sValue = document.getElementById("species_search").value;
        speciesSearchLoadResults(sValue);
      });
  }
  if (document.getElementById("occ_search")) {
      document.getElementById("occ_search").addEventListener("keypress", function(e) {
          if (e.which == 13) {
              speciesMatchLoadExplorer();
          }
      });
  }
  if (document.getElementById("occ_search_button")) {
      document.getElementById("occ_search_button").addEventListener("mouseup", function(e) {
          speciesMatchLoadExplorer();
      });
  }
}

addListeners();
//let mRes = await speciesMatch('Turdus migratorius') //test code
//let sRes = await speciesSearch('Turdus migratorius') //test code
//speciesMatchLoadExplorer('Ambystoma maculatum'); //test code
