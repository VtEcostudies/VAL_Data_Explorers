import { dataConfig } from './gbif_data_config.js';
import { speciesSearch } from './gbif_species_search.js'; //NOTE: importing just a function includes the entire module
import { getWikiPage } from './wiki_page_data.js';
import { predicateToQueries } from './gbif_data_config.js';
import { getStoredOccCnts, getImgCount } from './gbif_item_counts.js';

const gbifApi = dataConfig.gbifApi; //"https://api.gbif.org/v1";
const speciesDatasetKey = dataConfig.speciesDatasetKey; //'0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
const gadmGid = dataConfig.gadmGid; //'USA.46_1';
const exploreUrl = dataConfig.exploreUrl;
const resultsUrl = dataConfig.resultsUrl;
const profileUrl = dataConfig.profileUrl;
const columns = dataConfig.columns;
const columNames = dataConfig.columNames;
var columnIds = {};
const nFmt = new Intl.NumberFormat(); //use this to format numbers by locale... automagically
const objUrlParams = new URLSearchParams(window.location.search);

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('Query Param(s) taxonKeys:', tKeys);

// get 'q' query param
var qParm = objUrlParams.get('q');
var offset = objUrlParams.get('offset'); offset = Number(offset) ? Number(offset) : 0;
var limit = objUrlParams.get('limit'); limit = Number(limit) ? Number(limit) : 20;
var rank =  objUrlParams.get('rank'); rank = rank ? rank.toUpperCase() : 'ALL';
var status =  objUrlParams.get('status'); status = status ? status.toUpperCase() : 'ALL';
var qField =  objUrlParams.get('qField'); qField = qField ? qField.toUpperCase() : 'ALL';
var count = 0; //this is set elsewhere after loading data. initialize here.
var page = offset / limit + 1;
var gOccCnts = {};
console.log('Query param q:', qParm, 'offset:', offset, 'limit:', limit, 'page:', page, 'qField:', qField, 'Other:', other);

//get other query params (there are many, and they are necessary. eg. higherTaxonRank)
var other = ''; var objOther = {};
objUrlParams.forEach((val, key) => {
  if ('taxonKey'!=key && 'q'!=key && 'offset'!=key && 'limit'!=key && 'qField'!=key) {
    other += `&${key}=${val}`;
    objOther[key] = val;
  }
});

const eleTtl = document.getElementById("species-title"); //the h tag within the title
const eleHlp = document.getElementById("flag-issue"); //id='flag-issue' element for HelpDesk support
const eleTxt = document.getElementById("results_search"); if (eleTxt) {eleTxt.value = qParm;}
const elePag = document.getElementById("page-number"); if (elePag) {elePag.innerText = `Page ${nFmt.format(page)}`;}
const eleTbl = document.getElementById("species-table");
const eleLbl = document.getElementById("search-value");
const eleLb2 = document.getElementById("search-value-bot"); //a duplicate search-value display to go below the table of results
const eleRnk = document.getElementById("taxon-rank"); if (eleRnk) {eleRnk.value =  rank;}
const eleSts = document.getElementById("taxon-status"); if (eleSts) {eleSts.value =  status;}
const eleCto = document.getElementById("compare-to"); if (eleCto) {eleCto.value =  qField;}
const eleSiz = document.getElementById("page-size"); if (eleSiz) {eleSiz.value =  limit;}
const eleDwn = document.getElementById("download-progress"); if (eleDwn) {eleDwn.style.display = 'none';}
const eleOvr = document.getElementById("download-overlay"); if (eleOvr) {eleOvr.style.display = 'none';}
//const eleInf = document.getElementById("information-overlay"); if (eleInf) {eleInf.style.display = 'none';}

//create DOM elements for modal image overlay (eg. shown when clicking wikiPedia image thumbnail)
const modalDiv = document.createElement("div");
modalDiv.id = "divModal";
modalDiv.className = "modal-div";
modalDiv.onclick = function() {modalDiv.style.display = "none";}
document.body.appendChild(modalDiv);
const modalSpn = document.createElement("span");
modalSpn.className = "modal-close";
modalSpn.innerHTML = "&times";
const modalCap = document.createElement("div");
modalCap.id = "capModal";
modalDiv.appendChild(modalCap);
const modalImg = document.createElement("img")
modalImg.id = "imgModal";
modalImg.className = "modal-content";
modalDiv.appendChild(modalImg);

var waitRow; var waitObj;

async function addTableWait() {
  waitRow = eleTbl.insertRow(0);
  waitObj = waitRow.insertCell(0);
  waitObj.style = 'text-align: center;';
  waitObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:60px;"></i>`;
}

function remTableWait() {
  waitObj.remove();
  waitRow.remove();
}
  
async function addHead() {
  let objHed = eleTbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (hedNam, hedIdx) => {
    console.log('addHead', hedNam, hedIdx);
    columnIds[hedNam]=hedIdx; //make an object having names as keys and index as values, for use by dataTables to enable/disable sorting
    let colObj = await hedRow.insertCell(hedIdx);
    colObj.innerHTML = columNames[hedNam];
    if ("canonicalName" == hedNam) {
      colObj.innerHTML = `
        ${columNames[hedNam]}
        <a href="#" onclick="toggleInfo('Click taxon name to view its profile.');">
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
async function addTaxaByKeys(occs) {
  tKeys.forEach(async (key, rowIdx) => {
    let objRow = eleTbl.insertRow(rowIdx);
    await fillRow({taxonKey: key}, objRow, rowIdx, occs);
  })
}

// Create table row for each array element, then fill row of cells
async function addTaxaFromArr(sArr, occs) {
  sArr.forEach(async (objSpc, rowIdx) => {
    let objRow = eleTbl.insertRow(rowIdx);
    //let taxKey = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
    //console.log(`get_species_results::addTaxaFromArr | key:${sObj.key} | nubKey:${sObj.nubKey} | result:${taxKey}`);
    await fillRow(objSpc, objRow, rowIdx, occs);
  })
}

// Fill a row of cells for a taxon object retrieved from species search, or other. At minimum, objSpc
// must be {key: taxonKey}
async function fillRow(objSpc, objRow, rowIdx, occs) {
  var key = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
  var res = objSpc;
  var occ,img = {count: 'n/a'}; //initialize these to valid objects in case GETs, below, fail
  //var wik = {}; //wikipedia page
  if (objSpc.taxonKey) { //search by query param taxonKey
    key = objSpc.taxonKey;
    try {
      res = await getTaxon(key);
      key = res.nubKey ? res.nubKey : res.key; //must again resolve key to nubKey if exists
    } catch (err) {
      //getTaxon failed, so leave it as initialized
    }
  }
  //console.log('gbif_species_results::fillRow','canonicalName:', objSpc.canonicalName, 'key:', objSpc.key, 'nubKey:', objSpc.nubKey, 'combinedKey:', key);
  columns.forEach(async (colNam, colIdx) => {
    let colObj = objRow.insertCell(colIdx);
    let name = res.canonicalName ? res.canonicalName : res.scientificName;
    switch(colNam) {
      case 'canonicalName':
        //colObj.innerHTML = `<a href="${resultsUrl}?q=${name}">${name}</a>`; //call self with name
        //colObj.innerHTML += `<a title="Wikipedia: ${name}" href="https://en.wikipedia.org/wiki/${name}">${name}</a>`; //wikipedia link to name
        colObj.innerHTML += `<a title="VAL Species Profile: ${name}" href="${profileUrl}?taxonName=${name}">${name}</a>`;
        //colObj.innerHTML = `<a href="${resultsUrl}?higherTaxonKey=${key}&higherTaxonName=${name}&higherTaxonRank=${res['rank']}">${name}</a>`; //child taxa of name
        //colObj.title = `Click '${name}' to view its profile. Click tree icon to list its child taxa.`; //apply title directly to sub-elements
        break;
      case 'scientificName': //show scientificName but link by canonicalName
        //colObj.innerHTML += `<a title="Wikipedia: ${name}" href="https://en.wikipedia.org/wiki/${name}">${res.scientificName}</a>`; //wikipedia link to name
        colObj.innerHTML += `<a title="VAL Species Profile: ${name}" href="${profileUrl}?taxonName=${name}">${name}</a>`;
        break;
      case 'childTaxa':
        colObj.innerHTML += `<a title="List child taxa of ${name}" href="${resultsUrl}?q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}"><i class="fa-solid fa-code-branch"></i></a>`
        break;
      case 'vernacularNames':
        let vnArr = res[colNam]; //array of vernacular columNames
        if (!vnArr) break;
        vnArr.forEach((ele, idx) => {
          colObj.innerHTML += ele.vernacularName;
          //colObj.innerHTML += `<a href="${resultsUrl}?q=${ele.vernacularName}">${ele.vernacularName}</a>`; //original - load self with just common name
          //colObj.innerHTML += `<a title="Wikipedia: ${ele.vernacularName}" href="https://en.wikipedia.org/wiki/${ele.vernacularName}">${ele.vernacularName}</a>`; //modified - wikipedia link common name
          if (idx < Object.keys(vnArr).length-1) {colObj.innerHTML += ', ';}
        })
        break;
      case 'scientificName': case 'parent': case 'vernacularName':
        colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey': case 'parentKey':
        //colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        //colObj.innerHTML = `<a href="${resultsUrl}?q=&higherTaxonKey=${res[colNam]}&higherTaxonName=${name}&higherTaxonRank=${res['rank']}">${res[colNam]}</a>`;
        //colObj.title = `List child taxa of '${name}' with key ${res[colNam]}`;
        colObj.innerHTML = res[colNam] ? `<a href="https://www.gbif.org/species/${res[colNam]}">${res[colNam]}</a>` : null;
        colObj.title = `View '${name}' with key ${res[colNam]} on GBIF`;
        break;
      case 'higherClassificationMap':
        let tree = res[colNam]; //object of upper taxa like {123456:Name,234567:Name,...}
        if (!tree) break;
        Object.keys(tree).forEach((key, idx) => {
          colObj.innerHTML += `<a title="Species Explorer: ${tree[key]}" href="${resultsUrl}?q=${tree[key]}">${tree[key]}</a>`; //load self with just parent taxon
          //colObj.innerHTML += `<a title="Wikipedai: ${tree[key]}" href="https://en.wikipedia.org/wiki/${tree[key]}">${tree[key]}</a>`; //wikipedia: parent taxon
          if (idx < Object.keys(tree).length-1) {colObj.innerHTML += ', ';}
        })
        break;
      case 'parentTaxa':
        if (res.kingdom) {colObj.innerHTML += `<a title="Species Explorer: Kingdom ${res.kingdom}" href="${resultsUrl}?q=${res.kingdom}">${res.kingdom}</a>`;}
        if (res.phylum) {colObj.innerHTML += `, <a title="Species Explorer: Phylum ${res.phylum}" href="${resultsUrl}?q=${res.phylum}">${res.phylum}</a>`;}
        if (res.class) {colObj.innerHTML += `, <a title="Species Explorer: Class ${res.class}" href="${resultsUrl}?q=${res.class}">${res.class}</a>`;}
        if (res.order) {colObj.innerHTML += `, <a title="Species Explorer: Order ${res.order}" href="${resultsUrl}?q=${res.order}">${res.order}</a>`;}
        if (res.family) {colObj.innerHTML += `, <a title="Species Explorer: Family ${res.family}" href="${resultsUrl}?q=${res.family}">${res.family}</a>`;}
        if (res.genus) {colObj.innerHTML += `, <a title="Species Explorer: Genus ${res.genus}" href="${resultsUrl}?q=${res.genus}">${res.genus}</a>`;}
        if (res.species) {colObj.innerHTML += `, <a title="Species Explorer: Species ${res.species}" href="${resultsUrl}?q=${res.species}">${res.species}</a>`;}
        break;
      case 'occurrences':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        occs.then(occs => {
          colObj.innerHTML = `<a href="${exploreUrl}?taxonKey=${key}&view=MAP">${nFmt.format(occs[key]?occs[key]:0)}</a>`;
        }).catch(err => {colObj.innerHTML = ''; console.log(`ERROR in occurrence counts:`, err);})
        /*
        try {
          occ = await getOccCountsByKey(key);
          colObj.innerHTML = `<a href="${exploreUrl}?taxonKey=${key}&view=MAP">${nFmt.format(occ.count)}</a>`;
        } catch (err) {}
        */
        break;
      case 'iconImage':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        try {
          let wik = await getWikiPage(name);
          colObj.innerHTML = '';
          if (wik.thumbnail) {
            let iconImg = document.createElement("img");
            //iconImg.src = wik.originalimage.source;
            iconImg.src = wik.thumbnail.source;
            iconImg.alt = name;
            iconImg.className = "icon-image";
            iconImg.width = "30"; 
            iconImg.height = "30";
            iconImg.onclick = function() {modalDiv.style.display = "block"; modalImg.src = wik.originalimage.source; modalCap.innerHTML = this.alt;}
            colObj.appendChild(iconImg);
          }
        } catch(err) {colObj.innerHTML = ''; console.log(`ERROR in getWikiPage:`, err);}
        break;
      case 'images':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        try {
          img = await getImgCount(key);
          colObj.innerHTML = `<a href="${exploreUrl}?taxonKey=${key}&view=GALLERY">${nFmt.format(img.count)}</a>`;
        } catch (err) {colObj.innerHTML = ''; console.log(`ERROR in getImageCount:`, err);}
        break;
      case 'taxonomicStatus':
        if (res.accepted) {
          colObj.innerHTML += `<a title="Species Explorer ACCEPTED name: ${res.accepted}" href="${resultsUrl}?q=${res.accepted}">${res[colNam]}</a>`;
        } else {
          colObj.innerHTML = res[colNam] ? res[colNam] : null;
        }
        break;
      default:
        colObj.innerHTML = res[colNam] ? res[colNam] : null;
        break;
    }
  });
}

//These functions are not used - they're duplicated directly within html by an inline javascript tag
export function showInfo(text=false) {
  if (eleInf) {if (text) eleInf.innerHTML = text; eleInf.style.display = 'block'; info_on = true;}
}
export function hideInfo() {
  if (eleInf) {eleInf.style.display = 'none'; info_on = false;}
}
export function toggleInfo(text=false) {
  if (eleInf) { if (text && text != eleInf.innerHTML) {showInfo(text);} else if (info_on) {hideInfo();} else {showInfo(text);} }
}

/*
  Get a GBIF taxon from the species API by taxonKey
  return a single object for a single GBIF taxonKey.
  This endpoint provides different values than the
  /species/search endpoint. dataSetKey is moot here,
  and we don't get vernacularNames.
  eg.
*/
async function getTaxon(key) {
  let reqHost = gbifApi;
  let reqRoute = "/species/";
  let reqValue = key;
  let url = reqHost+reqRoute+reqValue;
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

//get dataset info for speciesDatasetKey
export async function getDatasetInfo(speciesDatasetKey) {

  let reqHost = gbifApi;
  let reqRoute = `/dataset/${speciesDatasetKey}`;
  let url = reqHost+reqRoute;
  let enc = encodeURI(url);

  console.log(`getDatasetInfo(${speciesDatasetKey})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    //console.log(`getDatasetInfo(${speciesDatasetKey}) RESULT:`, json);
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`getDatasetInfo(${speciesDatasetKey}) ERROR:`, err);
    throw new Error(err)
  }
}

export function SamePage(newParm=qParm, newLimit=limit, newOffset=offset, newQField=qField, newOther=other) {
  qParm = newParm;
  limit = newLimit;
  offset = newOffset;
  qField = newQField;
  other = newOther;
  window.location.assign(`${resultsUrl}?q=${qParm}&offset=${offset}&limit=${limit}&qField=${qField}${other}`);
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
        SamePage(newParm, limit, 0, qField, ""); //new search - remove otherParms, go to page 0, but keep user-defined limit
      }
    });}
if (document.getElementById("results_search_button")) {
    document.getElementById("results_search_button").addEventListener("mouseup", function(e) {
      let newParm = document.getElementById("results_search").value;
      SamePage(newParm, limit, 0, qField, ""); //new search - remove otherParms, go to page 0, but keep user-defined limit
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
      SamePage(qParm, limit, 0, qField, newOther);
    });}
if (document.getElementById("taxon-status")) {
    document.getElementById("taxon-status").addEventListener("change", function(e) {
      let newStatus = document.getElementById("taxon-status").value;
      console.log('taxon-status change to', newStatus);
      var newOther = "";
      if ("ALL" != newStatus) { //now we have to search the extant 'other' args for 'status' and replace it...
        objOther.status = newStatus; //just assign it in the object version of 'other' - this adds or replaces 'status'
      } else {
        delete objOther.status;
      }
      Object.keys(objOther).forEach(key => {newOther += `&${key}=${objOther[key]}`;}) //rebuild 'other' list from 'other' object
      SamePage(qParm, limit, 0, qField, newOther);
    });}
if (document.getElementById("compare-to")) {
  document.getElementById("compare-to").addEventListener("change", function(e) {
    let newCompare = document.getElementById("compare-to").value;
    console.log('compare-to change to', newCompare);
    if ("ALL" == newCompare) {newCompare = '';}
    SamePage(qParm, limit, 0, newCompare);
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
async function getAllDataPages(q=qParm, lim=limit, qf=qField, oth=other) {
  var res = []; var page = {}; var off = 0; var fatalError = 0;
  eleDwn.style.display = 'block'; eleOvr.style.display = 'block';
  do {
    try {
      page = await speciesSearch(q, off, lim, qf, oth);
      await page.results.forEach(async oSpc => {
      //for (var i=0; i<page.results.length; i++) { //blocking for-loop
        //let oSpc = page.results[i];
        let key = oSpc.nubKey ? oSpc.nubKey : oSpc.key;
        //console.log(`getAllDataPages | add occurrence counts`, oSpc);
        delete oSpc.habitats;
        delete oSpc.nomenclaturalStatus;
        delete oSpc.threatStatuses;
        delete oSpc.descriptions;
        delete oSpc.higherClassificationMap;
        let aVns = oSpc.vernacularNames.slice(); //must copy arrays by value
        delete oSpc.vernacularNames;
        let tVns = '';
        await aVns.forEach(async oVn => { //put array of vernacularNames into pipe-delimited string
          tVns += `${oVn.vernacularName}|`;
        })
        oSpc.vernaculars = tVns;
      })
      res = res.concat(page.results);
      console.log('getAllDataPages', res.length, page.results.length, page.count);
      off += limit;
      eleDwn.innerHTML = `<p>Downloading... progress ${off}/${page.count}</p><p><a href="">Abort</a></p>`;
    } catch(err) {
      fatalError = 1;
      console.log(err);
      eleDwn.innerHTML = `Fatal error: <p>${err}</p><p><a href="">Reload page to try again.</a></p>`;
    }
  } while (!page.endOfRecords && !fatalError);
  console.log('getAllDataPages | result size', res.length);
  if (!fatalError) {
    //if (dataConfig.downloadOccurrenceCounts) {
     for (var i=0; i<res.length; i++) {
      let oSpc = res[i];
      let key = oSpc.nubKey ? oSpc.nubKey : oSpc.key;
      gOccCnts.then(occCnts => { //
        oSpc[`${dataConfig.atlasAbbrev}-Occurrences`] = occCnts[key] ? occCnts[key] : 0;
      }).catch(err => {
        console.log(`Unable to retrieve occurrence counts.`);
      })
     }
    //}
    eleDwn.style.display = 'none'; eleOvr.style.display = 'none';
  }
  return res;
}

//Download qParm full-result set as csv (type==0) or json (type==1)
async function getDownloadData(type=0) {
  let spc = await getAllDataPages(); //returns just an array of taxa, not a decorated object
  let dsi = await getDatasetInfo(speciesDatasetKey); //returns a single object
  var name = `${dataConfig.atlasAbbrev}_taxa`; //download file name
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
    addTableWait();
    gOccCnts = getStoredOccCnts();
    await addTaxaByKeys(gOccCnts);
    await addHead();
    if (eleLbl) {
      eleLbl.innerHTML = "Showing results for taxon keys: ";
      tKeys.forEach((key, idx) => {
        eleLbl.innerHTML += key;
        if (idx < tKeys.length-1) {eleLbl.innerHTML += ', ';}
      })
      eleLb2.innerHTML = eleLbl.innerHTML;
    }
    remTableWait();
  } else { //important: include q="" to show ALL species result
    if (!qParm) {qParm = "";}
    if ("" === qParm && !other) {other='&rank=KINGDOM'; objOther={'rank':'KINGDOM'}; eleRnk.value='KINGDOM';}
    try {
      addTableWait();
      gOccCnts = getStoredOccCnts();
      let spcs = await speciesSearch(qParm, offset, limit, qField, other);
      count = spcs.count;
      await addTaxaFromArr(spcs.results, gOccCnts);
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
        eleLb2.innerHTML = eleLbl.innerHTML;
      }
      remTableWait();
    } catch (err) {
      putErrorOnScreen(err);
    }
  }
} else {
  console.log('gbif_species_results.js requires a table having id="species-table" to operate.')
}

if (eleTtl) {
  eleTtl.innerText = `${dataConfig.atlasPlace} Species Explorer`;
}

if (eleHlp) {
  if (dataConfig.helpDeskUrl) {
    eleHlp.style.display = 'inline';
    eleHlp.href = dataConfig.helpDeskUrl;
  } else {
    eleHlp.style.display = 'none';
  }
}

/*
 * Configure jQuery dataTable for column sorting. Note that this was called on completed Occ Counts. That's
 * because dataTables can't sort on columns without values. We remove from sorting other columns whose data
 * we don't wait for, but that could be done.
 */
function setDataTable() {
  let hideCols = [columnIds['childTaxa'], columnIds['iconImage'], columnIds['images']]; //images, iconImage, childTaxa
  console.log(`setDataTable | hide volumnIds`, hideCols, 'of Columns', columnIds)
  $('#species-table').DataTable({
    responsive: false,
    order: [columnIds['occurrences'], 'desc'],
    paging: false, //hides the pagination logic
    searching: false, //hides the dt search box
    info: false, //hides the 1 to 20 of 20
    columnDefs: [
      { orderable: false, targets: columnIds['childTaxa'] }, //childTaxa
      { orderable: false, targets: columnIds['iconImage'] }, //iconImage
      { orderable: false, targets: columnIds['images'] }  //images (imageCount)
    ]
/*
    lengthMenu: [
      [10, 20, 50, 100, 500, -1],
      [10, 20, 50, 100, 500, 'All'],
    ],
    pageLength: limit
*/
  });
}

$('#species-table').ready(function () {
  gOccCnts.then(() => {setDataTable()})
});