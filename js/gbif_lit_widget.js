/*
REACT EVENT SEARCH SCRIPTS
*/

import { dataConfig } from '../VAL_Web_Utilities/js/gbifDataConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_widget.js"></script>

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
if ('localhost' == dataConfig.hostUrl) {
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
          }
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
