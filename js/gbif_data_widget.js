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

  let mapSettings = dataConfig.mapSettings;
  if (!latitude || !longitude) {latitude = mapSettings.lat; longitude = mapSettings.lng;}
  if (!zoomLevel) {zoomLevel = mapSettings.zoom;}

  //Set map view by setting sessionStorage values. This works on any invocation.
  if (Storage) {
    if (latitude && longitude) {
      Storage.setItem('mapLat', JSON.stringify(latitude));
      Storage.setItem('mapLng', JSON.stringify(longitude));
    }
    if (zoomLevel) {
      Storage.setItem('mapZoom', JSON.stringify(zoomLevel));
    }
  }

  render(document.getElementById("root"), {
    "version": 3,
    "pages": [
        {
            "id": "occurrenceSearch"
            ,"path": window.location.pathname
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
        "borderRadius": 4,
        "stickyOffset": "0px",
        "dense": true,
        "linkColor": '#176f75',
        "fontSize": '15px',
        "background": '#E7E7E7',
        "paperBackground": '#ffffff',
        "paperBorderColor": '#e0e0e0',
        "color": '#162d3d',
        "darkTheme": false,
        "fontFamily": '"Roboto", BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica", "Arial", sans-serif',
        "drawerZIndex": 50001
    },
    "apiKeys": {
      "maptiler": "Krwdtmk1680qXEL04MhP"
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
        "scope": dataConfig.rootPredicate,
        "highlightedFilters": [
            "q",
            "taxonKey",
            "gadmGid",
            "locality",
            "elevation",
            "eventDate",
            "year",
            "month",
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
            "eventDate",
            //"year",
            //"month", //doesn't show when we add this
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
