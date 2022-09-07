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
      literatureSearch: {
      route: '/literature',
    }
  };
  routes.basename = '/gbif-explorer';

  var literature = {
      rootFilter: {
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
      },
      highlightedFilters: ['q', 'countriesOfResearcher', 'countriesOfCoverage', 'year']
    }

ReactDOM.render(
  React.createElement(gbifReactComponents.literatureSearch, {
    style: { height: 'calc(100vh - 59px)' },
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
