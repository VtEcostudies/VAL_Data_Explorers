/*
REACT EVENT SEARCH SCRIPTS
*/

import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { getStoredData } from '../VAL_Web_Utilities/js/storedData.js';

let siteName = siteConfig.siteName;
let storSite = await getStoredData('siteName', '', '');
if (storSite) {siteName = storSite;}

import(`../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`).then(fileConfig => {
  let dataConfig = fileConfig.dataConfig

  alert( `gbif_lit_widget publishingOrKey: ${dataConfig.publishingOrgKey}`);

  var widgetLocale = 'en';

  var siteTheme = gbifReactComponents.themeBuilder.extend({baseTheme: 'light', extendWith: {
    dense: true,
    primary: '#176f75',
    linkColor: '#176f75',
    fontSize: '15px',
    background: '#E7E7E7',
    paperBackground: '#ffffff',
    paperBorderColor: '#e0e0e0',
    color: '#162d3d',
    darkTheme: false,
    fontFamily: '"Roboto", BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica", "Arial", sans-serif',
    borderRadius: 4,
    drawerZIndex: 50001
  }});

  var userTheme = typeof siteTheme !== 'undefined' ? siteTheme : undefined;
  var userConfig = typeof siteConfig !== 'undefined' ? siteConfig : {};
  var routes = userConfig.routes || {
      literatureSearch: {
      route: '/',
    }
  };

  //sometimes the widget inserts basename into path (eg. on page-reload). detect host and use relevant path.
  if ('vtatlasoflife.org' == dataConfig.hostUrl || 'localhost' == dataConfig.hostUrl.split(':')[0]) {
    routes.basename = '/';
  } else {
    routes.basename = '/gbif-literature';
  }

  //VCE publishingOrganizationKey=b6d09100-919d-4026-b35b-22be3dae7156

  /*
  predicate: {
    type: 'or', predicates: [
      {
        type: 'in',
        key: 'countriesOfResearcher',
        values: ['US', 'VI']
      },
      {
        type: 'in',
        key: 'countriesOfCoverage',
        values: ['US']
      }
    ]
  }
  */

  var literature = {
      rootFilter: {
        predicate: {
          type: 'or', predicates: [
            {
              type: 'in',
              key: 'publishingOrganizationKey',
              values: [dataConfig.publishingOrgKey]
            },
/*
            {
              type: 'in',
              key: 'q',
              values: dataConfig.literatureFilters ? dataConfig.literatureFilters : ''
            }
*/
          ]
        }
      },
      //highlightedFilters: ['q', 'countriesOfResearcher', 'countriesOfCoverage', 'year']
      highlightedFilters: ['q', 'dataSet', 'year'],
      excludedFilters: ['countriesOfCoverage']
    }

  ReactDOM.render(
    React.createElement(gbifReactComponents.LiteratureSearch, {
      style: { 'min-height': 'calc(100vh - 80px)' },
      siteConfig: {
        theme: userTheme,
        routes: routes,
        locale: widgetLocale,
        literature: literature
      },
      pageLayout: true,
    }),
    document.getElementById('root')
  );

})