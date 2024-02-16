import { SamePage } from "./gbif_species_results.js";

const eleTxt = document.getElementById("species_search");
const eleBut = document.getElementById("species_search_button");
const gbifApi = "https://api.gbif.org/v1";
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

  searchTerm must be &-delimited key=value search params like 'higherTaxonKey=1234&rank=FAMILY'
  qField is what to compare the searchTerm to: (SCIENTIFIC, VERNACULAR, DESCRIPTION)
  otherParms must be in the form '&key=value&key=value&...'

*/
export async function speciesSearch(dataConfig, searchTerm="", offset=0, limit=20, qField='', otherParms='') {
  console.log('gbif_species_search::speciesSearch | dataConfig:', dataConfig);

  let s = searchTerm.split("&"); //allow searchTerm inline query params delimited by &
  for (var i=1; i<s.length; i++) {otherParms += "&" + s[i];}
  searchTerm = s[0]; //arbitrarily assign the q= search param to the first term in the list

  let reqHost = gbifApi;
  let reqRoute = "/species/search";
  let reqQuery = searchTerm ? `?q=${searchTerm}&` : '?';
  let reqFilter = dataConfig.speciesFilter; //can be a species datasetKey, a list of taxa, or something else
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
  Add listeners to activate search results of search text on Enter key.
*/
function addListeners() {

  if (eleTxt) {
      eleTxt.addEventListener("keypress", function(e) {
          //console.log('species_search got keypress', e);
          if ("Enter" == e.key) { //(e.which == 13) {
            let sValue = eleTxt.value;
            SamePage(sValue);
          }
      });
  }
  if (eleBut && eleTxt) {
      eleBut.addEventListener("mouseup", function(e) {
        let sValue = eleTxt.value;
        SamePage(sValue);
      });
  }
}

addListeners();