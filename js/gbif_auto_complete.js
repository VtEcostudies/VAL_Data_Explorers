//import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
//import { getStoredData } from '../../VAL_Web_Utilities/js/storedData.js';

import { getSite } from '../../VAL_Web_Utilities/js/gbifDataConfig.js';
const pageUrl = new URL(document.URL);
var siteName = await getSite(pageUrl);

const filterAtlasSpecies = true;
const listElementId = 'gbif_autocomplete_list'; //the Id of the datalist attached to the input (required)
var inputElementId = null; //the Id of the text input to have autoComplete. only put one on a page, multiple is not tested.

//let siteName = siteConfig.siteName; //default Atlas Site
//let storSite = await getStoredData('siteName', '', ''); //param-set or user-selected Atlas Site
//if (storSite) {siteName = storSite;}
let fileConfig = import(`../../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`); //promise handled below

fileConfig.then(fileConfig => {
    console.log('gbif_auto_complete | siteName:', siteName);
    const speciesDatasetKey = fileConfig.dataConfig.speciesDatasetKey; //'0b1735ff-6a66-454b-8686-cae1cbc732a2';
    console.log('gbif_auto_complete | speciesDatasetKey:', speciesDatasetKey);

    if (document.getElementById('occ_search')) {
        listenerInit('occ_search')
    }
    if (document.getElementById('species_search')) {
        listenerInit('species_search')
    }
    if (document.getElementById('results_search')) {
        listenerInit('results_search')
    }
    if (document.getElementById('omni_search')) {
        //listenerInit('results_search')???
        listenerInit('omni_search')
    }
      
    function listenerInit(elementId=null) {
        console.log('gbif_auto_complete=>listenerInit (before window.load) | elementId:', elementId);
        //NOTE: 2024-08-29 sometimes it appears we don't get a window.load here. Maybe since we've
        //already waited to load gbifDataConfig, it's not necessary to wait for a load event?
        //window.addEventListener("load", function() {
      
            // Add a keyup event listener to our input element
            var name_input = document.getElementById(elementId);
            if (name_input) {
              console.log(`gbif_auto_complete=>listenerInit (after window.load) | elementId:`, elementId);
              inputElementId = elementId;
              name_input.addEventListener("keyup", function(event) {gbifAutoComplete(event);});
      
              // create one global XHR object
              // this allows us to abort pending requests when a new one is made
              window.gbifXHR = new XMLHttpRequest();
            } 
            else {
              console.log(`gbif_auto_complete=>listenerInit WARNING: html element '${elementId}' not found.`)
            }
        //});
      }
        
    /*
    * Main callback function to handle Autocomplete input for text input with list
    */
    function gbifAutoComplete(event) {
        var auto_list = false;
        var input = false;
        var visi_list = false;
        var load_status = false;

        if (document.getElementById('event_key')) {document.getElementById('event_key').innerHTML = `event key: ${event.key}`;}

        //check event key and don't process some buttons to allow drop-down selection
        if (!validNameInput(event.key)) {
            return;
        }

        // retrieve the input element
        input = document.getElementById(inputElementId);

        // retrieve the datalist element
        auto_list = document.getElementById(listElementId);

        // retrieve the text area list element
        if (document.getElementById('visi_list')) {
            visi_list = document.getElementById('visi_list');
        }

        // retrieve the load status label and set text
        if (document.getElementById('load_status')) {
            load_status = document.getElementById('load_status');
            load_status.value = `Loading...`;
        }

        //need at least one character to search...
        if (input.value.length < 1) {
            // clear any previously loaded options in the datalist
            auto_list.innerHTML = "";
            if (visi_list) {visi_list.value = "";}
            return;
        } else {

            // abort any pending requests
            window.gbifXHR.abort();

            window.gbifXHR.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {

                    // We're expecting a json response so we convert it to an object
                    var response = JSON.parse( this.responseText );

                    // clear any previously loaded options in the datalist
                    auto_list.innerHTML = "";
                    if (visi_list) {visi_list.value = "";}

                    //update the request status message
                    if (load_status) {//load_status.value = "";
                    }

                    response.forEach(function(item) {
                        // Create a new <option> element.  ***THE ARGUMENT MUST BE 'option'***
                        var option = document.createElement('option', { is : 'gbif_autocomplete_option' }); //***THE ARGUMENT MUST BE 'option'***
                        option.value = item.canonicalName;
                        option.setAttribute('taxonKey', item.key);
                        option.setAttribute('canonicalName', item.canonicalName);
                        option.setAttribute('scientificName', item.scientificName);
                        option.setAttribute('allData', JSON.stringify(item));

                        // attach the option to the datalist element
                        auto_list.appendChild(option);
                        if (visi_list) {visi_list.value += item.canonicalName + String.fromCharCode(13);}
                    });
                }
            };
            var api_url = "https://api.gbif.org/v1/species/suggest?q=" + input.value;
            if (filterAtlasSpecies) {api_url = api_url + `&datasetKey=${speciesDatasetKey}&advanced=1`;}
            if (document.getElementById('api_query')) {document.getElementById('api_query').innerHTML=api_url;}
            //console.log(`GBIF Species-suggest API query: ${api_url}`);
            window.gbifXHR.open("GET", api_url, true);
            window.gbifXHR.send();
        }
    }
})

function validNameInput(str) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(str)) {
        return false;
    }
    return true;
}

function getSelectedItemData(dataItem) {
    var data = null;

    // Get the input element
    var auto_name = document.getElementById('occ_search');
    // Get the datalist
    var auto_list = document.getElementById('gbif_autocomplete_list');

    // If we find the input inside our list, get the taxonKey, else return null
    for (var element of auto_list.children) {
        //if (element.value.toLowerCase == auto_name.value.toLowerCase) {
        if (element.value == auto_name.value) {
            data = element.getAttribute(dataItem);
        }
    }

    return data;
}

export function getTaxonKey() {
    return getSelectedItemData('taxonKey');
}

export function getCanonicalName() {
    return getSelectedItemData('canonicalName');
}

export function getScientificName() {
    return getSelectedItemData('scientificName');
}

export function getAllData() {
    return JSON.parse(getSelectedItemData('allData'));
}

/*
 * Optional listener to button press to retrieve taxon key for a chosen value.
 */
if (document.getElementById('getTaxonKey')) {
    window.addEventListener("load", function() {

        if (document.getElementById("getTaxonKey")) {
            // Add a listener to handle the 'Get Taxon Key' button click
            document.getElementById("getTaxonKey").addEventListener("click", function() {
                var data = getAllData();
                var info = '';
                Object.keys(data).forEach(function(key) {
                    info += `${key}: ${data[key]}` + String.fromCharCode(13);
                });
                alert(info);
            });
        }
    });
}
