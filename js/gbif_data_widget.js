/*
  GBIF REACT EVENT SEARCH SCRIPTS
*/

import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { getStoredData } from '../../VAL_Web_Utilities/js/storedData.js';
import { townsBasemap } from './gbif_vt_town_tile.js';

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
  console.log('gbif_data_widget | hostUrl', dataConfig.hostUrl);

  //sometimes the widget inserts basename into path (eg. on page-reload). detect host and use relevant path.
  if ('vtatlasoflife.org' == dataConfig.hostUrl || 'localhost' == dataConfig.hostUrl.split(':')[0]) {
    routes.basename = '/';
  } else {
    routes.basename = '/gbif-explorer';
  }

  function getSuggestions({ client }) {
    return {
      gadmGid: {
        // how to get the list of suggestion data, before you would also have to define how to render the suggestion, but the new part I added means that below is enough
        getSuggestions: ({ q }) => {
          const { promise, cancel } = client.v1Get(`/geocode/gadm/search?gadmGid=${dataConfig.gadmGid}&limit=100&q=${q}`); // this gadmGid=USA.46_1 is the new part, that means that the suggester will now only suggest things in Vermont
          return {
            promise: promise.then(response => {
              return {
                data: response.data.results.map(x => ({ title: x.name, key: x.id, ...x }))
              }
            }),
            cancel
          }
        }
      }
    }
  }
  /*
    mapSettings: {
      lat: 43.858297,
      lng: -72.446594,
      zoom: 7.75
    }
  */
  let mapSettings = dataConfig.mapSettings;
  if (!latitude || !longitude) {latitude = mapSettings.lat; longitude = mapSettings.lng;}
  if (!zoomLevel) {zoomLevel = mapSettings.zoom;}
  //Map-view option 1: use mapSettings. Problem: map-view is stored in sessionStorage, so this only works on _blank invocation.
  /*
  console.log('gbifDataWidget dataConfig.mapSettings', mapSettings);
  if (latitude && longitude) {
    mapSettings.lat = Number(latitude); 
    mapSettings.lng = Number(longitude);
  }
  if (zoomLevel) {mapSettings.zoom = zoomLevel;}
  console.log('gbifDataWidget mapSettings', mapSettings);
  */
  //Map-view option 2: Set map view by setting sessionStorage values. This is far better because it works on any invocation.
  if (Storage) {
    if (latitude && longitude) {
      Storage.setItem('mapLat', JSON.stringify(latitude));
      Storage.setItem('mapLng', JSON.stringify(longitude));
    }
    if (zoomLevel) {
      Storage.setItem('mapZoom', JSON.stringify(zoomLevel));
    }
  }

  var occurrence = {
      mapSettings: mapSettings,
      rootPredicate: dataConfig.rootPredicate,
      highlightedFilters: ['q','taxonKey','gadmGid','locality','elevation','year','recordedBy','publishingOrg','datasetName'],
      excludedFilters: ['stateProvince', 'continent', 'country', 'publishingCountry', 'hostingOrganization', 'networkKey', 'publishingProtocol'],
      occurrenceSearchTabs: ['GALLERY', 'MAP', 'TABLE', 'DATASETS'], // what tabs should be shown
      defaultTableColumns: ['features','coordinates','locality','year','month','basisOfRecord','dataset','publisher','recordedBy','collectionCode','institutionCode'],
      getSuggests: getSuggestions,
  }

  var apiKeys = {
    "maptiler": "qcDo0JkF6EBKzpW7hlYB"
  }

  var maps = {
    locale: 'en', // what language should be used for GBIF base maps? See https://tile.gbif.org/ui/ for available languages in basemaps
    defaultProjection: 'MERCATOR', // what is the default projection
    defaultMapStyle: 'SATELLITE', // what is the default style
    mapStyles: {
      MERCATOR: ['NATURAL', 'SATELLITE', 'BRIGHT', 'DARK'],
      PLATE_CAREE: ['NATURAL', 'BRIGHT', 'DARK']
    },
    addMapStyles: function ({ mapComponents }) { // Add your custom style
      return {
        MERCATOR_TOWNS: {
          component: mapComponents.OpenlayersMap,
          labelKey: 'Towns', // the label displayed in the layer selector
          mapConfig: {
            basemapStyle: townsBasemap, //try a local var from local file-include!? `http://the_place_you_host_your_tilejson.com/townsBasemap.json`,
            projection: 'EPSG_3857'
          }
        }
      }
    }
  }

  ReactDOM.render(
    React.createElement(gbifReactComponents.OccurrenceSearch, {
      style: { 'min-height': 'calc(100vh - 80px)' },
      siteConfig: {
        theme: userTheme,
        routes: routes,
        locale: widgetLocale,
        occurrence: occurrence,
        apiKeys: apiKeys,
        maps: maps,
      },
      pageLayout: true,
    }),
    document.getElementById('root')
  );

})
