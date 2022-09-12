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
    route: '/',
  }
};
routes.basename = '/gbif-literature';

//VCE publishingOrganizationKey=b6d09100-919d-4026-b35b-22be3dae7156
var literature = {
    rootFilter: {
      predicate: {
        type: 'or', predicates: [
          {
            type: 'in',
            key: 'publishingOrganizationKey',
            values: ['b6d09100-919d-4026-b35b-22be3dae7156']
          }
        ]
      }
    },
    //highlightedFilters: ['q', 'countriesOfResearcher', 'countriesOfCoverage', 'year']
    highlightedFilters: ['q', 'dataSet', 'year']
  }

// By MortenHofft: create a custom suggest
function getSuggests({ client, suggestStyle }) {
  return {
    vceDatasetSuggest: {
      //What placeholder to show
      placeholder: 'search.placeholders.default', //pointing to the translation file
      // how to get the list of suggestion data
      getSuggestions: ({ q }) => client.v1Get(`/dataset/suggest?publishingOrg=b6d09100-919d-4026-b35b-22be3dae7156&limit=8&q=${q}`), // this is the only part we really care to change
      // how to map the results to a single string value
      getValue: suggestion => suggestion.title,
      // how to display the individual suggestions in the list
      render: function DatasetSuggestItem(suggestion) {
        return `<div style={{}}>
          <div style={suggestStyle}>
            {suggestion.title}
          </div>
        </div>`
      }
    },
  };
}

// overwrite the default dataset filter to use the custom suggest
const filters = {
  datasetKey: {
    type: 'SUGGEST',
    config: {
      std: {
        filterHandle: 'datasetKey',
        translations: {
          count: 'filters.datasetKey.count', // translation path to display names with counts. e.g. "3 scientific names"
          name: 'filters.datasetKey.name',// translation path to a title for the popover and the button
          description: 'filters.datasetKey.description', // translation path for the filter description
        },
      },
      specific: {
        suggestHandle: 'vceDatasetSuggest', // <=== this is where we change the suggest
        allowEmptyQueries: true
      }
    }
  }
}

ReactDOM.render(
  React.createElement(gbifReactComponents.LiteratureSearch, {
    style: { 'min-height': 'calc(100vh - 80px)' },
    siteConfig: {
      theme: userTheme,
      routes: routes,
      locale: widgetLocale,
      literature: literature,
      getSuggests: getSuggests,
      filters: filters
    },
    pageLayout: true,
  }),
  document.getElementById('root')
);
