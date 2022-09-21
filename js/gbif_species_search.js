const gbifHost = 'https://hp-vtatlasoflife.gbif.org'; // "https://hp-vtatlasoflife.gbif-staging.org";
const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
var explorerUrl = `${thisUrl.protocol}//${thisUrl.host}/gbif-explorer`;
var resultsUrl = `${thisUrl.protocol}//${thisUrl.host}/gbif-species-explorer`;
if ('localhost' == hostUrl) {
  explorerUrl = 'https://val.vtecostudies.org/gbif-explorer';
  resultsUrl = 'http://localhost/results.html';
}
const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key

console.log('HOST URL:', hostUrl);
console.log('Explorer URL:', explorerUrl);
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
export async function speciesSearch(searchTerm="", offset=0, limit=20, otherParms='') {

  let s = searchTerm.split("&"); //allow searchTerm inline query params delmited by &
  for (var i=1;i<s.length;i++) {otherParms += "&" + s[i];}
  searchTerm = s[0];

  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${searchTerm}`;
  let reqFilter = `&datasetKey=${datasetKey}${otherParms}`;
  let reqSize = `&offset=${offset}&limit=${limit}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter+reqSize;
  let enc = encodeURI(url);

  console.log(`speciesSearch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesSearch(${searchTerm}) QUERY:`, enc);
    console.log(`speciesSearch(${searchTerm}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`speciesSearch(${searchTerm}) QUERY:`, enc);
    console.log(`speciesSearch(${searchTerm}) ERROR:`, err);
    err.query = enc;
    throw new Error(err)
  }
}

/*
https://api.gbif.org/v1/species/search?qField=VERNACULAR&status=ACCEPTED&q=spotted%20salamander&datasetKey=0b1735ff-6a66-454b-8686-cae1cbc732a2
*/
export async function commonSearch(searchTerm) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${searchTerm}`;
  let reqFilter = `&qField=VERNACULAR&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`commonSearch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`commonSearch(${searchTerm}) QUERY:`, enc);
    console.log(`commonSearch(${searchTerm}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`commonSearch(${searchTerm}) QUERY:`, enc);
    console.log(`commonSearch(${searchTerm}) ERROR:`, err);
    err.query = enc;
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
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/match";
  let reqQuery = `?name=${searchTerm}`;
  let url = reqHost+reqRoute+reqQuery;
  let enc = encodeURI(url);

  console.log(`speciesMatch(${searchTerm})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesMatch(${searchTerm}) QUERY:`, enc);
    console.log(`speciesMatch(${searchTerm}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`speciesMatch(${searchTerm}) QUERY:`, enc);
    console.log(`speciesMatch(${searchTerm}) ERROR:`, err);
    err.query = enc;
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
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?taxonKey=${mRes.result.usageKey}&view=MAP`;}
    else {
      await window.location.assign(`${explorerUrl}?taxonKey=${mRes.result.usageKey}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  } else { //send raw text for search
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?q=${searchValue}&view=MAP`;}
    else {
      await window.location.assign(`${explorerUrl}?q=${searchValue}&view=MAP`);
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
