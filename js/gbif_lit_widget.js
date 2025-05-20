
import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { getStoredData } from '../../VAL_Web_Utilities/js/storedData.js';
import { render } from "https://www-lib.gbif.org/gbif-lib.js";

let siteName = siteConfig.siteName;
let storSite = await getStoredData('siteName', '', '');
if (storSite) {siteName = storSite;}

import(`../../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`).then(fileConfig => {
  let dataConfig = fileConfig.dataConfig

  //console.log( `gbif_lit_widget publishingOrKey: ${dataConfig.publishingOrgKey}`);
/*
  //sometimes the widget inserts basename into path (eg. on page-reload). detect host and use relevant path.
  if ('vtatlasoflife.org' == dataConfig.hostUrl || 'localhost' == dataConfig.hostUrl.split(':')[0]) {
    routes.basename = '/';
  } else {
    routes.basename = '/gbif-literature';
  }
*/
  render(document.getElementById("root"), {
    "version": 3,
    "pages": [
        {
            "id": "literatureSearch"
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
        "borderRadius": 3,
        "stickyOffset": "0px"
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
    "occurrenceSearch": {},
    "collectionSearch": {},
    "institutionSearch": {},
    "datasetSearch": {},
    "publisherSearch": {},
    "literatureSearch": {
        "scope": {
          "type": 'or', 
          "predicates": [
            {
              "type": 'in',
              "key": 'publishingOrganizationKey',
              "values": [dataConfig.publishingOrgKey]
            },
/*
            {
              type: 'in',
              key: 'q',
              values: dataConfig.literatureFilters ? dataConfig.literatureFilters : ''
            }
*/
          ]
        },
      "highlightedFilters": [
          "q",
          "dataSet",
          "year"
        ],
      "excludedFilters": [
        "countriesOfCoverage"
        ],
      }
    })
})