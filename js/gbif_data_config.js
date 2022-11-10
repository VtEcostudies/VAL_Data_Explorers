/*
Define here the views and scope of data available to the
  - GBIF data explorer (gbif_data_widget.js)
  - GBIF literature explorer (gbif_lit_widget.js)
  - VAL GBIF species explorer (gbif_species_search.js, gbif_species_results.js)
  - VAL GBIF species search/autocomplete (gbif_speceies_search.js, gbif_auto_complete.js)
  - VAL GBIF dashboard stats (gbif_data_stats.js)
*/
import { siteConfig } from './gbif_site_config.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>

const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
const urlPath = thisUrl.pathname;
var urlRouts = urlPath.split('/'); //path contains route and file
console.log('gbif_data_config.js | urlRouts', urlRouts);
var urlRout = false;
if (urlRouts[urlRouts.length-1].includes('.htm')) {urlRout = urlRouts.splice(0, urlRouts.length-1).join('/');}
else {urlRout = urlRouts.splice(0, urlRouts.length).join('/');}
if (!urlRout.endsWith('/')) {urlRout += '/';}
//var urlRout = urlRouts.splice(0, urlRouts.length-1).join('/'); //Note urlRout has leading '/'. Keep it to handle an empty urlRout.
var exploreEnd = 'gbif-explorer'; //occurrences
var resultsEnd = 'gbif-species-explorer';
var literatEnd = 'gbif-literature-explorer';
var publishEnd = 'gbif-publishers';
if ('vtatlasoflife.org' == hostUrl || 'localhost' == hostUrl) {
  exploreEnd = 'occurrences.html';
  resultsEnd = 'results.html';
  literatEnd = 'literature.html';
  publishEnd = 'publishers.html';
}
const exploreUrl = `${thisUrl.protocol}//${hostUrl}${urlRout}${exploreEnd}`;
const resultsUrl = `${thisUrl.protocol}//${hostUrl}${urlRout}${resultsEnd}`;
const literatUrl = `${thisUrl.protocol}//${hostUrl}${urlRout}${literatEnd}`;
const publishUrl = `${thisUrl.protocol}//${hostUrl}${urlRout}${publishEnd}`;
console.log('gbif_data_config.js | hostUrl', hostUrl);
console.log('gbif_data_config.js | urlPath', urlPath);
console.log('gbif_data_config.js | urlRout', urlRout);
console.log('gbif_data_config.js | exploreUrl', exploreUrl);
console.log('gbif_data_config.js | resultsUrl', resultsUrl);
//const apiColumns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences','images'];
const columns = ['canonicalName','vernacularNames','rank','taxonomicStatus','higherClassificationMap','occurrences','images'];
const columNames = {
  'key':'GBIF Key',
  'nubKey':'GBIF Nub Key',
  'canonicalName':'Scientific Name',
  'vernacularNames':'Common Names',
  'rank':'Rank',
  'taxonomicStatus':'Status',
  'parent':'Parent Name',
  'higherClassificationMap':'Parent Taxa',
  'occurrences':'Occurrences',
  'images':'Images'
};

const config = {
  val: { //Vermont Atlas of Life
    atlasPlace: 'Vermont',
    atlasName: 'Vermont Atlas of Life',
    atlasAbbrev: 'VAL',
    helpDeskUrl: 'https://vtatlasoflife.freshdesk.com/support/tickets/new',
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: 'https://hp-vtatlasoflife.gbif.org',
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: 'USA.46_1', //'Vermont' GADM administrative bounding region
    datasetKey: '0b1735ff-6a66-454b-8686-cae1cbc732a2', //Species Dataset Key
    publishingOrgKey: 'b6d09100-919d-4026-b35b-22be3dae7156', //VCE key
    occurrenceFilter: 'gadm_gid=USA.46_1',
    columns: columns,
    columNames: columNames,
    mapSettings: {
      lat: 43.9,
      lng: -72.6,
      zoom: 7.75
    },
    rootPredicate: {
      type: 'or',
      predicates: [
        // first include occurrences from the Country and Region that do not have coordinates
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
        // then include data having coordinates that has the correct GADM code
        {
          "type": "equals",
          "key": "gadmGid",
          "value": "USA.46_1"
        }
      ]
    }
  },

  /*
  https://www.gbif.org/occurrence/search?has_geospatial_issue=false&geometry=POLYGON((-70.88477 41.33702,-70.82729 41.20741,-70.69115 41.31884,-70.4219 41.3302,-70.41887 41.41874,-70.59434 41.51395,-70.88477 41.33702))
  */
  mva: { //Martha's Vineyard Atlas of Life
    atlasPlace: 'Marthas Vineyard',
    atlasName: 'Marthas Vineyard Atlas of Life',
    atlasAbbrev: 'MVAL',
    helpDeskUrl: false,
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: 'USA.22.4_1', //'Dukes County, MA' GADM administrative bounding region
    datasetKey: '298a29ef-a66a-4330-93a1-ea59482e25d9', //Martha's Vineyard Regional Species List Dataset Key
    publishingOrgKey: false, //MVAL is not a GBIF Publisher. Yet.
    occurrenceFilter: 'geometry=POLYGON((-70.88477 41.33702,-70.82729 41.20741,-70.69115 41.31884,-70.4219 41.3302,-70.41887 41.41874,-70.59434 41.51395,-70.88477 41.33702))',
    columns: columns,
    columNames: columNames,
    mapSettings: {
      lat: 41.4,
      lng: -70.6,
      zoom: 12
    },
    rootPredicate: {
      type: 'or',
      predicates: [
        // first include occurrences from the Country and Region that do not have coordinates
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
              "key": "locality",
              "values": [
                "Marthas Vineyard",
                "Martha's Vineyard"
              ]
            },
            {
              "type": "equals",
              "key": "hasCoordinate",
              "value": false
            }
          ]
        }
        // Include data having coordinates within an administrative area. Duke's County, MA includes
        // the Vineyard and the Elizabethans.
  /*
        ,{
          "type": "equals",
          "key": "gadmGid",
          "value": "USA.22.4_1"
        }
  */
        // Include data having coordinates within a bounding box. Here we drew a rough box around the
        // Vineyard out to about 1 mile of surrounding salt water.
        ,{
          "type": "within",
          "key": "geometry",
          "value": "POLYGON((-70.88477 41.33702,-70.82729 41.20741,-70.69115 41.31884,-70.4219 41.3302,-70.41887 41.41874,-70.59434 41.51395,-70.88477 41.33702))"
        }
      ]
    }
  },

  fma: { //Chicago Field Museum
    atlasPlace: 'Field Museum',
    atlasName: 'Field Museum Atlas',
    atlasAbbrev: 'FMA',
    helpDeskUrl: false,
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: '', // World GADM administrative bounding region?
    datasetKey: 'ad8da44f-646f-4244-a6d0-5d1085ec6984', //Species Dataset Key
    publishingOrgKey: '7b8aff00-a9f8-11d8-944b-b8a03c50a862', //FMA publ key
    occurrenceFilter: 'publishing_org=7b8aff00-a9f8-11d8-944b-b8a03c50a862',
    columns: columns,
    columNames: columNames,
    mapSettings: {
      lat: 41.885,
      lng: -87.636,
      zoom: 2
    },
    rootPredicate: {
      type: 'or',
      predicates: [
        // include data for publishing_org=7b8aff00-a9f8-11d8-944b-b8a03c50a862
        {
          "type": "equals",
          "key": "publishingOrg",
          "value": "7b8aff00-a9f8-11d8-944b-b8a03c50a862"
        }
      ]
    }
  }
}

export const dataConfig = config[siteConfig.siteName];
