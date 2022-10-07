import { speciesSearch } from './gbif_species_search.js'; //NOTE: importing just a function includes the entire module

const datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const gbifApi = "https://api.gbif.org/v1";
const gadmGid = 'USA.46_1';
//const columns = ['key','nubKey','canonicalName','scientificName','vernacularName','rank','taxonomicStatus','synonym','parentKey','parent','occurrences'];
const columns = ['canonicalName','vernacularNames','rank','taxonomicStatus','higherClassificationMap','occurrences'];
const columNames = {'key':'GBIF Key', 'nubKey':'GBIF Nub Key', 'canonicalName':'Scientific Name', 'vernacularNames':'Common Names', 'rank':'Rank', 'taxonomicStatus':'Status', 'parent':'Parent Name', 'higherClassificationMap':'Parent Taxa', 'occurrences':'Occurrences'};
const thisUrl = new URL(document.URL);
const hostUrl = thisUrl.host;
var explorerUrl = `${thisUrl.protocol}//${thisUrl.host}/gbif-explorer`;
var resultsUrl = `${thisUrl.protocol}//${thisUrl.host}/gbif-species-explorer`;
if ('localhost' == hostUrl) {
  explorerUrl = 'http://localhost/occurrences.html';
  resultsUrl = 'http://localhost/results.html';
}
const objUrlParams = new URLSearchParams(window.location.search);
var nFmt = new Intl.NumberFormat(); //use this to format numbers by locale... automagically?

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('Query Param(s) taxonKeys:', tKeys);

// get 'q' query param
var qParm = objUrlParams.get('q');
var offset = objUrlParams.get('offset'); offset = Number(offset) ? Number(offset) : 0;
var limit = objUrlParams.get('limit'); limit = Number(limit) ? Number(limit) : 20;
var rank =  objUrlParams.get('rank'); rank = rank ? rank.toUpperCase() : 'ALL';
var count = 0; //this is set after loading data
var page = offset / limit + 1;
console.log('Query param q:', qParm, 'offset:', offset, 'limit:', limit, 'page:', page);

var other = ''; var objOther = {};
objUrlParams.forEach((val, key) => {
  if ('taxonKey'!=key && 'q'!=key && 'offset'!=key && 'limit'!=key) {
    other += `&${key}=${val}`;
    objOther[key] = val;
  }
});

const eleTxt = document.getElementById("results_search"); if (eleTxt) {eleTxt.value = qParm;}
const elePag = document.getElementById("page-number"); if (elePag) {elePag.innerText = `Page ${nFmt.format(page)}`;}
const eleTbl = document.getElementById("species-table");
const eleLbl = document.getElementById("search-value");
const eleRnk = document.getElementById("taxon-rank"); if (eleRnk) {eleRnk.value =  rank;}
const eleSiz = document.getElementById("page-size"); if (eleSiz) {eleSiz.value =  limit;}
const eleDwn = document.getElementById("download-progress"); if (eleDwn) {eleDwn.style.display = 'none';}
const eleOvr = document.getElementById("download-overlay"); if (eleOvr) {eleOvr.style.display = 'none';}
//const eleInf = document.getElementById("information-overlay"); if (eleInf) {eleInf.style.display = 'none';}

async function addHead() {
  let objHed = eleTbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (hedNam, hedIdx) => {
    let colObj = await hedRow.insertCell(hedIdx);
    colObj.innerHTML = columNames[hedNam];
    if ("canonicalName" == hedNam) {
      colObj.innerHTML = `
        ${columNames[hedNam]}
        <a href="#" onclick="toggleInfo('Click Scientific Name to list its child taxa.');">
          <i class="fa fa-info-circle"></i>
        </a>`;
    }
  });
}

async function putErrorOnScreen(err) {
  let objRow = eleTbl.insertRow(0);
  let colObj = objRow.insertCell(0);
  colObj.innerHTML = err;
}

// Create table row for each taxonKey, then fill row of cells
async function addTaxaByKeys() {
  tKeys.forEach(async (key, rowIdx) => {
    let objRow = eleTbl.insertRow(rowIdx);
    await fillRow({taxonKey: key}, objRow, rowIdx);
  })
}

// Create table row for each array element, then fill row of cells
async function addTaxaFromArr(sArr) {
  sArr.forEach(async (objSpc, rowIdx) => {
    let objRow = eleTbl.insertRow(rowIdx);
    //let taxKey = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
    //console.log(`get_species_results::addTaxaFromArr | key:${sObj.key} | nubKey:${sObj.nubKey} | result:${taxKey}`);
    await fillRow(objSpc, objRow, rowIdx);
  })
}

// Fill a row of cells for a taxon object retrieved from species search, or other. At minimum, objSpc
// must be {key: taxonKey}
async function fillRow(objSpc, objRow, rowIdx) {
  var key = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
  var res = objSpc; var occ = {count: 'n/a'}; //initialize these to valid objects in case GETs, below, fail
  if (objSpc.taxonKey) { //search by query param taxonKey
    key = objSpc.taxonKey;
    try {
      res = await getTaxon(key);
      key = res.nubKey ? res.nubKey : res.key; //must again resolve key to nubKey if exists
    } catch (err) {
      //getTaxon failed, so leave it as initialized
    }
  }
  try {
    occ = await getOccCount(key);
  } catch (err) {
    //getOccCount failed, so leave it as initialized
  }
  columns.forEach((colNam, colIdx) => {
    let colObj = objRow.insertCell(colIdx);
    switch(colNam) {
      case 'canonicalName':
        let name = res[colNam] ? res[colNam] : res['scientificName'];
        //colObj.innerHTML = `<a href="${resultsUrl}?q=${name}">${name}</a>`;
        colObj.innerHTML = `<a href="${resultsUrl}?q=&higherTaxonKey=${res['key']}&higherTaxonName=${name}&higherTaxonRank=${res['rank']}">${name}</a>`;
        colObj.title = `List child taxa of ${name}`;
        break;
      case 'vernacularNames':
        let vnArr = res[colNam]; //array of vernacular columNames
        if (!vnArr) break;
        vnArr.forEach((ele, idx) => {
          colObj.innerHTML += `<a href="${resultsUrl}?q=${ele.vernacularName}">${ele.vernacularName}</a>`;
          if (idx < Object.keys(vnArr).length-1) {colObj.innerHTML += ', ';}
        })
        break;
      case 'scientificName': case 'parent': case 'vernacularName':
        colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey': case 'parentKey':
        colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'higherClassificationMap':
        let tree = res[colNam]; //object of upper taxa like {123456:Name,234567:Name,...}
        if (!tree) break;
        Object.keys(tree).forEach((key, idx) => {
          colObj.innerHTML += `<a href="${resultsUrl}?q=${tree[key]}">${tree[key]}</a>`;
          if (idx < Object.keys(tree).length-1) {colObj.innerHTML += ', ';}
        })
        break;
      case 'occurrences': //to-do: break higher-level taxa into child keys for distinct display
        colObj.innerHTML = `<a href="${explorerUrl}?taxonKey=${key}&view=MAP">${nFmt.format(occ.count)}</a>`;
        //colObj.innerHTML += `<a href="${explorerUrl}?${getChildKeys(key)}&view=MAP">+</a>`;
        break;
      default:
        colObj.innerHTML = res[colNam] ? res[colNam] : null;
        break;
    }
  });
}

export function showInfo(text=false) {
  if (eleInf) {if (text) eleInf.innerHTML = text; eleInf.style.display = 'block'; info_on = true;}
}
export function hideInfo() {
  if (eleInf) {eleInf.style.display = 'none'; info_on = false;}
}
export function toggleInfo(text=false) {
  if (eleInf) { if (text && text != eleInf.innerHTML) {showInfo(text);} else if (info_on) {hideInfo();} else {showInfo(text);} }
}

function getChildKeys(key) {
    return `taxonKey=1&taxonKey=100&taxonKey=1000`;
}

//get a GBIF taxon from the species API by taxonKey
// return a single object with taxon keys like canonicalName
async function getTaxon(key) {
  let reqHost = gbifApi;
  let reqRoute = "/species/";
  let reqValue = key;
  let reqFilter = `?datasetKey=${datasetKey}&advanced=1${other}`;
  let url = reqHost+reqRoute+reqValue+reqFilter;
  let enc = encodeURI(url);

  try {
    let tres = await fetch(enc);
    let json = await tres.json();
    //console.log(`getTaxon(${key}) QUERY:`, enc);
    //console.log(`getTaxon(${key}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`getTaxon(${key}) ERROR:`, err);
    return new Error(err)
  }
}

//get an occurrence count from the occurrence API by taxonKey
async function getOccCount(key) {
  let reqHost = gbifApi;
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
    err.query = enc;
    console.log(`getOccCount(${key}) ERROR:`, err);
    return new Error(err)
  }
}

//get dataset info for datasetKey
export async function getDatasetInfo(datasetKey) {

  let reqHost = gbifApi;
  let reqRoute = `/dataset/${datasetKey}`;
  let url = reqHost+reqRoute;
  let enc = encodeURI(url);

  console.log(`getDatasetInfo(${datasetKey})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    //console.log(`getDatasetInfo(${datasetKey}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`getDatasetInfo(${datasetKey}) ERROR:`, err);
    throw new Error(err)
  }
}

export function SamePage(newParm=qParm, newLimit=limit, newOffset=offset, newOther=other) {
  qParm = newParm;
  limit = newLimit;
  offset = newOffset;
  other = newOther;
  window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}${other}`);
}
export function PrevPage() {
  if (offset > 0) {
    offset = offset - limit;
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}${other}`);
  }
}
export function NextPage() {
  if ((offset + limit) < count) {
    offset = offset + limit;
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}${other}`);
  }
}
export function FirstPage() {
  //alert(`${resultsUrl}?q=${qParm}&offset=0&limit=${limit}`);
  window.location.assign(`${resultsUrl}?q=${qParm}&offset=0&limit=${limit}${other}`);
}
export function LastPage() {
  if (count > limit) {
    offset = Math.floor(count/limit)*limit;
    if (offset >= count) {offset = offset - limit;}
    //alert(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}${other}`);
  }
}
if (document.getElementById("results_search")) {
    document.getElementById("results_search").addEventListener("keypress", function(e) {
      if (e.which == 13) {
        let newParm = document.getElementById("results_search").value;
        SamePage(newParm, limit, 0, ""); //new search - remove otherParms, go to page 0, but keep user-defined limit
      }
    });}
if (document.getElementById("results_search_button")) {
    document.getElementById("results_search_button").addEventListener("mouseup", function(e) {
      let newParm = document.getElementById("results_search").value;
      SamePage(newParm, limit, 0, ""); //new search - remove otherParms, go to page 0, but keep user-defined limit
    });}
if (document.getElementById("taxon-rank")) {
    document.getElementById("taxon-rank").addEventListener("change", function(e) {
      let newRank = document.getElementById("taxon-rank").value;
      console.log('taxon-rank change to', newRank);
      var newOther = "";
      if ("ALL" != newRank) { //now we have to search the extant 'other' args for 'rank' and replace it...
        objOther.rank = newRank; //just assign it in the object version of 'other' - this adds or replaces 'rank'
      } else {
        delete objOther.rank;
      }
      Object.keys(objOther).forEach(key => {newOther += `&${key}=${objOther[key]}`;}) //rebuild 'other' list from 'other' object
      SamePage(qParm, limit, 0, newOther);
    });}
if (document.getElementById("page-size")) {
    document.getElementById("page-size").addEventListener("change", function(e) {
      let newLimit = document.getElementById("page-size").value;
      console.log('page-size change to', newLimit);
      SamePage(qParm, newLimit);
    });}
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

//using search term and other query parameters, download all species data by page and concatenate into a single array of objects
async function getAllDataPages(q=qParm, l=limit, o=other) {
  var res = []; var page = {}; var off = 0;
  eleDwn.style.display = 'block'; eleOvr.style.display = 'block';
  do {
    page = await speciesSearch(q, off, l, o);
    res = res.concat(page.results);
    console.log('getAllDataPages', res.length, page.results.length, page.count);
    off += limit;
    eleDwn.innerHTML = `Downloading... progress ${off}/${page.count}`;
  }
  while (!page.endOfRecords);
  console.log('getAllDataPages | result size', res.length);
  eleDwn.style.display = 'none'; eleOvr.style.display = 'none';
  return res;
}

//Download qParm full-result set as csv (type==0) or json (type==1)
async function getDownloadData(type=0) {
  let spc = await getAllDataPages(); //returns just an array of taxa, not a decorated object
  let dsi = await getDatasetInfo(datasetKey); //returns a single object
  var name = `VAL_taxa`; //download file name
  if (qParm) {name += `_${qParm}`;} //add search term to download file name
  Object.keys(objOther).forEach(key => {name += `_${objOther[key]}`;}) //add query params to download file name
  if (type) { //json-download
    var res = {citation: dsi.citation.text, taxa: spc}; console.log('JSON Download:', res);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
    downloadData(dataStr, name + ".json") ;
  } else { //csv-download
    var res = dsi.citation.text + '\r\n' + jsonToCsv(spc);
    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(res);
    downloadData(dataStr, name + ".csv") ;
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

if (eleTbl) { //results are displayed in a table with id="species-table". we need that to begin.
  if (tKeys.length) {
    await addTaxaByKeys();
    await addHead();
    if (eleLbl) {
      eleLbl.innerHTML = "Showing results for taxon keys: ";
      tKeys.forEach((key, idx) => {
        eleLbl.innerHTML += key;
        if (idx < tKeys.length-1) {eleLbl.innerHTML += ', ';}
      })
    }
  } else { //important: include q="" to show ALL species result
    if (!qParm) {qParm = "";}
    if ("" === qParm && !other) {other='&rank=KINGDOM'; objOther={'rank':'KINGDOM'}; eleRnk.value='KINGDOM';}
    try {
      let spcs = await speciesSearch(qParm, offset, limit, other);
      count = spcs.count;
      await addTaxaFromArr(spcs.results);
      await addHead();
      let finish = (offset+limit)>count ? count : offset+limit;
      if (eleLbl) {
        eleLbl.innerHTML = `Showing ${nFmt.format(count?offset+1:0)}-${nFmt.format(finish)} of <u><b>${nFmt.format(count)}</b></u> Results`;
        if (qParm) {
          eleLbl.innerHTML += ` for Search Term <u><b>'${qParm}'</b></u>`;
        }
        if (Object.keys(objOther).length) {eleLbl.innerHTML += ' where ';}
        Object.keys(objOther).forEach((key, idx) => {
          eleLbl.innerHTML += ` ${key} is <u><b>'${objOther[key]}'</b></u>`;
          if (idx < Object.keys(objOther).length-1) {eleLbl.innerHTML += ' and ';}
        });
      }
    } catch (err) {
      putErrorOnScreen(err);
    }
  }
} else {
  console.log('gbif_species_results.js requires a table having id="species-table" to operate.')
}
