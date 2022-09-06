/*
REACT EVENT SEARCH SCRIPTS
*/

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
      occurrenceSearch: {
      route: '/',
    }
  };
  routes.basename = '/gbif-explorer';

  var occurrence = {
    mapSettings: {
      lat: 43.90328996258526,
      lng: -72.63003253932463,
      zoom: 7.757629316135515
    },
    rootPredicate: {
      type: 'or',
      predicates: [
        // first include data from the US in the state of Vermont that do not have coordinates
        {
          "type": "and",
          "predicates": [
            {
              "key": "country",
              "type": "equals",
              "value": "US"
            },
            {
              "type": "in",
              "key": "stateProvince", // state province is a free text field, but this is a good start I would think
              "values": [
                "vermont",
                "vermont (state)"
              ]
            },
            {
              "type": "equals",
              "key": "hasCoordinate",
              "value": false
            }
          ]
        },
        // then include data with coordinates that has the correct GADM code
        {
          "type": "equals",
          "key": "gadmGid",
          "value": "USA.46_1"
        }
      ]
    },
   highlightedFilters: ['q','taxonKey','gadmGid','locality','elevation','year','recordedBy','publishingOrg','datasetName'],
   excludedFilters: ['stateProvince'],
   occurrenceSearchTabs: ['GALLERY', 'MAP', 'TABLE', 'DATASETS'], // what tabs should be shown
   defaultTableColumns: ['features','coordinates','locality','year','basisOfRecord','dataset','publisher','recordedBy','collectionCode','institutionCode'],
 }

var apiKeys = {
   "maptiler": "qcDo0JkF6EBKzpW7hlYB",
}

var maps = {
  locale: 'en', // what language should be used for GBIF base maps? See https://tile.gbif.org/ui/ for available languages in basemaps
  defaultProjection: 'MERCATOR', // what is the default projection
  defaultMapStyle: 'NATURAL', // what is the default style
  mapStyles: {
    MERCATOR: ['NATURAL', 'SATELLITE', 'BRIGHT', 'DARK'],
    PLATE_CAREE: ['NATURAL', 'BRIGHT', 'DARK']
  },
}

ReactDOM.render(
  React.createElement(gbifReactComponents.OccurrenceSearch, {
    style: { height: 'calc(100vh - 59px)' },
    siteConfig: {
      theme: userTheme,
      routes: routes,
      locale: widgetLocale,
      occurrence: occurrence,
      apiKeys: apiKeys,
      maps: maps
    },
    pageLayout: true,
  }),
  document.getElementById('root')
);
