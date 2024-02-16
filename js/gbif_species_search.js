import { SamePage } from "./gbif_species_results.js";

const eleTxt = document.getElementById("species_search");
const eleBut = document.getElementById("species_search_button");

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