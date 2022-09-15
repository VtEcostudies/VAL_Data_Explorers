import { omniSearch, speciesSearch } from './gbif_species_search.js';

const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const gadmGid = 'USA.46_1';
//const columns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences'];
const columns = ['canonicalName','vernacularName','rank','taxonomicStatus','parent','occurrences'];
var thisUrl = document.URL.split('?')[0]; //the base URL for this page without route params
const explorerUrl = 'https://val.vtecostudies.org/gbif-explorer';

const objUrlParams = new URLSearchParams(window.location.search);

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('taxonKeys:', tKeys);

// get 'q' query param
let qParm = objUrlParams.getAll('q');
console.log('search param:', qParm);

const tbl = document.getElementById("species-table");
const lbl = document.getElementById("search-value");

async function addHead() {
  let objHed = tbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (hedNam, hedIdx) => {
    let colObj = await hedRow.insertCell(hedIdx);
    colObj.innerHTML = hedNam;
  });
}

async function addTaxaByKeys() {
  // Create table row for each taxonKey, then function to fill row of cells
  tKeys.forEach(async (key, rowIdx) => {
    let objRow = tbl.insertRow(rowIdx);
    await fillRow(await getTaxon(key), objRow, rowIdx);
  })
}

async function addTaxaFromArr(sArr) {
  // Create table row for each taxonKey, then function to fill row of cells
  sArr.forEach(async (sObj, rowIdx) => {
    let objRow = tbl.insertRow(rowIdx);
    await fillRow(sObj.nubKey ? sObj.nubKey : key, objRow, rowIdx);
  })
}

// Fill a row of cells from a taxon key
async function fillRow(key, objRow, rowIdx) {
  var res = await getTaxon(key);
  var key = res.nubKey ? res.nubKey : res.key; //must resolve key to nubKey if exists
  var occ = await getOccCount(key);
  var hrow = null;
  var colIdx = 0;
  columns.forEach((colNam, colIdx) => {
    let colObj = objRow.insertCell(colIdx);
    switch(colNam) {
      case 'canonicalName': case 'scientificName': case 'parent': case 'vernacularName':
        colObj.innerHTML = res[colNam] ? `<a href="${thisUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey': case 'parentKey':
        colObj.innerHTML = res[colNam] ? `<a href="${thisUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'occurrences':
        colObj.innerHTML = `<a href="${explorerUrl}?taxonKey=${key}&view=MAP">${occ.count}</a>`;
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

async function getOccCount(key) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/occurrence/search";
  let reqFilter = `?advanced=1&limit=0&gadm_gid=${gadmGid}&taxon_key=${key}`
  let url = reqHost+reqRoute+reqFilter;
  let enc = encodeURI(url);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`getOccCount(${key}) QUERY:`, enc);
    console.log(`getOccCount(${key}) RESULT:`, json);
    return json;
  } catch (err) {
    console.log(`getOccCount(${key}) QUERY:`, enc);
    console.log(`getOccCount(${key}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

if (qParm.length) {
  let spcs = await speciesSearch(qParm);
  await addTaxaFromArr(spcs.results);
  await addHead();
  if (lbl) {lbl.innerHTML = `<u>${spcs.count} Search Results for '${qParm}':</u>`;}
}
else if (tKeys.length) {
  await addTaxaByKeys();
  await addHead();
  if (lbl) {tKeys.forEach((key,idx) => {lbl.innerHTML += key + ', ';})}
}
