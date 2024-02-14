import { siteConfig, siteNames } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
import { speciesSearch } from './gbif_species_search.js';
import { getAggOccCounts } from '../../VAL_Web_Utilities/js/gbifOccFacetCounts.js';
import { getStoredData, setStoredData } from '../../VAL_Web_Utilities/js/storedData.js';
import { getGbifRecordedBy, getInatObserverStats, getEbirdUsers, getEbutterflyUsers } from '../../VAL_Web_Utilities/js/fetchObservers.js';

let siteName = siteConfig.siteName;
console.log('gbif_data_stats.js retrieved gbifSiteConfig.siteName', siteName);

const metaUrl = new URL(import.meta.url); //lower case '.url' is a property
const metaSite = metaUrl.searchParams.get('siteName'); //calling modules do this: import { dataConfig } from '../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=val'
//Get siteName meta param and set localStorage siteName here
if (metaSite) {
  siteName = metaSite; 
  console.log('gbif_data_stats.js called by module metaParam with siteName', metaSite);
  setStoredData('siteName', false, false, siteName);
}

const storSite = await getStoredData('siteName', '', '');
if (storSite) {siteName = storSite; console.log('gbif_data_stats.js retrieved localStorage siteName', storSite);}

const objUrlParams = new URLSearchParams(window.location.search);
const httpSite = objUrlParams.get('siteName');
//Get siteName query param and set localStorage siteName here
if (siteNames.includes(httpSite)) {
  siteName = httpSite;
  console.log('gbif_data_stats.js called with http param siteName', httpSite);
  setStoredData('siteName', false, false, siteName);
}

let homeUrl;

let eleCountOccs = document.getElementById("count-occurrences");
let eleCountDset = document.getElementById("count-datasets");
let eleCountSpcs = document.getElementById('count-species');
let eleCountPubs = document.getElementById("count-publishers");
let eleCountCite = document.getElementById("count-citations");
let eleCountObsv = document.getElementById('count-observers');

import(`../../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteName}`)
  .then(fileConfig => {
    console.log('gbif_data_stats | siteName:', siteName, 'dataConfig:', fileConfig.dataConfig);
    startUp(fileConfig);
  })

var nFmt = new Intl.NumberFormat(); //use this to format numbers by locale... automagically?

function occStats(fileConfig) {
  var elem = eleCountOccs;
  let occs = getAggOccCounts(fileConfig, false, []); //get just top-level all-taxon agg occ counts w/o taxon-breakout
  occs.then(occs => {
    elem.innerHTML = nFmt.format(occs.total);
  }).catch(err =>{
    elem.innerHTML = err.message;
  })
}
/*
This occurrence facet query isn't filtered by rank and status. It's a backup species stats query used when the siteConfig
does not contain a speciesFilter. See speciesStats function which is used when there dataConfig.speciesFilter is defined.
*/
function occSpeciesStats(fileConfig) {
  var elem = eleCountOccs;
  let spcs = getAggOccCounts(fileConfig, false, ['scientificName'], 'facetMincount=1&facetLimit=1199999');
  spcs.then(spcs => {
    elem.innerHTML = nFmt.format(Object.keys(spcs.objOcc).length);
  }).catch(err =>{
    elem.innerHTML = err.message;
  })
}
function occDatasetStats(fileConfig) {
  var elem = eleCountDset;
  let dsts = getAggOccCounts(fileConfig, false, ['datasetKey'], 'facetMincount=1&facetLimit=1199999');
  dsts.then(dsts => {
    elem.innerHTML = nFmt.format(Object.keys(dsts.objOcc).length);
  }).catch(err =>{
    elem.innerHTML = err.message;
  })
}
function occPublisherStats(fileConfig) {
  var elem = eleCountPubs;
  let pbls = getAggOccCounts(fileConfig, false, ['publishingOrg'], 'facetMincount=1&facetLimit=1199999');
  pbls.then(pbls => {
    elem.innerHTML = nFmt.format(Object.keys(pbls.objOcc).length);
  }).catch(err =>{
    elem.innerHTML = err.message;
  })
}
/*
  Get a count of accepted species and set speciesCount html element value
  Using speciesSearch, count rank=SPECIES & status=ACCEPTED
*/
async function speciesStats(dataConfig, reqQuery="") {
  let elem = eleCountSpcs;
  reqQuery += `&rank=SPECIES&status=ACCEPTED`;
  let spcs = await speciesSearch(dataConfig, reqQuery, 0, 0);
  console.log(`gbif_data_stats.js::speciesStats(${reqQuery})|`, spcs);
  if (elem) {
    elem.innerHTML = nFmt.format(spcs.count);
  } else {
    console.log(`speciesStats HTML element id="${elem}" NOT found.`)
  }
}

/*
  Load observer stats. This idea was partly implemented and abandoned in favor of
  just entering a WP-editable number on the WordPress site.

  On vtatlasoflife.org, just GBIF implemented.
*/
async function observerStats(dataConfig) {
  let elem = eleCountObsv;
  let elel = document.getElementById('label-observers');
  if (elem) {
    if (dataConfig.gadmGid) {
      let gbif = await getGbifRecordedBy(dataConfig.gadmGid);
      elem.innerHTML = `${nFmt.format(gbif.count_users)}`;
      //elel.innerHTML = `GBIF ${elel.innerHTML}`;
    } else {elem.innerHTML = 'N/A';}
    if (dataConfig.inatPlaceId) {
      //let inat = await getInatObserverStats();
      //elem.innerHTML += ` ${nFmt.format(inat.total)} (iNat)`;
    }
    //let eBrd = await getEbirdUsers();
    //let eBut = await getEbutterflyUsers();
    //elem.innerHTML += ` ${nFmt.format(eBrd.count)} (eBird)`;
    //elem.innerHTML += ` ${nFmt.format(eBut.count)} (eButterfly)`;
  } else {
    console.log(`observerStats HTML element id="${elem}" NOT found.`)
  }
}

export async function publisherStats(dataConfig) {

  let elem = eleCountCite;

  let publOrgKey = dataConfig.publishingOrgKey;
  
  let reqHost = dataConfig.gbifApi;
  let reqRoute = "/literature/search";
  let reqQuery = `?contentType=literature`;
  let reqFilter = `&publishingOrganizationKey=${publOrgKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`publisherStats(${publOrgKey})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    json.query = enc;
    console.log(`publisherStats(${publOrgKey}) RESULT:`, json);
    if (elem) {
      elem.innerHTML = nFmt.format(json.count);
    } else {
      console.log('HTML element id="count-publishers" NOT found.')
    }
    return json;
  } catch (err) {
    err.query = enc;
    console.log(`publisherStats(${publOrgKey}) ERROR:`, err);
    throw new Error(err)
  }
}

window.onload = function() {

    console.log('window.onload()');

    //page reloads (F5) don't get xhttpBeg event - set loading class onload...
    if (document.getElementById("modal_vce_loading")) {
      var d = document.getElementById("modal_vce_loading");
      if (d) d.className = "vce_modal vce_loading";
    }

    document.addEventListener("xhttpBeg", function() {
      if (document.getElementById("modal_vce_loading")) {
        var d = document.getElementById("modal_vce_loading");
        if (d) d.className = "vce_modal vce_loading";
        console.log(`got xhttpBeg: ${d.className}`);
      }
    });

    document.addEventListener("xhttpEnd", function() {
      if (document.getElementById("modal_vce_loading")) {
        var d = document.getElementById("modal_vce_loading");
        if (d) d.className = "vce_modal";
        console.log(`got xhttpEnd: ${d.className}`);
      }
    });
};

// Add listeners to handle clicks on stats items
function addListeners(dataConfig) {

  let eleSit = document.getElementById("siteSelect")

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
    window.location.href = `${homeUrl}`;
  }

  // Respond to mouse click on Occurrence Stats button
  if (document.getElementById("stats-records")) {
      document.getElementById("stats-records").addEventListener("mouseup", function(e) {
        if (0 == e.button) {
          window.location.assign(`${dataConfig.explorerUrl}?view=MAP`);
        }
      });
  }

  // Respond to mouse click on Species Stats button 
  if (document.getElementById("stats-species")) {
      document.getElementById("stats-species").addEventListener("mouseup", function(e) {
        if (0 == e.button) {
          window.location.assign(`${dataConfig.resultsUrl}`);
        }
      });
  }

  // Respond to mouse click on Datasets Stats button 
  if (document.getElementById("stats-datasets")) {
      document.getElementById("stats-datasets").addEventListener("mouseup", function(e) {
        if (0 == e.button) {
          window.location.assign(`${dataConfig.explorerUrl}?view=DATASETS`);
        }
      });
  }

  // Respond to mouse click on Citations Stats button
  if (document.getElementById("stats-citations")) {
      document.getElementById("stats-citations").addEventListener("mouseup", function(e) {
        if (0 == e.button) {
          window.location.assign(`${dataConfig.literatUrl}`);
          /*
          window.open(
            `https://www.gbif.org/resource/search?contentType=literature&publishingOrganizationKey=${dataConfig.publishingOrgKey}`
            , "_blank"
            );
          */
          }
        });
  }

  // Respond to mouse click on Publisher Stats button
  if (document.getElementById("stats-publishers")) {
    document.getElementById("stats-publishers").addEventListener("mouseup", function(e) {
      if (0 == e.button) {
        window.location.assign(`${dataConfig.publishUrl}`);
      }
    });
  }

  // Respond to mouse click on Species Accounts Stats button
  if (document.getElementById("stats-sp-accounts")) {
      document.getElementById("stats-sp-accounts").addEventListener("mouseup", function(e) {
        if (0 == e.button) {
          console.log('stats-sp-accounts got mouseup from primary button', e);
        }
      });
  }
}

function changeStyle(selectorText='page-template-page-species-explorer-2022', property='background-image', value='url(../images/vermont-panorama-large.jpg)')
{
    var theRules = new Array();
    if (document.styleSheets[0].cssRules) {
        theRules = document.styleSheets[0].cssRules;
        console.log('theRules', theRules);
      } 
    else if (document.styleSheets[0].rules) {
        theRules = document.styleSheets[0].rules;
        console.log('theRules', theRules);
    } else {
      console.log('noTheRules', document.styleSheets[0]);
    }
    for (const n in theRules)
    {
        if (theRules[n].selectorText == selectorText)   {
            //theRules[n].style.color = 'blue';
            theRules[n].style[property] = value;
        }
    }
}
/*
  There are 2 sets of html elements to manipulate on the home page, 
  counts and links. Here we set the links' hrefs.
*/
function setContext(dataConfig) {
  //Attempt to change background image for atlas
  let eleSection = document.getElementsByClassName('hero');
  let eleBody = document.getElementsByTagName('body')[0];
  if (eleBody) {
    console.log('background element', eleBody);
    //eleBody.style.backgroundImage=`url(${dataConfig.backgroundImageUrl.default})`;
    //eleBody.classList.remove('page-template-page-species-explorer-2022')
    //NOTE: changeStyle causes cross-origin stylesheet error in Wordpress
    //changeStyle('.page-template-page-species-explorer-2022 .hero', 'background-image', dataConfig.backgroundImageUrl.default);
  }
  let homeTitle = document.getElementById("home-title")
  let linkOccs = document.getElementById("stats-records");
  let linkDset = document.getElementById("stats-datasets");
  let linkSpcs = document.getElementById("stats-species");
  let linkCite = document.getElementById("stats-citations");
  let linkPubl = document.getElementById("stats-publishers");
  if (homeTitle) {
    homeTitle.innerText = dataConfig.atlasName;
}
  if (linkOccs) {
    linkOccs.href = dataConfig.exploreUrl + '?view=MAP';
  }
  if (linkDset) {
    linkDset.href = dataConfig.exploreUrl + '?view=DATASETS';
  }
  if (linkSpcs) {
    linkSpcs.href = dataConfig.resultsUrl; // + '?rank=SPECIES&status=ACCEPTED'; //production site shows KINGDOMs for blank search
  }
  if (linkCite) {
    //linkCite.href = dataConfig.literatUrl; //this is now defined manually in WordPress
  }
  if (linkPubl) {
    linkPubl.href = dataConfig.publishUrl;
  }
}

function startUp(fileConfig) {
  let dataConfig = fileConfig.dataConfig;
  homeUrl = fileConfig.dataConfig.homeUrl;

  setContext(dataConfig);
  occStats(fileConfig);
  occDatasetStats(fileConfig); //only way to get dataset stats is from occs

  if (dataConfig.speciesFilter) {
    speciesStats(dataConfig); //species-counts based on config file speciesFilter
  } else {
    occSpeciesStats(fileConfig); //backup query of all unique scientificNames from occurrences
  }

  //things to do on vtatlasoflife.org but not on val.vtecostudies.org
  if ('val.vtecostudies.org' != dataConfig.hostUrl) {
    if (dataConfig.publishingOrgKey) {
      publisherStats(dataConfig);
    } else {
      //occPublisherStats(fileConfig); //this would appear to be a count of publishers for the occurrence data-scope
      if (eleCountCite) {eleCountCite.innerHTML = '0';}
    }
    observerStats(dataConfig);
  }
  addListeners(dataConfig);
}