import { speciesSearch } from './gbif_species_search.js';

const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const gadmGid = 'USA.46_1';
//const columns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences'];
const columns = ['canonicalName','vernacularName','rank','taxonomicStatus','parent','occurrences'];
const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
var explorerUrl = `${thisUrl.protocol}/${thisUrl.host}/gbif-explorer`;
var resultsUrl = `${thisUrl.protocol}/${thisUrl.host}/gbif-species-explorer`;
explorerUrl = 'https://vcevaldev.wpengine.com/gbif-explorer';
resultsUrl = 'https://vcevaldev.wpengine.com/gbif-species-explorer';
if ('localhost' == hostUrl) {
  explorerUrl = 'https://val.vtecostudies.org/gbif-explorer';
  resultsUrl = 'http://localhost/results.html';
}
const objUrlParams = new URLSearchParams(window.location.search);

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('taxonKeys:', tKeys);

// get 'q' query param
var qParm = objUrlParams.get('q');
var offset = objUrlParams.get('offset'); offset = Number(offset) ? Number(offset) : 0;
var limit = objUrlParams.get('limit'); limit = Number(limit) ? Number(limit) : 20;
var count = 0; //this is set after loading data
console.log('search param', qParm, 'offset:', offset, 'limit:', limit);

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

// Create table row for each taxonKey, then fill row of cells
async function addTaxaByKeys() {
  tKeys.forEach(async (key, rowIdx) => {
    let objRow = tbl.insertRow(rowIdx);
    await fillRow(await getTaxon(key), objRow, rowIdx);
  })
}

// Create table row for each array element, then fill row of cells
async function addTaxaFromArr(sArr) {
  sArr.forEach(async (sObj, rowIdx) => {
    let objRow = tbl.insertRow(rowIdx);
    await fillRow(sObj.nubKey ? sObj.nubKey : sObj.key, objRow, rowIdx);
  })
}

// Fill a row of cells for a taxon key
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
        colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey': case 'parentKey':
        colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
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
    //console.log(`getTaxon(${key}) QUERY:`, enc);
    //console.log(`getTaxon(${key}) RESULT:`, json);
    return json;
  } catch (err) {
    //console.log(`getTaxon(${key}) QUERY:`, enc);
    //console.log(`getTaxon(${key}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

//get an occurrence count from the occurrence API by taxonKey
async function getOccCount(key) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/occurrence/search";
  let reqFilter = `?advanced=1&limit=0&gadm_gid=${gadmGid}&taxon_key=${key}`
  let url = reqHost+reqRoute+reqFilter;
  let enc = encodeURI(url);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    //console.log(`getOccCount(${key}) QUERY:`, enc);
    //console.log(`getOccCount(${key}) RESULT:`, json);
    return json;
  } catch (err) {
    //console.log(`getOccCount(${key}) QUERY:`, enc);
    //console.log(`getOccCount(${key}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

export function PrevPage() {
  if (offset > 0) {
    offset = offset - limit;
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
  }
}
export function NextPage() {
  if ((offset + limit) < count) {
    offset = offset + limit;
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
  }
}
export function FirstPage() {
  //alert(`${resultsUrl}?q=${qParm}&offset=0&limit=${limit}`);
  window.location.assign(`${resultsUrl}?q=${qParm}&offset=0&limit=${limit}`);
}
export function LastPage() {
  if (count > limit) {
    offset = Math.floor(count/limit)*limit;
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
  }
}
if (document.getElementById("page-prev")) {
    document.getElementById("page-prev").addEventListener("mouseup", function(e) {
      PrevPage();
    });}
if (document.getElementById("page-next")) {
    document.getElementById("page-next").addEventListener("mouseup", function(e) {
      NextPage();
    });}
if (document.getElementById("page-first")) {
    document.getElementById("page-first").addEventListener("mouseup", function(e) {
      FirstPage();
    });}
if (document.getElementById("page-last")) {
    document.getElementById("page-last").addEventListener("mouseup", function(e) {
      LastPage();
    });}
if (document.getElementById("download-json")) {
    document.getElementById("download-json").addEventListener("mouseup", function(e) {
      getDownloadData(1);
    });}
if (document.getElementById("download-csv")) {
    document.getElementById("download-csv").addEventListener("mouseup", function(e) {
      getDownloadData(0);
    });}

//Download qParm full-result set as csv (type==0) or json (type==1)
async function getDownloadData(type=0) {
  let spcs = await speciesSearch(qParm, 0, 10000);
  if (type) { //json
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spcs.results));
    downloadData(dataStr, qParm + ".json") ;
  } else { //csv
    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(jsonToCsv(spcs.results));
    downloadData(dataStr, qParm + ".csv") ;
  }
}

//do the download
function downloadData(dataStr, expName) {
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", expName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

//convert json array of objects to csv
function jsonToCsv(json) {
  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  const header = Object.keys(json[0])
  const csv = [
    header.join(','), // header row first
    ...json.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n')

  return csv;
}

if (qParm) {
  let spcs = await speciesSearch(qParm, offset, limit);
  count = spcs.count;
  await addTaxaFromArr(spcs.results);
  await addHead();
  let finish = (offset+limit)>count ? count : offset+limit;
  if (lbl) {lbl.innerHTML = `<u>${offset} to ${finish} of ${count} Search Results for '${qParm}':</u>`;}
}
else if (tKeys.length) {
  await addTaxaByKeys();
  await addHead();
  if (lbl) {lbl.inntKeys.forEach((key,idx) => {lbl.innerHTML += key + ', ';})}
}
