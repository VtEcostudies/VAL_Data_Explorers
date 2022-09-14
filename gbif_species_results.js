import { omniSearch } from './gbif_species_search.js';

const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const columns = ['key','nubKey','canonicalName','scientificName','parentKey','parent','vernacularName','rank','taxonomicStatus','synonym'];
var thisUrl = document.URL.split('?')[0]; //the base URL for this page without route params

const objUrlParams = new URLSearchParams(window.location.search);

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('taxonKeys:', tKeys);

// get 'q' query param
let qParm = objUrlParams.getAll('q');
console.log('search param:', qParm);

var tbl = document.getElementById("species-table");

async function addHead() {
  let objHed = tbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (colNam, hedIdx) => {
    let colObj = await hedRow.insertCell(hedIdx);
    colObj.innerHTML = colNam;
  });
}

async function addTaxa() {
  // Create table row for each taxonKey, then fucntion to fill row of cells
  tKeys.forEach(async (key, rowIdx) => {
    let objRow = tbl.insertRow(rowIdx);
    await fillRow(key, objRow, rowIdx);
  })
}

// Fill a row of cells for a taxonKey
async function fillRow(key, objRow, rowIdx) {
  var res = await getTaxon(key);
  var hrow = null;
  var colIdx = 0;
  columns.forEach((colNam, colIdx) => {
    let colObj = objRow.insertCell(colIdx);
    switch(colNam) {
      case 'canonicalName': case 'scientificName': case 'parent': case 'vernacularName':
        colObj.innerHTML = `<a href="${thisUrl}?q=${res[colNam]}">${res[colNam]}</a>`; //could be populated or empty
        break;
      case 'key': case 'nubKey': case 'parentKey':
        colObj.innerHTML = `<a href="${thisUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>`; //could be populated or empty
        break;
      default:
        colObj.innerHTML = res[colNam] ? res[colNam] : null;
        break;
    }
    colIdx++;
  });
}

//get a GBIF taxon from the species API by taxonKey
async function getTaxon(key) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/";
  let reqValue = key;
  let reqFilter = `?datasetKey=${datasetKey}&advanced=1`
  let url = reqHost+reqRoute+reqValue+reqFilter;
  let enc = encodeURI(url);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`getTaxon(${key}) QUERY:`, enc);
    console.log(`getTaxon(${key}) RESULT:`, json);
    return json;
  } catch (err) {
    console.log(`getTaxon(${key}) QUERY:`, enc);
    console.log(`getTaxon(${key}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

if (qParm.length) {
  omniSearch(qParm);
} else if (tKeys.length) {
  await addTaxa();
  await addHead();
}
