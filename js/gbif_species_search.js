const gbifHost = 'https://hp-vtatlasoflife.gbif.org'; // "https://hp-vtatlasoflife.gbif-staging.org";
const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
var explorerUrl = `${thisUrl.protocol}/${thisUrl.host}/gbif-explorer/`; if ('localhost' == hostUrl) {explorerUrl='https://val.vtecostudies.org/gbif-explorer';}
var resultsUrl = `${thisUrl.protocol}/${thisUrl.host}/gbif-species-results/`; if ('localhost' == hostUrl) {resultsUrl='http://localhost/results.html';}
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
*/
export async function speciesSearch(text_value, offset=0, limit=20) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${text_value}`;
  let reqFilter = `&status=ACCEPTED&datasetKey=${datasetKey}`;
  let reqSize = `&offset=${offset}&limit=${limit}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter+reqSize;
  let enc = encodeURI(url);

  console.log(`speciesSearch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesSearch(${text_value}) QUERY:`, enc);
    console.log(`speciesSearch(${text_value}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`speciesSearch(${text_value}) QUERY:`, enc);
    console.log(`speciesSearch(${text_value}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

/*
https://api.gbif.org/v1/species/search?qField=VERNACULAR&status=ACCEPTED&q=spotted%20salamander&datasetKey=0b1735ff-6a66-454b-8686-cae1cbc732a2
*/
export async function commonSearch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${text_value}`;
  let reqFilter = `&qField=VERNACULAR&status=ACCEPTED&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`commonSearch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`commonSearch(${text_value}) QUERY:`, enc);
    console.log(`commonSearch(${text_value}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`commonSearch(${text_value}) QUERY:`, enc);
    console.log(`commonSearch(${text_value}) ERROR:`, err);
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
export async function speciesMatch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/match";
  let reqQuery = `?name=${text_value}`;
  let url = reqHost+reqRoute+reqQuery;
  let enc = encodeURI(url);

  console.log(`speciesMatch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesMatch(${text_value}) QUERY:`, enc);
    console.log(`speciesMatch(${text_value}) RESULT:`, json);
    json.query = enc;
    return json;
  } catch (err) {
    console.log(`speciesMatch(${text_value}) QUERY:`, enc);
    console.log(`speciesMatch(${text_value}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

// Navigate to Occurrence Search page with speciesMatch results from html element occ_search
export async function speciesMatchLoadExplorer(search_value=null) {
  if (!search_value) {search_value = document.getElementById("occ_search").value;}
  let frame = document.getElementById("gbif_frame");
  let react = document.getElementById("gbif_react");
  console.log(`speciesMatchLoadExplorer(${search_value})`);

  let mRes = await speciesMatch(search_value); //single result: match or null

  if (mRes.usageKey) { //successful match API results always have usageKey (aka nubKey?)
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?taxonKey=${mRes.result.usageKey}&view=MAP`;}
    else {
      await window.location.assign(`${explorerUrl}?taxonKey=${mRes.result.usageKey}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  } else { //send raw text for search
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?q=${search_value}&view=MAP`;}
    else {
      await window.location.assign(`${explorerUrl}?q=${search_value}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  }
}

/*
  search for text value and reload the current URL with results in query param
  NOTE: this can be done 2 ways, with a list of keys or with ?q=search

  Now that the search results code can handle the plain search term, use that.
*/
export async function omniSearchLoadResults(search_value=null) {
  if (!search_value) {search_value = document.getElementById("omni_search").value;}

  let thisUrl = document.URL.split('?')[0]; //the base URL for this page without route params, which we update here

  console.log(`omniSearchLoadResults(${search_value})`);

  let sRes = await speciesSearch(search_value); //includes both scientificName and vernacularName

  let keyQ = ''; //a list of taxonKeys as a query param

  sRes.results.forEach((obj, i) => {
    let key = obj.nubKey ? obj.nubKey : obj.key;
    keyQ += `taxonKey=${key}&`;
  });

  let encKey, encQry = null;

  encKey = encodeURI(`${resultsUrl}?${keyQ}`);
  encQry = encodeURI(`${resultsUrl}?q=${search_value}`);

  console.log('Query:', encQry);

  window.location.assign(encQry);
}

/*
  Add listeners to activate search results of search text on Enter key.
*/
function addListeners() {

  if (document.getElementById("species_search")) {
      document.getElementById("species_search").addEventListener("keypress", function(e) {
          //console.log('species_search got keypress', e);
          if (e.which == 13) {
              let sValue = document.getElementById("species_search").value;
              omniSearchLoadResults(sValue);
          }
      });
  }

  if (document.getElementById("species_search_button")) {
      document.getElementById("species_search_button").addEventListener("mouseup", function(e) {
        let sValue = document.getElementById("species_search").value;
        omniSearchLoadResults(sValue);
      });
  }

  if (document.getElementById("omni_search")) {
      document.getElementById("omni_search").addEventListener("keypress", function(e) {
          //console.log('omni_search got keypress', e);
          if (e.which == 13) {
            let sValue = document.getElementById("omni_search").value;
            omniSearchLoadResults(sValue);
          }
      });
  }

  if (document.getElementById("omni_search_button")) {
      document.getElementById("omni_search_button").addEventListener("mouseup", function(e) {
        let sValue = document.getElementById("omni_search").value;
        omniSearchLoadResults(sValue);
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
