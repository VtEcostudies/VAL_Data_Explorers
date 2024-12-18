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
//WordPress use routes to pages, defined by the user. See eg. page-species-explorer-2022.php. etc.
var baseRoute = '/'; //Default. VAL WordPress has no baseRoute beyond host. Endpoints are routes mapped to pages withing WordPress.
var exploreEnd = 'gbif-explorer'; //occurrences
var resultsEnd = 'gbif-species-explorer';
var profileEnd = 'species-profile';
var literatEnd = 'gbif-literature';
var publishEnd = 'gbif-publishers';
if (hostUrl.includes('vtatlasoflife.org') || hostUrl.includes('localhost')) { //test sites use html for endpoints and has site-specific routing
  baseRoute = urlRouts.splice(0, urlRouts.length-1).join('/'); //remove the html file from the route and use what's left to build URLs for page links in code
  exploreEnd = 'occurrences.html';
  resultsEnd = 'results.html';
  //profileEnd = 'profile.html';
  profileEnd = '/VAL_Species_Page/species-profile.html';
  literatEnd = 'literature.html';
  publishEnd = 'publishers.html';
}
/*
var urlRout = '';
if (urlRouts[urlRouts.length-1].includes('.htm')) {urlRout = urlRouts.splice(0, urlRouts.length-1).join('/');}
else if (urlRouts[urlRouts.length-1].includes('gbif-'))  {urlRout = urlRouts.splice(0, urlRouts.length-1).join('/');}
else {urlRout = urlRouts.splice(0, urlRouts.length).join('/');}
if (!urlRout.endsWith('/')) {urlRout += '/';}
*/
if (!baseRoute.endsWith('/')) {baseRoute += '/';}
const exploreUrl = `${thisUrl.protocol}//${hostUrl}${baseRoute}${exploreEnd}`;
const resultsUrl = `${thisUrl.protocol}//${hostUrl}${baseRoute}${resultsEnd}`;
//const profileUrl = `${thisUrl.protocol}//${hostUrl}${baseRoute}${profileEnd}`;
const profileUrl = `${thisUrl.protocol}//${hostUrl}${profileEnd}`;
const literatUrl = `${thisUrl.protocol}//${hostUrl}${baseRoute}${literatEnd}`;
const publishUrl = `${thisUrl.protocol}//${hostUrl}${baseRoute}${publishEnd}`;
console.log('gbif_data_config.js | hostUrl', hostUrl);
console.log('gbif_data_config.js | urlPath', urlPath);
console.log('gbif_data_config.js | baseRoute', baseRoute);
console.log('gbif_data_config.js | exploreUrl', exploreUrl);
console.log('gbif_data_config.js | resultsUrl', resultsUrl);
console.log('gbif_data_config.js | profileUrl', profileUrl);
console.log('gbif_data_config.js | literatUrl', literatUrl);
console.log('gbif_data_config.js | publishUrl', publishUrl);
//const allColumns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences','images','childTaxa','iconImage'];
const columns = ['scientificName','vernacularNames','rank','taxonomicStatus','childTaxa','parentTaxa','iconImage','occurrences','images']; //these are the columns that will be shown
const columNames = {
  'key':'Dataset Key',
  'nubKey':'Backbone Key',
  'scientificName': 'Scientific Name',
  'canonicalName':'Name',
  'childTaxa': 'Child Taxa',
  'vernacularNames':'Common Names',
  'rank':'Rank',
  'taxonomicStatus':'Status',
  'parent':'Parent Name',
  'parentTaxa': 'Parent Taxa',
  'higherClassificationMap':'Parent Taxa',
  'iconImage': '',
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
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: 'https://hp-vtatlasoflife.gbif.org',
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: 'USA.46_1', //'Vermont' GADM administrative bounding region
    speciesDatasetKey: '0b1735ff-6a66-454b-8686-cae1cbc732a2', //Species Dataset Key
    speciesFilter: 'datasetKey=0b1735ff-6a66-454b-8686-cae1cbc732a2', //this replaces the above in speciesSearch so it can be something else
    publishingOrgKey: 'b6d09100-919d-4026-b35b-22be3dae7156', //VCE key
    occurrenceDatasetKey: '', //New idea from eButterfly config NOT implemented yet
    occurrenceFilter: 'gadm_gid=USA.46_1',
    columns: columns,
    columNames: columNames,
    downloadOccurrenceCounts: 1,
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
            },
            {
              "type": "equals",
              "key": "occurrenceStatus",
              "value": "PRESENT"
            }
          ]
        },
        // then include data having coordinates that has the correct GADM code
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
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: 'USA.22.4_1', //'Dukes County, MA' GADM administrative bounding region
    speciesDatasetKey: '298a29ef-a66a-4330-93a1-ea59482e25d9', //Martha's Vineyard Regional Species List Dataset Key
    speciesFilter: 'datasetKey=298a29ef-a66a-4330-93a1-ea59482e25d9', //this replaces the above in speciesSearch
    publishingOrgKey: false, //MVAL is not a GBIF Publisher. Yet.
    occurrenceDatasetKey: '', //New idea from eButterfly config NOT implemented yet
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
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: '', // World GADM administrative bounding region?
    speciesDatasetKey: 'ad8da44f-646f-4244-a6d0-5d1085ec6984', //Species Dataset Key
    speciesFilter: 'datasetKey=ad8da44f-646f-4244-a6d0-5d1085ec6984', //this replaces the above in speciesSearch
    publishingOrgKey: '7b8aff00-a9f8-11d8-944b-b8a03c50a862', //FMA publ key
    occurrenceDatasetKey: '', //New idea from eButterfly config NOT implemented yet
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
  },

  ebu: { //eButterfly datasets demo
    atlasPlace: 'eButterfly',
    atlasName: 'eButterfly Atlas',
    atlasAbbrev: 'eBA',
    helpDeskUrl: false,
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: '', //leave blank if N/A
    speciesDatasetKey: 'afff5f4d-742e-4db0-b750-6766306f3a0a', //Species Dataset Key
    speciesFilter: 'datasetKey=afff5f4d-742e-4db0-b750-6766306f3a0a',
    //speciesFilter: 'higherTaxonKey=6953&higherTaxonKey=5473&higherTaxonKey=7017&higherTaxonKey=9417&higherTaxonKey=5481&higherTaxonKey=1933999', //Filter to use if not speciesDaatasetKey
    publishingOrgKey: '', //leave blank if N/A
    occurrenceDatasetKey: 'cf3bdc30-370c-48d3-8fff-b587a39d72d6', //New idea from eButterfly config NOT implemented yet
    occurrenceFilter: '', //leave blank if scope is world - this is used in speciesExplorer for each taxonKey - it can be geographic limit or a publishingOrg
    columns: ['key','nubKey','canonicalName','vernacularNames','rank','taxonomicStatus','childTaxa','parentTaxa','iconImage','occurrences','images'], //these are the columns that will be shown    columNames: columNames,
    columNames: columNames,
    mapSettings: {
      lat: 41.885,
      lng: -87.636,
      zoom: 2
    },
    rootPredicate: {
      type: 'or',
      predicates: [
        // include data for 
        {
          "type": "equals",
          "key": "datasetKey",
          "value": "cf3bdc30-370c-48d3-8fff-b587a39d72d6"
        }
      ]
    }
  },

  ebw: { //eButterfly Worldwide demo
    atlasPlace: 'eButterfly World',
    atlasName: 'eButterfly Atlas World Wide',
    atlasAbbrev: 'eBW',
    helpDeskUrl: false,
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: '', //leave blank if N/A
    speciesDatasetKey: 'f9d29a0f-b64f-40ee-8061-471a3c15a0fc', //Species Dataset Key
    speciesFilter: 'datasetKey=f9d29a0f-b64f-40ee-8061-471a3c15a0fc',
    publishingOrgKey: '', //leave blank if N/A
    occurrenceDatasetKey: '', //New idea NOT implemented yet
    occurrenceFilter: '', //'taxonKey=6953&taxonKey=5473&taxonKey=7017&taxonKey=9417&taxonKey=5481&taxonKey=1933999', //leave blank if scope is world - this is used in speciesExplorer for each taxonKey - it can be geographic limit or a publishingOrg
    columns: ['key','nubKey','canonicalName','vernacularNames','rank','taxonomicStatus','childTaxa','parentTaxa','iconImage','occurrences','images'], //these are the columns that will be shown    columNames: columNames,
    columNames: columNames,
    mapSettings: {
      lat: 41.885,
      lng: -87.636,
      zoom: 2
    },
    rootPredicate: {
      type: 'or', //currently the only supported type
      predicates: [
        /* include data for taxonKeys in superFamily Papilionoidea, which can't be used on its own,
         so include all families:
          Hesperiidae: https://www.gbif.org/species/6953
          Lycaenidae: https://www.gbif.org/species/5473
          Nymphalidae: https://www.gbif.org/species/7017
          Papilionidae: https://www.gbif.org/species/9417
          Pieridae: https://www.gbif.org/species/5481
          Riodinidae: https://www.gbif.org/species/1933999
       */
        {"type":"equals", "key":"taxonKey", "value":"6953"},
        {"type":"equals", "key":"taxonKey", "value":"5473"},
        {"type":"equals", "key":"taxonKey", "value":"7017"},
        {"type":"equals", "key":"taxonKey", "value":"9417"},
        {"type":"equals", "key":"taxonKey", "value":"5481"},
        {"type":"equals", "key":"taxonKey", "value":"1933999"}
      ]
    }
  },

  vtb: { //VT Checklist of Butterflies
    atlasPlace: 'Vermont Butterfly',
    atlasName: 'VT Checklist of Butterflies',
    atlasAbbrev: 'VTB',
    helpDeskUrl: false,
    thisUrl: thisUrl,
    hostUrl: hostUrl,
    exploreUrl: exploreUrl,
    resultsUrl: resultsUrl,
    profileUrl: profileUrl,
    literatUrl: literatUrl,
    publishUrl: publishUrl,
    gbifPortal: false,
    gbifApi: "https://api.gbif.org/v1", //this should not change at all
    gadmGid: '', //leave blank if N/A
    speciesDatasetKey: '73eb16f0-4b06-4347-8069-459bc2d96ddb', //Species Dataset Key
    speciesFilter: 'datasetKey=73eb16f0-4b06-4347-8069-459bc2d96ddb', //Filter to use for species
    publishingOrgKey: 'b6d09100-919d-4026-b35b-22be3dae7156', //VCE key
    occurrenceFilter: 'gadm_gid=USA.46_1', //leave blank if scope is world - this is used in speciesExplorer for each taxonKey - it can be geographic limit or a publishingOrg
    columns: ['key','nubKey','canonicalName','vernacularNames','rank','taxonomicStatus','childTaxa','parentTaxa','iconImage','occurrences','images'], //these are the columns that will be shown    columNames: columNames,
    columNames: columNames,
    mapSettings: {
      lat: 43.9,
      lng: -72.6,
      zoom: 7.75
    },
    rootPredicate: {
      type: 'or', //currently the only supported type
      predicates: [
        {
          "type": "and",
          "predicates": [
            {
              "type": "equals",
              "key": "gadmGid",
              "value": "USA.46_1"
            },
            {
              "type": "in",
              "key": "taxonKey",
              "values": [
                "6953",
                "5473",
                "7017",
                "9417",
                "5481",
                "1933999"
              ]
            }
          ]
        }
      ]
    }
  },
}

export const dataConfig = config[siteConfig.siteName];

//parse rootPredicate into an array of http query parameters for combined and iterative calls to API here
export function predicateToQueries(rootPredicate=dataConfig.rootPredicate) {
  let qrys = [];
  if ('or' == rootPredicate.type.toLowerCase()) {
    for (var topIdx=0; topIdx<rootPredicate.predicates.length;topIdx++) {
      let topEle = rootPredicate.predicates[topIdx];
      //alert(`rootPredicate | ${JSON.stringify(topEle)} | ${topIdx}`);
      if (topEle.predicates) { //nested predicate object
        //let qry = '?';
        let qry = '';
        for (var subIdx=0; subIdx<topEle.predicates.length; subIdx++) {
          let subEle = topEle.predicates[subIdx];
          //alert(`subPredicate | ${JSON.stringify(subEle)} | ${subIdx}`);
          if ('or' == topEle.type.toLowerCase()) {
            if ('in' == subEle.type.toLowerCase()) {
              for (var valIdx=0; valIdx<subEle.values.length; valIdx++) {
                //qrys.push(`?${subEle.key}=${subEle.values[valIdx]}`); //add multiple '?' query array-elements for sub-predicates' sub-values
                qrys.push(`${subEle.key}=${subEle.values[valIdx]}`); //add multiple '?' query array-elements for sub-predicates' sub-values
              }
            } else {
              //qrys.push(`?${subEle.key}=${subEle.value}`); //add multiple '?' query array-elements for sub-predicates
              qrys.push(`${subEle.key}=${subEle.value}`); //add multiple '?' query array-elements for sub-predicates
            }
          } else if ('and' == topEle.type.toLowerCase()) {
            if ('in' == subEle.type.toLowerCase()) {
              for (var valIdx=0; valIdx<subEle.values.length; valIdx++) {
                qry += `${subEle.key}=${subEle.values[valIdx]}&`; //string sub-predicates' values together as '&' values in one query
              }
            } else {
              qry += `${subEle.key}=${subEle.value}&`; //string sub-predicates together as '&' values in one query
            }
          }
        }
        if ('?' != qry) {qrys.push(qry);} //add single '?' query array-element for 'and' sub-predicate
      } else {
        //qrys.push(`?${topEle.key}=${topEle.value}`);
        qrys.push(`${topEle.key}=${topEle.value}`);
      }
    }
  }
  return qrys;
}
