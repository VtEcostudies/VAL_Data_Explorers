const gbifHost = 'https://hp-vtatlasoflife.gbif.org'; // "https://hp-vtatlasoflife.gbif-staging.org";
const explorerUrl = 'https://val.vtatlasoflife.org/gbif-explorer';
const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key

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
export async function speciesSearch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${text_value}`;
  let reqFilter = `&status=ACCEPTED&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
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

//search for text value and reload the page with results in query param
export async function omniSearch(search_value=null) {
  if (!search_value) {search_value = document.getElementById("omni_search").value;}

  let thisUrl = document.URL.split('?')[0]; //the base URL for this page without route params, which we update here

  console.log(`omniSearch(${search_value})`);

  let sRes = await speciesSearch(search_value); //includes both scientificName and vernacularName

  let keys = []; let qryP = '';

  sRes.results.forEach((obj, i) => {
    keys[i] = obj.nubKey ? obj.nubKey : obj.key;
    qryP += `taxonKey=${keys[i]}&`;
  });

  let enc = encodeURI(`${thisUrl}?${qryP}`);

  console.log(enc);

  window.location.assign(enc);
}

/*
  Add listeners to activate search results of search text on Enter key.
*/
function addListeners() {

      if (document.getElementById("omni_search")) {
          document.getElementById("omni_search").addEventListener("keypress", function(e) {
              console.log('omni_search got keypress', e);
              if(e.which == 13){
                  omniSearch();
              }
          });
      }

      if (document.getElementById("occ_search")) {
          document.getElementById("occ_search").addEventListener("keypress", function(e) {
              if(e.which == 13){
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
