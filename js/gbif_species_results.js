import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { speciesSearch } from './gbif_species_search.js'; //NOTE: importing just a function includes the entire module
import { getStoredOccCnts, getAggOccCounts } from '../VAL_Web_Utilities/js/gbifOccFacetCounts.js';
import { getWikiPage } from '../VAL_Web_Utilities/js/wikiPageData.js';
import { tableSortSimple } from '../VAL_Web_Utilities/js/tableSortSimple.js';
import { tableSortTrivial } from '../VAL_Web_Utilities/js/tableSortTrivial.js';
import { tableSortHeavy } from '../VAL_Web_Utilities/js/tableSortHeavy.js';
import { gbifCountsByDateByTaxonKey } from '../VAL_Species_Page/js/gbifCountsByDate.js';
import { getGbifTaxonObjFromName, getGbifTaxonObjFromKey, getParentRank, getNextChildRank } from '../VAL_Web_Utilities/js/commonUtilities.js';
import { getInatSpecies } from '../VAL_Web_Utilities/js/inatSpeciesData.js';

const gbifApi = "https://api.gbif.org/v1";
var siteName = siteConfig.siteName;
var dataConfig;
var speciesDatasetKey;
var exploreUrl;
var resultsUrl;
var profileUrl;
var columns;
var columNames;
var gOccCnts = [];
var downloadOccurrenceCounts = 0;
var fileConfig = false; //this global pointer used ONLY for getDownloadData

import(`../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`)
  .then(fCfg => {
    fileConfig = fCfg; //set global value
    console.log('gbif_species_results | siteName:', siteName, 'dataConfig:', fCfg.dataConfig);
    startUp(fCfg);
  })

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
const elePag = document.getElementsByName("page-number"); elePag.forEach(ele => {ele.innerText = `Page ${nFmt.format(page)}`;})
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

function putErrorOnScreen(err) {
  let objRow = eleTbl.insertRow(0);
  let colObj = objRow.insertCell(0);
  colObj.innerHTML = err;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function addHead() {
  let objHed = eleTbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (hedNam, hedIdx) => {
    console.log('addHead', hedNam, hedIdx);
    columnIds[hedNam]=hedIdx; //make an object having names as keys and index as values, for use by dataTables to enable/disable sorting
    let colObj = await hedRow.insertCell(hedIdx);
    //colObj.outerHTML = `<th>${columNames[hedNam]}</th>`
    colObj.innerHTML =  `<th>${columNames[hedNam]}</th>`
    let html;
    if ("childTaxa" == hedNam) {html = `Click symbol for Species Explorer with ALL sub-taxa of taxon. Click named rank for Species Explorer with sub-taxa having only that rank.`}
    if ("parent" == hedNam) {html = `Click symbol for Species Explorer with ALL children of named parent taxon. Click parent taxon name for Species Explorer with just that taxon and rank.`}
    if ("canonicalName" == hedNam) {html = `Click taxon name to view its Species Profile.`}
    if ("vernacularNames" == hedNam) {html = 'Click common name for Species Explorer search of that name.'}
    if ("occurrences" == hedNam) {html = 'Counts are for taxon and sub-taxa. Click count for Occurrence Explorer.'}
    if (html) {colObj.innerHTML += `<a href="#" onmouseover="showInfo('${html}');" onmouseout="hideInfo();"><i class="fa fa-info-circle"></i></a>`;}
  });
}

// Create table row for each taxonKey, then fill row of cells
async function addTaxaByKeys(fCfg, tArr) {
  //tArr.forEach(async (key, rowIdx) => {
  for (const key of tArr) {
    let objRow = eleTbl.insertRow(-1);//add row to end
    let objSpc = await getTaxon(key); //get taxon object from GBIF 1st
    //let rowProm = fillRow(fCfg, objSpc, objRow, rowIdx);
    let rowProm = fillRow(fCfg, objSpc, objRow);
    gOccCnts.push(rowProm);
  }//)
  //await sleep(100); //addByKeys is too fast
  Promise.all(gOccCnts).then(() => {columnSort()}); //array of promises used by column sort to wait for all data before sorting
}

// Create table row for each array element, then fill row of cells
async function addTaxaFromArr(fCfg, sArr) {
  sArr.forEach(async (objSpc, rowIdx) => {
    let objRow = eleTbl.insertRow(-1);//add row to end;
    let rowProm = fillRow(fCfg, objSpc, objRow, rowIdx);
    gOccCnts.push(rowProm);
  })
  Promise.all(gOccCnts).then(() => {columnSort()}); //array of promises used by column sort to wait for all data before sorting
}

// Fill a row of cells for a taxon object retrieved from species search, or other. At minimum, objSpc
// must be {taxonKey: key}
async function fillRow(fCfg, objSpc, objRow, rowIdx) {
  var key = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
  var res = objSpc;
  let txn = await getGbifTaxonObjFromKey(objSpc.key); //get taxonObj for species-list key to obtain its view of taxonomy
  let name = res.canonicalName ? res.canonicalName : res.scientificName;
  let inat; try {inat = await getInatSpecies(name, res.rank, res.parent, getParentRank(res.rank));} catch(err) {inat={};}
  console.log(`gbif_species_results=>getInatSpecies(${name}, ${res.rank}, ${res.parent}, ${getParentRank(res.rank)})`, inat)
  let wiki = await getWikiPage(name);
  //getStoredOccCnts(fCfg, `taxonKey=${res.nubKey}`)
  let gbif = gbifCountsByDateByTaxonKey(res.key, fCfg);
  gOccCnts.push(gbif); //new promise with each row. a dubious construct.
  //console.log('gbif_species_results::fillRow','canonicalName:', objSpc.canonicalName, 'key:', objSpc.key, 'nubKey:', objSpc.nubKey, 'combinedKey:', key);
  columns.forEach(async (colNam, colIdx) => {
    let colObj = objRow.insertCell(colIdx);
    switch(colNam) {
      case 'canonicalName':
        //NOTE: now calling species profile with listKey, NOT nubKey. Species profile handles subKey disagreements, key lists, and counts.
        colObj.innerHTML += `<a title="Species Profile: ${name}" href="${profileUrl}?siteName=${siteName}&taxonKey=${res.key}&taxonName=${name}&taxonRank=${res.rank}">${name}</a>`;
        break;
      case 'scientificName': //show and link with canonicalName
        //NOTE: now calling species profile with listKey, NOT nubKey. Species profile handles subKey disagreements, key lists, and counts.
        colObj.innerHTML += `<a title="Species Profile: ${name}" href="${profileUrl}?siteName=${siteName}&taxonKey=${res.key}&taxonName=${name}&taxonRank=${res.rank}">${name}</a>`;
        break;
      case 'wikipedia': //unused column-name to store old way of doing things
        colObj.innerHTML += `<a title="Wikipedia: ${name}" href="https://en.wikipedia.org/wiki/${name}">${res.scientificName}</a>`; //wikipedia link to name
        break;
      case 'childTaxa':
        //new idea: just get child taxa one rank lower
        if ('SUBSPECIES' != res.rank && 'VARIETY' != res.rank) {
          let ncRank = getNextChildRank(res.rank);
          colObj.innerHTML += `<a title="Species Explorer: ALL sub-taxa of ${res.rank} ${name}" href="${resultsUrl}?q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}"><i class="fa-solid fa-code-branch child-branch"></i></a>`
          colObj.innerHTML += ` | <a title="Species Explorer: ${ncRank} sub-taxa of ${res.rank} ${name}" href="${resultsUrl}?q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}&rank=${ncRank}">${ncRank}</a>`
        }
        //colObj.innerHTML += `<a title="List child taxa of ${name}" href="${resultsUrl}?q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}"><i class="fa-solid fa-code-branch"></i></a>`
        break;
      case 'vernacularNames':
        let vnObj = {};
        if (txn.vernacularName) { //taxon by key from /species/{key}?datasetKey=species-list-key
          txn.vernacularName = txn.vernacularName.replace(`'S`,`'s`);
          vnObj[txn.vernacularName] = txn.key;
        } 
        if (res.vernacularName) { //taxon by key from species/search
          res.vernacularName = res.vernacularName.replace(`'S`,`'s`);
          vnObj[res.vernacularName] = res.key;
        }
        if (res.vernacularNames) {
          res.vernacularNames.forEach((ele, idx) => {
            ele.vernacularName = ele.vernacularName.replace(`'S`,`'s`);
            vnObj[ele.vernacularName] = res.key;
          })
        }
        if (inat.preferred_common_name) {vnObj[inat.preferred_common_name] = res.key;}
        Object.keys(vnObj).forEach((key, idx) => {
          if (key) {
            colObj.innerHTML += `<a title="Species Explorer: ${key}" href="${resultsUrl}?q=${key}">${key}</a>`;
            if (idx < Object.keys(vnObj).length-1) {colObj.innerHTML += ', ';}
          }
        })
        break;
      case 'scientificName': case 'vernacularName':
        colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: ${res[colNam]}" href="${resultsUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'parent':
        //colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: Explore parent taxon ${res[colNam]}" href="${resultsUrl}?q=${res[colNam]}">${res[colNam]}</a>` : null;
        colObj.innerHTML += res[colNam] ? `<a title="Species Explorer: ALL sub-taxa of parent taxon ${res[colNam]}" href="${resultsUrl}?q=${res[colNam]}"><i class="fa-solid fa-code-branch parent-branch"></i></a>` : null;
        colObj.innerHTML += res[colNam] ? ` | <a title="Species Explorer: Parent taxon ${getParentRank(res.rank)} ${res[colNam]}" href="${resultsUrl}?q=${res[colNam]}&rank=${getParentRank(res.rank)}">${res[colNam]}</a>` : null;
        break;
      case 'parentKey':
        colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: ${res[colNam]}" href="${resultsUrl}?taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey':
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
          //colObj.innerHTML += `<a title="Wikipedia: ${tree[key]}" href="https://en.wikipedia.org/wiki/${tree[key]}">${tree[key]}</a>`; //wikipedia: parent taxon
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
        //NOTE: GBIF species/search often does not return a parent SPECIES for a SUBSPECIES taxon, which is why it doesn't show up.
        break;
      case 'occurrences':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        gbif.then(gbif => {
          let title = `Occurrence Explorer: ${name}`;
          if (gbif.names) {title += `, ${gbif.names.join(", ")}`};
          colObj.innerHTML = `<a title="${title}" href="${exploreUrl}?${gbif.search}&view=MAP">${nFmt.format(gbif.total)}</a>`;
        })
/*
        //gOccCnts.then(occs => {
        getStoredOccCnts(fCfg, `taxonKey=${res.nubKey}`).then(occs => {
          colObj.innerHTML += `<a href="${exploreUrl}?taxonKey=${key}&view=MAP">${nFmt.format(occs[key]?occs[key]:0)}</a>`;
          //console.log('nubKey', res.nubKey, 'speciesListKey', res.key, res);
          //NOTE: must restrict to accepted species & subspecies for now - it double-counts some sub-taxa for genus and above
          if (res.key != res.nubKey && !res.acceptedKey && ('SPECIES'==res.rank.toUpperCase() || 'SUBSPECIES'==res.rank.toUpperCase())) {
            sumSubTaxonOccs(fCfg, occs, res.key, res.nubKey).then(res => {
              let top = occs[key]?occs[key]:0;
              let sum = top + res.sum;
              let keys = res.keys.map(key => {console.log('mapkey', key); return `&taxonKey=${key}`;}); //returns array. use .join('') for string
              console.log('sumAllTaxonOccs | parent:', occs[key], 'subSum:', res.sum, 'subKeys:', keys);
              colObj.innerHTML = `<a href="${exploreUrl}?taxonKey=${key}${keys.join('')}&view=MAP">${nFmt.format(sum?sum:0)}</a>`;  
            }).catch(err => {colObj.innerHTML = ''; console.log(`ERROR in sumSubTAxonOccs:`, err);})
          } else {
            colObj.innerHTML = `<a href="${exploreUrl}?taxonKey=${key}&view=MAP">${nFmt.format(occs[key]?occs[key]:0)}</a>`;
          }
        }).catch(err => {colObj.innerHTML = ''; console.log(`ERROR in occurrence counts:`, err);})
*/
        break;
      case 'iconImage':
        let imgInfo = false;
        if (wiki.thumbnail) {
          imgInfo = {
            iconSrc: wiki.thumbnail.source,
            overSrc: wiki.originalimage.source,
            attrib: ''
          }
        } else if (inat.default_photo) {
          imgInfo = {
            iconSrc: inat.default_photo.medium_url,
            overSrc: inat.default_photo.medium_url,
            attrib: inat.default_photo.attribution
          }
        }
        if (imgInfo) {
          let iconImg = document.createElement("img");
          iconImg.src = imgInfo.iconSrc;
          iconImg.alt = `${name} ${imgInfo.attrib}`;
          iconImg.className = "icon-image";
          iconImg.width = "30"; 
          iconImg.height = "30";
          iconImg.onclick = function() {
            modalDiv.style.display = "block"; 
            modalImg.src = imgInfo.overSrc; 
            modalImg.alt = imgInfo.attrib; 
            modalCap.innerHTML = this.alt;}
          colObj.appendChild(iconImg);
        }
        break;
      case 'images':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        try {
          let imgs = getAggOccCounts(fileConfig, `taxonKey=${key}`, 'mediaType')
          gbif.then(gbif => {
            imgs.then(imgs => {
              colObj.innerHTML = `<a href="${exploreUrl}?${gbif.search}&view=GALLERY">${nFmt.format(imgs.objOcc.StillImage)}</a>`;
            })
          })
        } catch (err) {colObj.innerHTML = ''; console.log(`ERROR in getImageCount:`, err);}
        break;
      case 'taxonomicStatus':
        if (res.accepted) {
          //colObj.innerHTML += `<a title="Species Explorer ACCEPTED name: ${res.accepted}" href="${resultsUrl}?q=${res.accepted}">${res[colNam]}</a>`;
          colObj.innerHTML += `<a title="Species Explorer ACCEPTED name: ${res.accepted}" href="${resultsUrl}?taxonKey=${res.acceptedKey}">${res[colNam]}</a>`;
        } else {
          colObj.innerHTML = res[colNam] ? res[colNam] : null;
        }
        break;
      default:
        console.log('switch-default', colNam, res[colNam], objSpc);
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
  if (offset + limit > 9999) {
    alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
  } else if ((offset + limit) < count) {
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
  //alert(`LastPage() | count:${count}, limit:${limit}, offset:${offset}`);
  if (count > 10000) {
    alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
  } else  if (count > limit) {
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
document.getElementsByName("page-prev").forEach((ele) => {
    ele.addEventListener("mouseup", (e) => {
      PrevPage();
    })
  })
document.getElementsByName("page-next").forEach((ele) => {
    ele.addEventListener("mouseup", (e) => {
      NextPage();
    })
  })
document.getElementsByName("page-first").forEach((ele) => {
    ele.addEventListener("mouseup", (e) => {
      FirstPage();
    })
  })
document.getElementsByName("page-last").forEach((ele) => {
    ele.addEventListener("mouseup", (e) => {
      LastPage();
    })
  })
if (document.getElementById("download-json")) {
    document.getElementById("download-json").addEventListener("mouseup", function(e) {
      if (count > 9999) {
        alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
      } else {
        getDownloadData(1);
      }
    });}
if (document.getElementById("download-csv")) {
    document.getElementById("download-csv").addEventListener("mouseup", function(e) {
      if (count > 9999) {
        alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
      } else {
        getDownloadData(0);
      }
    });}
//using search term and other query parameters, download all species data by page and concatenate into a single array of objects
//NOTE: function arguments are all initialized to global values!
async function getAllDataPages(fCfg, q=qParm, lim=limit, qf=qField, oth=other) {
  var res = []; var page = {}; var off = 0; var fatalError = 0;
  eleDwn.style.display = 'block'; eleOvr.style.display = 'block';
  do {
    try {
      page = await speciesSearch(fCfg.dataConfig, q, off, lim, qf, oth);
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
  if (!fatalError && downloadOccurrenceCounts) {
     for (var i=0; i<res.length; i++) {
      let oSpc = res[i];
      let key = oSpc.nubKey ? oSpc.nubKey : oSpc.key;
      /*
      gOccCnts.then(occCnts => { //
        oSpc[`${dataConfig.atlasAbbrev}-Occurrences`] = occCnts[key] ? occCnts[key] : 0;
      }).catch(err => {
        console.log(`Unable to retrieve occurrence counts.`);
      })
      */
      let gbif = await gbifCountsByDateByTaxonKey(key, fCfg);//This call must be synchronous. And so we await.
      oSpc[`${dataConfig.atlasAbbrev}-Occurrences`] = gbif.total;
     }
    eleDwn.style.display = 'none'; eleOvr.style.display = 'none';
  }
  return res;
}

//Download qParm full-result set as csv (type==0) or json (type==1)
async function getDownloadData(type=0) {
  import(`../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`)
  .then(async fCfg => {
    let spc = await getAllDataPages(fCfg); //returns just an array of taxa, not a decorated object
    let dsi = await getDatasetInfo(fCfg.dataConfig.speciesDatasetKey); //returns a single object
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
  })
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
  const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
  const header = Object.keys(json[0]);  // the first row defines the header
  const csv = [
    header.join(','), // header row first
    ...json.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')) //iterate over header keys, extract row data by key
  ].join('\r\n');

  return csv;
}

async function startUp(fileConfig) {

  dataConfig = fileConfig.dataConfig;
  speciesDatasetKey = dataConfig.speciesDatasetKey;
  exploreUrl = dataConfig.exploreUrl;
  resultsUrl = dataConfig.resultsUrl;
  profileUrl = dataConfig.profileUrl;
  columns = dataConfig.columns;
  columNames = dataConfig.columNames;
    
  if (eleTbl) { //results are displayed in a table with id="species-table". we need that to begin.
    if (tKeys.length) {
      try {
        addTableWait();
        //gOccCnts = getStoredOccCnts(fileConfig);
        await addTaxaByKeys(fileConfig, tKeys);
        await addHead();
        if (eleLbl) {
          eleLbl.innerHTML = "Showing results for taxon keys: ";
          tKeys.forEach((key, idx) => {
            eleLbl.innerHTML += key;
            if (idx < tKeys.length-1) {eleLbl.innerHTML += ', ';}
          })
          if (eleLb2) {eleLb2.innerHTML = eleLbl.innerHTML;}
        }
        Promise.all(gOccCnts).then(() => {remTableWait()});
      } catch (err) {
        putErrorOnScreen(err);
      }
    } else { //important: include q="" to show ALL species result
      if (!qParm) {qParm = "";}
      if ("" === qParm && !other) {
        if ('vtb' == siteName || 'ebu' == siteName || 'ebw' == siteName) {
          other='&rank=FAMILY'; objOther={'rank':'FAMILY'}; eleRnk.value='FAMILY';
        } else {
          other='&rank=KINGDOM'; objOther={'rank':'KINGDOM'}; eleRnk.value='KINGDOM';
        }
      }
      try {
        addTableWait();
        //gOccCnts = getStoredOccCnts(fileConfig);
        let spcs = await speciesSearch(dataConfig, qParm, offset, limit, qField, other);
        count = spcs.count;
        if (spcs.count) {
          await addTaxaFromArr(fileConfig, spcs.results);
        } else {putErrorOnScreen('No data found.')}
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
          if (eleLb2) {eleLb2.innerHTML = eleLbl.innerHTML;}
        }
        Promise.all(gOccCnts).then(() => {remTableWait()});
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
}
/*
$('#species-table').ready(() => {
  Promise.all(gOccCnts).then(() => {
    columnSort();
  })
});
*/  
function columnSort() {
  Promise.all(gOccCnts).then(() => {
    //alert(`columnSort ${JSON.stringify(columnIds)}`);
    //let excludeColumnIds = [columnIds['childTaxa'], columnIds['iconImage'], columnIds['images']];
    let excludeColumnIds = [columnIds['childTaxa'], columnIds['iconImage']];
    tableSortHeavy('species-table', columnIds['occurrences'], excludeColumnIds);
    //tableSortSimple('species-table');
    //tableSortTrivial('species-table');
  });
}