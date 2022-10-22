/*
const apiColumns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences'];
*/

const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
const urlPath = thisUrl.pathname;
var urlRout = urlPath.split('/');
urlRout = urlRout.splice(0, urlRout.length-1).join('/'); //Note urlRout has leading '/'
var explorerUrl = `${thisUrl.protocol}/${thisUrl.host}${urlRout}/gbif-explorer`;
var resultsUrl = `${thisUrl.protocol}/${thisUrl.host}${urlRout}/gbif-species-explorer`;
if ('localhost' == hostUrl) {
  explorerUrl = 'http://localhost/occurrences.html';
  resultsUrl = 'http://localhost/results.html';
}

const valConfig = {
  atlasPlace: 'Vermont',
  atlasName: 'Vermont Atlas of Life',
  atlasAbbrev: 'VAL',
  thisUrl: thisUrl,
  hostUrl: hostUrl,
  explorerUrl: explorerUrl,
  resultsUrl: resultsUrl,
  gbifPortal: 'https://hp-vtatlasoflife.gbif.org',
  gbifApi: "https://api.gbif.org/v1", //this should not change at all
  gadmGid: 'USA.46_1', //'Vermont' GADM administrative bounding region
  datasetKey: '0b1735ff-6a66-454b-8686-cae1cbc732a2', //Species Dataset Key
  publishingOrgKey: 'b6d09100-919d-4026-b35b-22be3dae7156', //VCE key
  columns: ['canonicalName','vernacularNames','rank','taxonomicStatus','higherClassificationMap','occurrences'],
  columNames: {'key':'GBIF Key', 'nubKey':'GBIF Nub Key', 'canonicalName':'Scientific Name', 'vernacularNames':'Common Names', 'rank':'Rank', 'taxonomicStatus':'Status', 'parent':'Parent Name', 'higherClassificationMap':'Parent Taxa', 'occurrences':'Occurrences'},
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
}

/*
https://www.gbif.org/occurrence/search?has_geospatial_issue=false&geometry=POLYGON((-70.88477 41.33702,-70.82729 41.20741,-70.69115 41.31884,-70.4219 41.3302,-70.41887 41.41874,-70.59434 41.51395,-70.88477 41.33702))
*/
const mvaConfig = {
  atlasPlace: 'Marthas Vineyard',
  atlasName: 'Marthas Vineyard Atlas of Life',
  atlasAbbrev: 'MVAL',
  thisUrl: thisUrl,
  hostUrl: hostUrl,
  explorerUrl: explorerUrl,
  resultsUrl: resultsUrl,
  gbifPortal: false,
  gbifApi: "https://api.gbif.org/v1", //this should not change at all
  gadmGid: 'USA.22.4_1', //'Dukes County, MA' GADM administrative bounding region
  datasetKey: '298a29ef-a66a-4330-93a1-ea59482e25d9', //Martha's Vineyard Regional Species List Dataset Key
  publishingOrgKey: false, //
  columns: ['canonicalName','vernacularNames','rank','taxonomicStatus','higherClassificationMap','occurrences'],
  columNames: {'key':'GBIF Key', 'nubKey':'GBIF Nub Key', 'canonicalName':'Scientific Name', 'vernacularNames':'Common Names', 'rank':'Rank', 'taxonomicStatus':'Status', 'parent':'Parent Name', 'higherClassificationMap':'Parent Taxa', 'occurrences':'Occurrences'},
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
      // include data having coordinates within an administrative area
/*
      ,{
        "type": "equals",
        "key": "gadmGid",
        "value": "USA.22.4_1"
      }
*/
      // include data having coordinates within a bounding box
      ,{
        "type": "within",
        "key": "geometry",
        "value": "POLYGON((-70.88477 41.33702,-70.82729 41.20741,-70.69115 41.31884,-70.4219 41.3302,-70.41887 41.41874,-70.59434 41.51395,-70.88477 41.33702))"
      }
    ]
  }
}

export const dataConfig = mvaConfig;
