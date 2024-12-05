import { siteConfig, siteNames } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { getSite } from '../../VAL_Web_Utilities/js/gbifDataConfig.js';
import { speciesSearch } from './gbif_species_search.js'; //NOTE: importing just a function includes the entire module
import { getStoredOccCnts, getAggOccCounts } from '../../VAL_Web_Utilities/js/gbifOccFacetCounts.js';
import { fetchOccSimpleCountByKey } from '../../VAL_Web_Utilities/js/gbifOccSimpleCounts.js';
import { getWikiPage } from '../../VAL_Web_Utilities/js/wikiPageData.js';
import { tableSortSimple } from '../../VAL_Web_Utilities/js/tableSortSimple.js';
import { tableSortTrivial } from '../../VAL_Web_Utilities/js/tableSortTrivial.js';
import { tableSortHeavy } from '../../VAL_Web_Utilities/js/tableSortHeavy.js';
import { gbifCountsByDateByTaxonKey } from '../../VAL_Species_Page/js/gbifCountsByDate.js';
import { getGbifTaxonFromName, getGbifTaxonFromKey, getGbifVernacularsFromKey, getParentRank, getNextChildRank, parseNameToRank } from '../../VAL_Web_Utilities/js/fetchGbifSpecies.js';
import { getInatSpecies } from '../../VAL_Web_Utilities/js/inatSpeciesData.js';
import { getStoredData, setStoredData } from '../../VAL_Web_Utilities/js/storedData.js';
import { capitalize, alphaNumeric } from '../../VAL_Web_Utilities/js/commonUtilities.js';
import { addInfoIcon, addInfoOverlay } from '../../VAL_Web_Utilities/js/infoPopup.js';
import { createImageOverlay, showImageOverlay } from '../../VAL_Web_Utilities/js/imageOverlay.js';
/*
sessionStorage: cleared when page session ends: when the page is closed
localStorage: stored data is saved across browser sessions
localStorage data for a document loaded in a "private browsing" or "incognito" session is cleared when the last "private" tab is closed.
*/
const sessionStore = window.sessionStorage ? window.sessionStorage : false;

const gbifApi = "https://api.gbif.org/v1";
const pageUrl = new URL(document.URL);
const objUrlParams = pageUrl.searchParams; //get URL search params from calling http route address
var siteName = await getSite(pageUrl);
var homeUrl;
var exploreUrl;
var resultsUrl;
var profileUrl;
var columns;
var columNames;
var gOccCnts = [];
var downloadOccurrenceCounts = 0;
var fileConfig = false; //this global pointer used after page is loaded for query updates by parameter (fyunction loadByQueryParams)

var columnIds = {};
const nFmt = new Intl.NumberFormat(); //use this to format numbers by locale... automagically

// get query params named 'taxonKey'
let tKeys = objUrlParams.getAll('taxonKey');
console.log('Query Param(s) taxonKeys:', tKeys);

// get 'q' query param
var qParm = objUrlParams.get('q');
var offset = objUrlParams.get('offset'); offset = Number(offset) ? Number(offset) : 0;
var limit = objUrlParams.get('limit'); limit = Number(limit) ? Number(limit) : 20;
var ranks =  objUrlParams.getAll('rank'); ranks = ranks.length ? ranks.map((rank) => rank.toUpperCase()) : ['ALL'];
var status =  objUrlParams.getAll('status'); status = status.length ? status.map((stat) => stat.toUpperCase()) : ['ALL'];
var qField =  objUrlParams.get('qField'); qField = qField ? qField.toUpperCase() : 'ALL';
var drillRanks = objUrlParams.get('drillRanks');
var count = 0; //this is set elsewhere after loading data. initialize here.
var page = offset / limit + 1;
console.log('Query param q:', qParm, 'offset:', offset, 'limit:', limit, 'page:', page, 'qField:', qField, 'Other:', other);

//get other query params (there are many, and they are necessary. eg. higherTaxonRank)
var other = ''; var objOther = {};
objUrlParams.forEach((val, key) => {
  if ('siteName'!=key && 'taxonKey'!=key && 'q'!=key && 'offset'!=key && 'limit'!=key && 'qField'!=key) {
    other += `&${key}=${val}`;
    if (objOther[key]) {objOther[key].push(val);}
    else {objOther[key] = [val];}
  }
});
console.log('objOther', objOther, other);

//get atlas configuration and startup
import(`../../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`)
  .then(fCfg => {
    fileConfig = fCfg; //set global value
    console.log('gbif_species_results | siteName:', siteName, 'dataConfig:', fCfg.dataConfig);
    startUp(fCfg);
  })
  .catch(err => {console.log('gbif_species_results=>import siteConfig ERROR', err)})

const eleTtl = document.getElementById("species-title"); //the h tag within the title
const eleHom = document.getElementById('homeLink');
const eleSit = document.getElementById('siteSelect');
const eleHlp = document.getElementById("flag-issue"); //id='flag-issue' element for HelpDesk support
const eleTxt = document.getElementById("results_search"); if (eleTxt) {eleTxt.value = qParm;}
const elePag = document.getElementsByName("page-number"); elePag.forEach(ele => {ele.innerText = `Page ${nFmt.format(page)}`;})
const eleTbl = document.getElementById("species-table");
const eleLbl = document.getElementById("search-value");
const eleLb2 = document.getElementById("search-value-bot"); //a duplicate search-value display to go below the table of results
const eleRnk = document.getElementById("taxon-rank"); if (eleRnk) {setChosenMulti(eleRnk, ranks);}
const eleSts = document.getElementById("taxon-status"); if (eleSts) {setChosenMulti(eleSts, status);}
const eleCto = document.getElementById("compare-to"); if (eleCto) {eleCto.value =  qField;}
const eleSiz = document.getElementById("page-size"); if (eleSiz) {eleSiz.value =  limit;}
const eleDwn = document.getElementById("download-progress"); if (eleDwn) {eleDwn.style.display = 'none';}
const eleOvr = document.getElementById("download-overlay"); if (eleOvr) {eleOvr.style.display = 'none';}
//const eleInf = document.getElementById("information-overlay"); if (eleInf) {eleInf.style.display = 'none';}
//create DOM elements for information icon help text
addInfoOverlay();
/* From page query parameters, set the chosen values of an (optionally) multi-select drop-down list. */
function setChosenMulti(eleMnt, values=[]) {
  //console.log('setChosenMulti=>eleMnt.options', eleMnt.options, '=>values', values);
  console.log('setChosenMulti=>values', eleMnt.id, values);
  if (eleMnt.multiple) { //Select element is in multi-select mode
    if (0==values.length) {
      eleMnt.value = 'ALL';
    } else if (1==values.length) {
      eleMnt.value = values[0];
    } else if (values.length > 1) {
      for (var i = 0; i < eleMnt.options.length; i++) {
        let selected = values.indexOf(eleMnt.options[i].value) >= 0;
        if (selected) {
          console.log('Select:', eleMnt.options[i].value, 'Value:', values[values.indexOf(eleMnt.options[i].value)])
        }
        eleMnt.options[i].selected = selected;
      }
    }
  } else { //Select element is in single-select mode
    eleMnt.value = values[0];
  }
}
//create DOM elements for modal image overlay (eg. shown when clicking wikiPedia image thumbnail)
createImageOverlay();
/*
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
*/
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

async function setHead() {
  let objHed = eleTbl.getElementsByTagName("thead");
  console.log('setHead', objHed);
  if (!objHed.length) {return await addHead();}
}
var initCollapsed = sessionStore.getItem('speciesExplorerParentTaxaCollapsed');
initCollapsed = "true" == initCollapsed ? true : false;
//console.log('sessionStorage(speciesExplorerParentTaxaCollapsed)', sessionStore.getItem('speciesExplorerParentTaxaCollapsed'), initCollapsed);
var sortableColumns = ['key','nubKey','canonicalName','scientificName','vernacularName','vernacularNames','rank','taxonomicStatus','parent','parentKey','occurrences']
var excludeColumns = []; //array of column names not sortable
async function addHead() {
  let objHed = eleTbl.createTHead();
  let hedRow = objHed.insertRow(0); //just one header objRow
  columns.forEach(async (hedNam, hedIdx) => {
    console.log('addHead', hedNam, hedIdx);
    columnIds[hedNam]=hedIdx; //make an object having names as keys and index as values, for use by dataTables to enable/disable sorting
    let colObj = await hedRow.insertCell(hedIdx);
    if ("parentTaxa" ==  hedNam) {
      const colHed = document.createElement("th");
      colHed.classList.add("parentTaxaHeader");
      const listNode = document.createElement("li"); //create a list tag <li>
      listNode.innerText = columNames[hedNam];
      colHed.appendChild(listNode);
      listNode.classList.add("parentTaxaHeader");
      if (initCollapsed) {listNode.classList.add("allCollapsed");}
      listNode.addEventListener("click", e => { //listen to <li> header click event
        e.target.classList.toggle("allCollapsed"); //toggle this class to alter the <li> element's marker
        let subNodes = document.querySelectorAll(".parentTaxa");
        subNodes.forEach(node => {node.classList.toggle("collapsed");})
        let topNodes = document.querySelectorAll(".parentTaxaTop");
        topNodes.forEach(node => {node.classList.toggle("collapsed");})
        initCollapsed = !initCollapsed;
        sessionStore.setItem('speciesExplorerParentTaxaCollapsed', initCollapsed)
      })
      colObj.appendChild(colHed); //add the <th> tag to the table column object
      //colObj.innerHTML =  `<th class="speciesExplorerColumnHeader parentTaxa">{columNames[hedNam]}</th>`
    } else {
      colObj.innerHTML =  `<th>${columNames[hedNam]}</th>`
    }
    let html;
    if ("childTaxa" == hedNam) {html = `Click <i class="fa-solid fa-code-branch parent-branch"></i> symbol to explore ALL sub-taxa of taxon. Click named rank to explore sub-taxa having only that rank.`}
    if ("parentTaxa" == hedNam) {html = `Click column header to expand/collapse parent taxa in all rows. Click parent taxon name for Species Explorer search of that taxon.`}
    if ("parent" == hedNam) {html = `Click symbol for Species Explorer with ALL children of named parent taxon. Click parent taxon name for Species Explorer with just that taxon and rank.`}
    if ("canonicalName" == hedNam) {html = `Click column header to sort by taxon name. Click taxon name to view its Species Profile.`}
    if ("vernacularNames" == hedNam) {html = 'Click column header to sort by common name. Click common name for Species Explorer search of that name.'}
    if ("occurrences" == hedNam) {html = 'Click column header to sort by occurrence count. Occurrence counts are for taxon and sub-taxa. ACCEPTED name counts include their SYNONYMS. SYNONYM counts do not include their ACCEPTED names. Click count for Occurrence Explorer.'}
    if (html) {addInfoIcon(colObj, html, ["header-info-icon"]);}
    //add to sortable/non-sortable column arrays here?
    if (sortableColumns.includes(hedNam)) {colObj.classList.add("sortableHeader")}
    else {excludeColumns.push(hedNam)}
  });
}
if (eleTtl) { //if there's a page title, add an info icon *to its parent element*.
  addInfoIcon(eleTtl.parentElement, 'The Species Explorer does a full text search of the Atlas Species Checklist on GBIF. Text is searched against Scientific Name, Common Name, and Species Description.')
}

// Create table row for each taxonKey, then fill row of cells
async function addTaxaByKeys(fCfg, tArr) {
  //tArr.forEach(async (key, rowIdx) => {
  for (const key of tArr) {
    let objRow = eleTbl.insertRow(-1);//add row to end
    //let objSpc = await getTaxon(key); //get taxon object - THIS IS REDUNDANT
    //let rowProm = fillRow(fCfg, objSpc, objRow, rowIdx);
    let rowProm = fillRow(fCfg, {'key':key}, objRow);
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
  let key = objSpc.nubKey ? objSpc.nubKey : objSpc.key;
  //console.log('gbif_species_results=>fillRow=>listTaxon |', objSpc.key, '|', objSpc.canonicalName, '|');
  let taxn = {};
  try {taxn = await getGbifTaxonFromKey(objSpc.key);} //get taxonObj for species-list key to obtain its view of taxonomy
  catch(err) {return;} //2024-11-1 GBIF returning dupliate keys for some VAL species checklists. Abort on those.
  let res = {}; let vern = [];
  if (objSpc.nubKey) {res = objSpc; vern = Promise.resolve(objSpc.vernacularNames);}
  else {res = taxn; vern = getGbifVernacularsFromKey(objSpc.key); vern.catch(err => {console.log('getGbifVernacularsFromKey ERROR', err)});}
  let name = res.canonicalName ? res.canonicalName : res.scientificName;
  if (typeof(res.rank) == 'undefined') {res.rank = parseNameToRank(name);}
  let inat = getInatSpecies(name, res.rank, res.parent, getParentRank(res.rank)); inat.catch(err=> {console.log('getInatSpecies ERROR', err)});
  let wiki = getWikiPage(name); wiki.catch(err => {console.log('getWikiPage ERROR', err)});
  //To-do: restore the use of getStoredOccCnts for lower overhead
  let occs = fetchOccSimpleCountByKey(res.key,fCfg); occs.catch(err => {console.log('fetchOccSimpleCountByKey ERROR:', err)});
  gOccCnts.push(occs); //Append a new promise with each row. A dubious construct, except that it works.
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
        if ('SUBSPECIES' != res.rank && 'VARIETY' != res.rank && 'FORM' != res.rank) {
          let ncRank = getNextChildRank(res.rank);
          colObj.innerHTML += `<a title="Species Explorer: ALL sub-taxa of ${res.rank} ${name}" href="${resultsUrl}?siteName=${siteName}&q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}"><i class="fa-solid fa-code-branch child-branch"></i></a>`
          colObj.innerHTML += ` | <a title="Species Explorer: ${ncRank} sub-taxa of ${res.rank} ${name}" href="${resultsUrl}?siteName=${siteName}&q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}&rank=${ncRank}">${ncRank}</a>`
        }
        //colObj.innerHTML += `<a title="List child taxa of ${name}" href="${resultsUrl}?siteName=${siteName}&q=&higherTaxonKey=${res.key}&higherTaxonName=${name}&higherTaxonRank=${res.rank}"><i class="fa-solid fa-code-branch"></i></a>`
        break;
      case 'vernacularNames':
        let vnObj = {};
        if (taxn.vernacularName) { //taxon by key species/{key}
          taxn.vernacularName = capitalize(alphaNumeric(taxn.vernacularName));
          vnObj[taxn.vernacularName] = 'GBIF species/key vernacularName';
        } 
        if (res.vernacularName) { //taxon by key from species/search
          res.vernacularName = capitalize(alphaNumeric(res.vernacularName));
          vnObj[res.vernacularName] = 'GBIF species/search vernacularName';
        }
        if (res.vernacularNames && res.vernacularNames.length) {
          for (const ele of res.vernacularNames) {
            ele.vernacularName = capitalize(alphaNumeric(ele.vernacularName));
            vnObj[ele.vernacularName] = 'GBIF species/search/vernacularNames';
          }
        }
        vern.then(vern => {//getGbifVernacularsFromKey errors caught above, inline with function call
          for (const ele of vern) {
            let name = capitalize(alphaNumeric(ele.vernacularName));
            //console.log('vernacularNames:', ele.vernacularName, name);
            vnObj[name] = 'GBIF species/key/vernacularNames'
          }
        })
        inat.then(inat => {//getInatSpecies errors caught above, inline with function call
            if (inat.preferred_common_name) {
              let name = capitalize(alphaNumeric(inat.preferred_common_name));
              vnObj[name] = 'iNat species/key preferred_common_name';
            }
        })
        Promise.all([vern,inat]).finally(()=> {
          //console.log('vernacularListAll:', vnObj);
          let html = '';
          for (const key in vnObj) {
            html += `<a title="${vnObj[key]}" href="${resultsUrl}?siteName=${siteName}&q=${key}">${key}</a>, `;
          }
          html = html.slice(0,-2);
          colObj.innerHTML = html;
        })
        break;
      case 'scientificName': case 'vernacularName':
        colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: ${res[colNam]}" href="${resultsUrl}?siteName=${siteName}&q=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'parent':
        //colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: Explore parent taxon ${res[colNam]}" href="${resultsUrl}?siteName=${siteName}&q=${res[colNam]}">${res[colNam]}</a>` : null;
        colObj.innerHTML += res[colNam] ? `<a title="Species Explorer: ALL sub-taxa of parent taxon ${res[colNam]}" href="${resultsUrl}?siteName=${siteName}&q=${res[colNam]}"><i class="fa-solid fa-code-branch parent-branch"></i></a>` : null;
        colObj.innerHTML += res[colNam] ? ` | <a title="Species Explorer: Parent taxon ${getParentRank(res.rank)} ${res[colNam]}" href="${resultsUrl}?siteName=${siteName}&q=${res[colNam]}&rank=${getParentRank(res.rank)}">${res[colNam]}</a>` : null;
        break;
      case 'parentKey':
        colObj.innerHTML = res[colNam] ? `<a title="Species Explorer: ${res[colNam]}" href="${resultsUrl}?siteName=${siteName}&taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        break;
      case 'key': case 'nubKey':
        //colObj.innerHTML = res[colNam] ? `<a href="${resultsUrl}?siteName=${siteName}&taxonKey=${res[colNam]}">${res[colNam]}</a>` : null;
        //colObj.innerHTML = `<a href="${resultsUrl}?siteName=${siteName}&q=&higherTaxonKey=${res[colNam]}&higherTaxonName=${name}&higherTaxonRank=${res['rank']}">${res[colNam]}</a>`;
        //colObj.title = `List child taxa of '${name}' with key ${res[colNam]}`;
        colObj.innerHTML = res[colNam] ? `<a href="https://www.gbif.org/species/${res[colNam]}">${res[colNam]}</a>` : null;
        colObj.title = `View '${name}' with key ${res[colNam]} on GBIF`;
        break;
      case 'higherClassificationMap':
        let tree = res[colNam]; //object of upper taxa like {123456:Name,234567:Name,...}
        if (!tree) break;
        Object.keys(tree).forEach((key, idx) => {
          //colObj.innerHTML += `<a title="Species Explorer: ${tree[key]}" href="${resultsUrl}?siteName=${siteName}&q=${tree[key]}">${tree[key]}</a>`; //load self with just parent taxon
          colObj.innerHTML += `<a title="Species Explorer: ${tree[key]}(${key})" href="${resultsUrl}?siteName=${siteName}&taxonKey=${key}">${tree[key]}</a>`; //load self with just parent taxon
          if (idx < Object.keys(tree).length-1) {colObj.innerHTML += ', ';}
        })
        break;
      case 'parentTaxa':
        const listNode = document.createElement("ul"); //create an unordered list tag <ul>
        listNode.classList.add('parentTaxaList');
        listNode.addEventListener("click", e => { //listen to <ul> click events - this gets clicks from all <li> child elements
          //console.log('onclick event', e);
          let elem = e.target;
          if (elem.classList.contains('parentTaxaTop')) { //only collapsed if top <li> element clicked. Handling click on lowers works, but it can' be done using toggle.
            while (elem = elem.nextSibling) {
              elem.classList.toggle('collapsed');
            }
            e.target.classList.toggle('collapsed'); //toggle the +/- on the top <li> item
          }
        })
        colObj.appendChild(listNode); //add the <ul> tag to the table column object
        let collapsed = initCollapsed ? 'collapsed' : ''; //initial setting for collapsible list-items
        //Text ↳ in CSS Unicode: https://unicodeplus.com/U+21B3 Use the "U+" code, but replace the "U+" with "\". e.g. "U+25C0" becomes content: "\25C0";
        if (res.kingdom) {listNode.innerHTML += `<li class="parentTaxaTop ${collapsed}"><a title="Species Explorer: Kingdom ${res.kingdom}" href="${resultsUrl}?siteName=${siteName}&q=${res.kingdom}">${res.kingdom}</a></li>`;}
        if (res.phylum) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Phylum ${res.phylum}" href="${resultsUrl}?siteName=${siteName}&q=${res.phylum}">${res.phylum}</a></li>`;}
        if (res.class) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Class ${res.class}" href="${resultsUrl}?siteName=${siteName}&q=${res.class}">${res.class}</a></li>`;}
        if (res.order) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Order ${res.order}" href="${resultsUrl}?siteName=${siteName}&q=${res.order}">${res.order}</a></li>`;}
        if (res.family) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Family ${res.family}" href="${resultsUrl}?siteName=${siteName}&q=${res.family}">${res.family}</a></li>`;}
        if (res.genus) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Genus ${res.genus}" href="${resultsUrl}?siteName=${siteName}&q=${res.genus}">${res.genus}</a></li>`;}
        if (res.species) {listNode.innerHTML += `<li class="parentTaxa ${collapsed}"><a title="Species Explorer: Species ${res.species}" href="${resultsUrl}?siteName=${siteName}&q=${res.species}">${res.species}</a></li>`;}
        //NOTE: GBIF species/search often does not return a parent SPECIES for a SUBSPECIES taxon, which is why it doesn't show up.
        //NOTE: We figured out why - DwCA ingest does not include column 'species'. It uses specificEpithet instead. To fix this, provide parentNameUsageID in DwCA species checklists.
        break;
      case 'occurrences':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        occs.then(occs => {
          let title = `Occurrence Explorer: ${name}`;
          if (occs.names) {title += `, ${occs.names.join(", ")}`};
          colObj.innerHTML = `<a title="${title}" href="${exploreUrl}?siteName=${siteName}&${occs.search}&view=MAP">${nFmt.format(occs.total)}</a>`;
        })
        break;
      case 'iconImage':
        let imgInfo = false;
        wiki.then(wiki => {
          inat.then(inat => {
            if (inat.default_photo) {
              imgInfo = {
                iconSrc: inat.default_photo.medium_url,
                overSrc: inat.default_photo.medium_url,
                attrib: inat.default_photo.attribution,
                title: `${name} ${inat.default_photo.attribution}`
              }
            } else if (wiki.thumbnail) {
              imgInfo = {
                iconSrc: wiki.thumbnail.source,
                overSrc: wiki.originalimage.source,
                attrib: '',
                title: name
              }
            } 
            if (imgInfo) {
              let iconImg = document.createElement("img");
              iconImg.src = imgInfo.iconSrc;
              iconImg.alt = `${name} ${imgInfo.attrib}`;
              iconImg.className = "icon-image";
              iconImg.width = "30"; 
              iconImg.height = "30";
              iconImg.onclick = () => {showImageOverlay(imgInfo);}
              colObj.appendChild(iconImg);
            }
          }).catch(err=> {console.log('getInatSpecies ERROR', err)});
        })
        break;
      case 'images':
        colObj.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size:18px"></i>`;
        try {
          let imgs = getAggOccCounts(fCfg, `taxonKey=${key}`, 'mediaType');
          gOccCnts.push(imgs);//This keeps column-sort waiting until all the stats are loaded
          occs.then(occs => {
            imgs.then(imgs => {
              let iCnt = imgs.objOcc.StillImage ? imgs.objOcc.StillImage : 0;
              colObj.innerHTML = `<a href="${exploreUrl}?siteName=${siteName}&${occs.search}&view=GALLERY">${nFmt.format(iCnt)}</a>`;
            })
          })
        } catch (err) {colObj.innerHTML = ''; console.log(`ERROR in getImageCount:`, err);}
        break;
      case 'taxonomicStatus':
        if (res.accepted) {
          //colObj.innerHTML += `<a title="Species Explorer ACCEPTED name: ${res.accepted}" href="${resultsUrl}?siteName=${siteName}&q=${res.accepted}">${res[colNam]}</a>`;
          colObj.innerHTML += `<a title="Species Explorer ACCEPTED name: ${res.accepted}" href="${resultsUrl}?siteName=${siteName}&taxonKey=${res.acceptedKey}">${res[colNam]}</a>`;
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
    throw err
  }
}

export function SamePage(newParm=qParm, newLimit=limit, newOffset=offset, newQField=qField, newOther=other) {
  qParm = newParm;
  limit = newLimit;
  offset = newOffset;
  qField = newQField;
  other = newOther;
  window.location.assign(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}&qField=${qField}${other}`);
}
export function PrevPage() {
  if (offset > 0) {
    offset = offset - limit;
    //alert(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}${other}`);
  }
}
export function NextPage() {
  if (offset + limit > 9999) {
    alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
  } else if ((offset + limit) < count) {
    offset = offset + limit;
    //alert(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}${other}`);
  }
}
export function FirstPage() {
  //alert(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=0&limit=${limit}`);
  window.location.assign(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=0&limit=${limit}${other}`);
}
export function LastPage() {
  //alert(`LastPage() | count:${count}, limit:${limit}, offset:${offset}`);
  if (count > 10000) {
    alert(`GBIF species results are limited to 10,000 records. Please focus your search terms to reduce data scope.`);
  } else  if (count > limit) {
    offset = Math.floor(count/limit)*limit;
    if (offset >= count) {offset = offset - limit;}
    //alert(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}`);
    window.location.assign(`${resultsUrl}?siteName=${siteName}&q=${qParm}&offset=${offset}&limit=${limit}${other}`);
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
if (eleRnk) { //id="taxon-rank", the taxon-rank drop-down list
  if (eleRnk.multiple) {
    eleRnk.options[0].innerText = '...';
    eleRnk.addEventListener("focus", function(e) {
      eleRnk.size=eleRnk.options.length;
      setChosenMulti(eleRnk, objOther.rank); //this sets the list back to what was previously-selected on a click-in
      eleRnk.options[0].innerText = 'All';
    })
    eleRnk.addEventListener("blur", function(e) {
      eleRnk.size=1;
      eleRnk.options[0].innerText = '...';
      selectToUpdate(eleRnk, 'rank');
    })
  } else {
    eleRnk.addEventListener("change", function(e) {
        console.log('taxon-rank change', e.target.tagName, e.target.type, e.target.value, e.target);
        //multi-select change event fires on de-selecting a value, so we can always respond
        //single-select change event fires only on selecting a *new* value
        selectToUpdate(eleRnk, 'rank');
    })
  }
}
/* Respond to a generic select change/update event and reload the page */
function selectToUpdate(eleMnt, qParam) {
  objOther[qParam] = [];
  let newOther = "";
  for (const option of eleMnt.options) { //rebuild objOther from drop-down selections
    if (option.selected && 'ALL' != option.value) {objOther[qParam].push(option.value)}
  }
  Object.keys(objOther).forEach(key => { //rebuild entire 'other' list from objOther (not just ranks)
    if (Array.isArray(objOther[key])) {objOther[key].forEach(val => {newOther += `&${key}=${val}`;})}
    else {newOther += `&${key}=${objOther[key]}`}
  })
  console.log('selectToUpdate', newOther, objOther);
  if (eleMnt.multiple) {
    loadByQueryParams(false, qParm, 0, limit, qField, newOther);
  } else {
    SamePage(qParm, limit, 0, qField, newOther);
  }
}

if (eleSts) { // Status drop-down, id="taxon-status"
  if (eleSts.multiple) {
    eleSts.options[0].innerText = '...';
    eleSts.addEventListener("focus", function(e) {
      eleSts.size=eleSts.options.length;
      setChosenMulti(eleSts, objOther.status); //this sets the list back to what was previously-selected on a click-in
      eleSts.options[0].innerText = 'All';
    })
    eleSts.addEventListener("blur", function(e) {
      eleSts.size=1;
      eleSts.options[0].innerText = '...';
      selectToUpdate(eleSts, 'status');
    })
  } else {
    eleSts.addEventListener("change", function(e) { 
    console.log('taxon-rank change', e.target.tagName, e.target.type, e.target.value, e.target);
    //multi-select change event fires on de-selecting a value, so we can always respond
    //single-select change event fires only on selecting a *new* value
    selectToUpdate(eleSts, 'status');
    });
  }
  /* 
    2nd attempt at multi-select code. Also works with single-select?
  If multi-select, this code responds to each option change. This is too network-heavy and causes errors. 
  */
/*
  eleSts.addEventListener("change", function(e) {  
      //let newRank = eleSts.value;
      console.log('taxon-status change', e.target.tagName, e.target.type, e.target.value, e.target);
      //multi-select change event fires on de-selecting a value, so we can always respond
      //single-select change event fires only on selecting a *new* value
      objOther.status = [];
      let newOther = "";
      for (const option of eleSts.options) { //rebuild objOther from drop-down selections
        if (option.selected && 'ALL' != option.value) {objOther.status.push(option.value)}
      }
      Object.keys(objOther).forEach(key => { //rebuild entire 'other' list from objOther (not just ranks)
        if (Array.isArray(objOther[key])) {objOther[key].forEach(val => {newOther += `&${key}=${val}`;})}
        else {newOther += `&${key}=${objOther[key]}`}
      })
      console.log('taxonRank', newOther, objOther);
      if (eleSts.multiple) {
        loadByQueryParams(false, qParm, 0, limit, qField, newOther);
      } else {
        SamePage(qParm, limit, 0, qField, newOther);
      }
  })
  */
  /* Original single-select code
  eleSts.addEventListener("change", function(e) {
    let newStatus = eleSts.value;
    console.log('taxon-status change to', newStatus);
    var newOther = "";
    if ("ALL" != newStatus) { //now we have to search the extant 'other' args for 'status' and replace it...
      objOther.status = [newStatus]; //just assign it in the object version of 'other' - this adds or replaces 'status'
    } else {
      delete objOther.status;
    }
    Object.keys(objOther).forEach(key => {
      objOther[key].forEach(val => {
        newOther += `&${key}=${val}`;
      })
    }) //rebuild 'other' list from 'other' object
    SamePage(qParm, limit, 0, qField, newOther);
  });
*/
}
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
  if (!fatalError) {
    if (downloadOccurrenceCounts) {
      for (var i=0; i<res.length; i++) {
        let oSpc = res[i];
        let key = oSpc.nubKey ? oSpc.nubKey : oSpc.key;
        /*
        gOccCnts.then(occCnts => { //
          oSpc[`${fCfg.dataConfig.atlasAbbrev}-Occurrences`] = occCnts[key] ? occCnts[key] : 0;
        }).catch(err => {
          console.log(`Unable to retrieve occurrence counts.`);
        })
        */
        //let occs = await gbifCountsByDateByTaxonKey(key, fCfg);//This call must be synchronous. And so we await.
        let occs = await fetchOccSimpleCountByKey(res.key, fCfg);
        oSpc[`${fCfg.dataConfig.atlasAbbrev}-Occurrences`] = occs.total;
     }
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
    var name = `${fCfg.dataConfig.atlasAbbrev}_taxa`; //download file name
    if (qParm) {name += `_${qParm}`;} //add search term to download file name
    //Object.keys(objOther).forEach(key => {name += `_${objOther[key]}`;}) //add query params to download file name
    Object.keys(objOther).forEach(key => {
      objOther[key].forEach(val => {
        name += `_${val}`;
      })
    }) //rebuild 'other' list from 'other' object

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

async function startUp(fCfg) {
  homeUrl = fCfg.dataConfig.homeUrl;
  exploreUrl = fCfg.dataConfig.exploreUrl;
  resultsUrl = fCfg.dataConfig.resultsUrl;
  profileUrl = fCfg.dataConfig.profileUrl;
  columns = fCfg.dataConfig.columns;
  columNames = fCfg.dataConfig.columNames;
    
  if (eleTbl) { //results are displayed in a table with id="species-table". we need that to begin.
    if (tKeys.length) {
      loadByTaxonKeys(fCfg, tKeys);
    } else {
      if (!qParm) {qParm = "";} //important: include q="" to show ALL species results
      if ("" === qParm && !other) { //default condition
        let rootRank = fCfg.dataConfig.rootRank;
        other=`&rank=${rootRank}`; objOther={'rank':[rootRank]}; eleRnk.value=rootRank;
      }
      loadByQueryParams(fCfg, qParm, offset, limit, qField, other);
    }
  } else {
    console.log('gbif_species_results.js requires a table having id="species-table" to operate.')
  }

  if (eleTtl) {
    eleTtl.innerText = `${fCfg.dataConfig.atlasPlace} Species Explorer`;
  }

  if (eleSit) {
    siteNames.forEach(site => {
      eleSit.innerHTML += `<option value=${site} ${siteName==site ? "selected=" : ""} id="option-${site}">${site}</option>`;
    })
    eleSit.onchange = (ev) => {
      let val = eleSit.options[eleSit.selectedIndex].value;
      let txt = eleSit.options[eleSit.selectedIndex].text;
      console.log('value', val, 'text', txt, 'index', eleSit.selectedIndex);
      setSite(val);
    }
  }
  function setSite(site) {
    console.log('setSite', site);
    setStoredData('siteName', '', '', site);
    window.location.href = `${resultsUrl}`;
  }
  
  if (eleHom) {
    eleHom.href = homeUrl;
  }

  if (eleHlp) {
    if (fCfg.dataConfig.helpDeskUrl) {
      eleHlp.style.display = 'inline';
      eleHlp.href = fCfg.dataConfig.helpDeskUrl;
    } else {
      eleHlp.style.display = 'none';
    }
  }
} //end Startup

async function loadByQueryParams(fCfg=false, qParm, offset, limit, qField, other) {
  try {
    if (!fCfg) {fCfg = fileConfig;}
    eleTbl.innerHTML = ""; //clear the table, but not thead
    addTableWait();
    //gOccCnts = getStoredOccCnts(fCfg);
    let spcs = await speciesSearch(fCfg.dataConfig, qParm, offset, limit, qField, other);
    count = spcs.count;
    if (spcs.count) {
      await addTaxaFromArr(fCfg, spcs.results);
    } else {putErrorOnScreen('No data found.')}
    await setHead();
    let finish = (offset+limit)>count ? count : offset+limit;
    if (eleLbl) {
      eleLbl.innerHTML = `Showing ${nFmt.format(count?offset+1:0)}-${nFmt.format(finish)} of <u><b>${nFmt.format(count)}</b></u> Results`;
      if (qParm) {
        eleLbl.innerHTML += ` for Search Term <u><b>'${qParm}'</b></u>`;
      }
      if (Object.keys(objOther).length) {eleLbl.innerHTML += ' where ';}
      Object.keys(objOther).forEach((key, idx) => {
        objOther[key].forEach((val, idy) => {
            if (0 == idy) {eleLbl.innerHTML += ` ${key} is <u><b>'${val}'</b></u>`;}
            else {eleLbl.innerHTML += ` <u><b>'${val}'</b></u>`;}
            if (idy < objOther[key].length-1) {eleLbl.innerHTML += ' or ';}
          })
          if (idx < Object.keys(objOther).length-1) {eleLbl.innerHTML += ' and ';}
        });
      eleLbl.innerHTML += ` - compared to ${qField}`;
      if ('SCIENTIFIC'==qField || 'VERNACULAR'==qField) {eleLbl.innerHTML += ' name';}
      if (eleLb2) {eleLb2.innerHTML = eleLbl.innerHTML;}
    }
    Promise.all(gOccCnts).then(() => {remTableWait()});
  } catch (err) {
    putErrorOnScreen(err);
  }
}
async function loadByTaxonKeys(fCfg, tKeys) {
  try {
    addTableWait();
    //gOccCnts = getStoredOccCnts(fCfg);
    await addTaxaByKeys(fCfg, tKeys);
    await setHead();
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
}

let tableSort = false;
function columnSort() {
  Promise.all(gOccCnts).then(() => {
    let excludeColumnIds = []; //[columnIds['childTaxa'], columnIds['parentTaxa'], columnIds['iconImage']];
    for (const columnName of excludeColumns) {excludeColumnIds.push(columnIds[columnName]);}
    if (tableSort) {
      tableSort.clear();
      tableSort.destroy();
      tableSort = tableSortHeavy('species-table', [columnIds['occurrences'],'desc'], excludeColumnIds);
    } else {
        tableSort = tableSortHeavy('species-table', [columnIds['occurrences'],'desc'], excludeColumnIds);
    }
  });
}