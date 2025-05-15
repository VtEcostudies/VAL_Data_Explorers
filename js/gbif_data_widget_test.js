/*
  GBIF REACT EVENT SEARCH SCRIPTS
*/

import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { getStoredData } from '../../VAL_Web_Utilities/js/storedData.js';
import { townsBasemap } from './gbif_vt_town_tile.js';
import { render } from "https://www-lib.gbif.org/gbif-lib.js";

/*
sessionStorage: cleared when page session ends: when the page is closed
localStorage: stored data is saved across browser sessions
localStorage data for a document loaded in a "private browsing" or "incognito" session is cleared when the last "private" tab is closed.
*/
var Storage = window.sessionStorage ? sessionStorage : false;

let siteName = siteConfig.siteName;
let storSite = await getStoredData('siteName', '', '');
if (storSite) {siteName = storSite;}

/*
  Wordpress reserves the query parameter 'year' so we can't use it directly.
  Instead, pass the param 'gbif-year'. Here we replace it with 'year' just
  before invoking the OcurrenceSearch widget.
*/
let url = new URL(location);
let gbifYear = url.searchParams.get('gbif-year');
if (gbifYear) {
  if (history.replaceState) {
    console.log(`gbif_data_widget | GBIF OccurrenceSearch RECEIVED queryParam 'gbif-year' | REPLACING WITH 'year'...`)
    url.searchParams.set('year', gbifYear);
    //url.searchParams.delete('gbif-year');
    history.replaceState({}, "", url);  
  } else {
    let msg = `WEB BROWSER IS NOT HTML5 COMPATIBLE. CANNOT RELOAD PAGE CONTENTS REPLACING 'gbif-year' WITH 'year'.`
    console.log(`gbif_data_widget | ${msg}`);
    alert(msg);
    //location.url = url;
  }
}
let latitude = Number(url.searchParams.get('lat'));
let longitude = Number(url.searchParams.get('lon'));
let zoomLevel = Number(url.searchParams.get('zoom'));
console.log('gbifDataWidget MAP QUERY PARAMS', latitude, longitude, zoomLevel);

import(`../../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`).then(fileConfig => {
  let dataConfig = fileConfig.dataConfig
  var apiKeys = {
    "maptiler": "qcDo0JkF6EBKzpW7hlYB"
  }
  render(document.getElementById("root"), {
    "version": 3,
    "pages": [
        {
            "id": "occurrenceSearch"
            ,"path": window.location.pathname
            //,"path": "/_occurrences_test.html"
        }
    ],
    "disableInlineTableFilterButtons": false,
    "availableCatalogues": [],
    "dataHeader": {
        "enableApiPopup": false,
        "enableInfoPopup": false
    },
    "theme": {
        "primary": "#176f75",
        "borderRadius": 3,
        "stickyOffset": "0px",
        },
    "apiKeys": {
      "maptiler": "qcDo0JkF6EBKzpW7hlYB"
    },
    "maps": {
        "locale": "en",
        "mapStyles": {
            "defaultProjection": "MERCATOR",
            "defaultMapStyle": "SATELLITE",
            "options": {
                "MERCATOR": [
                    "NATURAL",
                    "SATELLITE",
                    "BRIGHT",
                    "DARK"
                ],
                "PLATE_CAREE": [
                    "NATURAL",
                    "BRIGHT",
                    "DARK"
                ]
            }
        }
    },
    "languages": [
        {
            "code": "en",
            "localeCode": "en",
            "label": "English",
            "default": true,
            "textDirection": "ltr",
            "iso3LetterCode": "eng",
            "cmsLocale": "en-GB",
            "gbifOrgLocalePrefix": ""
        }
    ],
    "messages": {},
    "occurrenceSearch": {
        "scope": {
            "type": "or",
            "predicates": [
                {
                    "type": "and",
                    "predicates": [
                        {
                            "type": "equals",
                            "key": "country",
                            "value": "US"
                        },
                        {
                            "type": "in",
                            "key": "stateProvince",
                            "values": [
                                "vermont",
                                "vermont (state)"
                            ]
                        },
                        {
                            "type": "equals",
                            "key": "hasCoordinate",
                            "value": false
                        },
                        {
                            "type": "equals",
                            "key": "occurrenceStatus",
                            "value": "PRESENT"
                        }
                    ]
                },
                {
                    "type": "and",
                    "predicates": [
                        {
                            "type": "equals",
                            "key": "gadmGid",
                            "value": "USA.46_1"
                        },
                        {
                            "type": "equals",
                            "key": "occurrenceStatus",
                            "value": "PRESENT"
                        }
                    ]
                }
            ]
        },
        "highlightedFilters": [
            "q",
            "taxonKey",
            "gadmGid",
            "locality",
            "elevation",
            "year",
            "recordedBy",
            "publishingOrg"
        ],
        "excludedFilters": [
            "stateProvince",
            "continent",
            "country",
            "publishingCountry",
            "hostingOrganizationKey",
            "networkKey",
            "protocol"
        ],
        "defaultEnabledTableColumns": [
            "features",
            "coordinates",
            "locality",
            "year",
            "month",
            "basisOfRecord",
            "dataset",
            "publisher",
            "recordedBy",
            "collectionCode",
            "institutionCode"
        ],
        "tabs": [
            "gallery",
            "map",
            "table",
            "datasets",
            "download"
        ],
        "mapSettings": {
            "lat": 43.858297,
            "lng": -72.446594,
            "zoom": 7.75
        }
    },
    "collectionSearch": {},
    "institutionSearch": {},
    "datasetSearch": {},
    "publisherSearch": {},
    "literatureSearch": {}
  });

})
