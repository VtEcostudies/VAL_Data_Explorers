import { siteConfig } from './gbifSiteConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_config.js"></script>
//const dataConfig = (async () => {return await import(`../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteConfig.siteName}`);})()
import { predicateToQueries } from '../VAL_Web_Utilities/js/gbifDataConfig.js'; //in html must declare this as module eg. <script type="module" src="js/gbif_data_widget.js"></script>
import { speciesSearch } from './gbif_species_search.js';

import(`../VAL_Web_Utilities/js/gbifDataConfig.js?siteName=${siteConfig.siteName}`)
  .then(fileConfig => {
    console.log('gbif_data_stats | siteName:', siteConfig.siteName, 'dataConfig:', fileConfig.dataConfig);
    startUp(fileConfig.dataConfig);
  })

//const speciesDatasetKey = dataConfig.speciesDatasetKey; //'0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key
//const qrys = predicateToQueries(); //['?state_province=Vermont&hasCoordinate=false', '?gadmGid=USA.46_1'];
//console.log('gbif_data_stats.js | rootPredicate converted to http query parameters:');
//console.dir(qrys);

var begEvent = new Event('xhttpBeg');
var endEvent = new Event('xhttpEnd');
var xhrTimeout = 10000;
var occs = 0;
var sets = {};//[]; //use object. array.find is waaaay slower than obj[value]
var spcs = {};//[]; //ditto
var pubs = {};//[]; //ditto
var nFmt = new Intl.NumberFormat(); //use this to format numbers by locale... automagically?

/*
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?stateProvince=Vermont&limit=0
*/
function occStats(reqQuery) {
    var xmlhttp = new XMLHttpRequest();
    var reqHost = "https://api.gbif.org/v1";
    var reqRoute = "/occurrence/search";
    //var reqQuery = "?state_province=Vermont";
    reqQuery = `?${reqQuery}`;
    var reqLimit = "&limit=0";
    var reqAll = reqHost+reqRoute+reqQuery+reqLimit;
    var elem = document.getElementById("count-occurrences");

    document.dispatchEvent(begEvent);

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                var res = JSON.parse(xmlhttp.responseText);
                console.log(`OCCURRENCES => ${reqAll} occurrences: ${res.count}`);
                occs += res.count;
                if (elem) {
                  elem.innerHTML = nFmt.format(occs);// numeral(occs).format('0,0');
                } else {
                  console.log('HTML element id="count-occurrences" NOT found.')
                }
            } else {
                console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
                if (elem) {
                  elem.style="font-size:8pt";
                  elem.innerHTML = `(http ${xmlhttp.status} from ${reqAll})`;
                } else {
                  console.log('HTML element id="count-occurrences" NOT found.')
                }
            }
            document.dispatchEvent(endEvent);
        }
    };

    console.log('AJAX GET request:', reqHost+reqRoute+reqQuery+reqLimit);

    xmlhttp.open("GET", reqHost+reqRoute+reqQuery+reqLimit, true);
    //xmlhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    //xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    //xmlhttp.setRequestHeader("Accept", "*/*");
    //xmlhttp.setRequestHeader("Cache-Control", "no-cache");
    xmlhttp.timeout = xhrTimeout; // Set timeout to 10 seconds
    xmlhttp.ontimeout = function () { console.log(`AJAX GET request ${reqHost+reqRoute} timed out. (${xhrTimeout/1000} seconds).`); }
    xmlhttp.async = true;
    xmlhttp.send();
}

/*
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?stateProvince=Vermont&limit=0&facet=datasetKey&facetMincount=1&datasetKey.facetLimit=1000
*/
function datasetStats(reqQuery) {
  var xmlhttp = new XMLHttpRequest();
  var reqHost = "https://api.gbif.org/v1";
  var reqRoute = "/occurrence/search";
  //var reqQuery = "?state_province=Vermont";
  reqQuery = `?${reqQuery}`;
  var reqFacet = "&facet=datasetKey&facetMincount=1&datasetKey.facetLimit=10000";
  var reqLimit = "&limit=0";
  var reqAll = reqHost+reqRoute+reqQuery+reqFacet+reqLimit;
  var elem = document.getElementById("count-datasets");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const set = res.facets[0].counts; //array of objects haing datasetID and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              set.forEach((topEle) => {
                if (!sets[topEle.name]) {sets[topEle.name] = topEle.count}
              });
              var count = Object.keys(sets).length;
              console.log(`DATASETS => This:`, set.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = nFmt.format(count); //numeral(count).format('0,0');
              } else {
                console.log('HTML element id="count-datasets" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqAll})`;
              } else {
                console.log('HTML element id="count-datasets" NOT found.')
              }
          }
          document.dispatchEvent(endEvent);
      }
  };

  console.log('AJAX GET request:', reqHost+reqRoute+reqQuery+reqFacet+reqLimit);

  xmlhttp.open("GET", reqHost+reqRoute+reqQuery+reqFacet+reqLimit, true);
  xmlhttp.timeout = xhrTimeout; // Set timeout to 10 seconds
  xmlhttp.ontimeout = function () { console.log(`AJAX GET request ${reqHost+reqRoute} timed out. (${xhrTimeout/1000} seconds).`); }
  xmlhttp.async = true;
  xmlhttp.send();
}

/*
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?state_province=Vermont&limit=0&facet=scientificName&facetMincount=1&scientificName.facetOffset=0&scientificName.facetLimit=30000
*/
function speciesOccStats(reqQuery) {
  var speciesOffset = 0;;
  var speciesLimit = 1199999; //1.2M is hard limit on facets. This won't work for large scope root predicates having more than 1.19M unique names.
  var xmlhttp = new XMLHttpRequest();
  var reqHost = "https://api.gbif.org/v1";
  var reqRoute = "/occurrence/search";
  //var reqQuery = "?state_province=Vermont"
  reqQuery = `?${reqQuery}`;
  var reqFacet = `&facet=scientificName&facetMincount=1&scientificName.facetOffset=${speciesOffset}&scientificName.facetLimit=${speciesLimit}`;
  var reqLimit = "&limit=0";
  var reqAll = reqHost+reqRoute+reqQuery+reqFacet+reqLimit;
  var elem = document.getElementById("count-species");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const spc = res.facets[0].counts; //array of objects having sciName and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              spc.forEach((topEle) => {
                if (!spcs[topEle.name]) {spcs[topEle.name] = topEle.count}
              })
              var count = Object.keys(spcs).length;
              console.log(`SPECIES => This:`, spc.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = nFmt.format(speciesOffset+count); //numeral(speciesOffset+count).format('0,0');
              } else {
                console.log('HTML element id="count-species" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit})`;
              } else {
                console.log('HTML element id="count-species" NOT found.')
              }
          }
          document.dispatchEvent(endEvent);
      }
  };

  console.log('AJAX GET request:', reqHost+reqRoute+reqQuery+reqFacet+reqLimit);

  xmlhttp.open("GET", reqHost+reqRoute+reqQuery+reqFacet+reqLimit, true);
  xmlhttp.timeout = xhrTimeout; // Set timeout to 10 seconds
  xmlhttp.ontimeout = function () { console.log(`AJAX GET request ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit} timed out. (${xhrTimeout/1000} seconds).`); }
  xmlhttp.async = true;
  xmlhttp.send();
}

/*
  Get a count of accepted species and set speciesCount html element value
  Using speciesSearch, count rank=SPECIES & status=ACCEPTED
*/
async function speciesStats(dataConfig, reqQuery="") {
  reqQuery += `&rank=SPECIES&status=ACCEPTED`;
  let spcs = await speciesSearch(dataConfig, reqQuery, 0, 0);
  let lmId = 'count-species';
  let elem = document.getElementById(lmId);
  console.log(`gbif_data_stats.js::speciesStats(${reqQuery})|`, spcs);
  if (elem) {
    elem.innerHTML = nFmt.format(spcs.count);
  } else {
    console.log(`HTML element id="${lmId}" NOT found.`)
  }
}

/*
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?state_province=Vermont&limit=0&facet=publishingOrg&facetMincount=1&publishingOrg.facetLimit=1000

  UPDATE: Publisher stats are a separate API - literature. If we have a publishingOrgKey, don't use occurrence API
  https://api.gbif.org/v1/literature/search?contentType=literature&publishingOrganizationKey=${dataConfig.publishingOrgKey}
*/
function publisherOccStats(reqQuery) {
  var xmlhttp = new XMLHttpRequest();
  var reqHost = "https://api.gbif.org/v1";
  var reqRoute = "/occurrence/search";
  //var reqQuery = "?state_province=Vermont"
  reqQuery = `?${reqQuery}`;
  var reqFacet = "&facet=publishingOrg&facetMincount=1&publishingOrg.facetLimit=1000";
  var reqLimit = "&limit=0";
  var reqAll = reqHost+reqRoute+reqQuery+reqFacet+reqLimit;
  var elem = document.getElementById("count-publishers");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const spc = res.facets[0].counts; //array of objects having count-publishers and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              spc.forEach((topEle) => {
                if (!pubs[topEle.name]) {pubs[topEle.name] = topEle.count}
              })
              var count = Object.keys(pubs).length;
              console.log(`PUBLISHERS => This:`, spc.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = nFmt.format(count); //numeral(count).format('0,0');
              } else {
                console.log('HTML element id="count-publishers" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit})`;
              } else {
                console.log('HTML element id="count-publishers" NOT found.')
              }
          }
          document.dispatchEvent(endEvent);
      }
  };

  console.log('AJAX GET request:', reqHost+reqRoute+reqQuery+reqFacet+reqLimit);

  xmlhttp.open("GET", reqHost+reqRoute+reqQuery+reqFacet+reqLimit, true);
  xmlhttp.timeout = xhrTimeout; // Set timeout to 10 seconds
  xmlhttp.ontimeout = function () { console.log(`AJAX GET request ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit} timed out. (${xhrTimeout/1000} seconds).`); }
  xmlhttp.async = true;
  xmlhttp.send();
}

export async function publisherStats(publOrgKey=false) {

  var elem = document.getElementById("count-citations"); //To-Do: which is it?
  //elem = document.getElementById("count-publishers"); //To-Do: which is it?

  if (!publOrgKey) {publOrgKey = dataConfig.publishingOrgKey;}

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

function otherStats() {
  var elemSpAccounts = document.getElementById("count-species_accounts");
  var spAcCount = 0;
  if(elemSpAccounts) {
    //elemSpAccounts.innerHTML = nFmt.format(spAcCount); //numeral(spAcCount).format('0,0');
    elemSpAccounts.innerHTML = "(coming soon)";
    elemSpAccounts.style="font-size:8pt";
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

      /* Respond to mouse click on Occurrence Stats button */
      if (document.getElementById("stats-records")) {
          document.getElementById("stats-records").addEventListener("mouseup", function(e) {
            window.location.assign(`${dataConfig.explorerUrl}?view=MAP`);
          });
      }

      /* Respond to mouse click on Species Stats button */
      if (document.getElementById("stats-species")) {
          //document.getElementById("stats-species").href = `${dataConfig.resultsUrl}?rank=SPECIES&status=ACCEPTED`;
          document.getElementById("stats-species").addEventListener("mouseup", function(e) {
              window.location.assign(`${dataConfig.resultsUrl}`);
          });
      }

      /* Respond to mouse click on Datasets Stats button */
      if (document.getElementById("stats-datasets")) {
          document.getElementById("stats-datasets").addEventListener("mouseup", function(e) {
            window.location.assign(`${dataConfig.explorerUrl}?view=DATASETS`);
          });
      }

      /* Respond to mouse click on Citations Stats button */
      if (document.getElementById("stats-citations")) {
          document.getElementById("stats-citations").addEventListener("mouseup", function(e) {
            /*
            window.open(
              `https://www.gbif.org/resource/search?contentType=literature&publishingOrganizationKey=${dataConfig.publishingOrgKey}`
              , "_blank"
              );
            */
            });
      }

      /* Respond to mouse click on Publisher Stats button */
      if (document.getElementById("stats-publishers")) {
        document.getElementById("stats-publishers").addEventListener("mouseup", function(e) {
          window.location.assign(`${dataConfig.publishUrl}`);
        });
      }

      /* Respond to mouse click on Species Accounts Stats button */
      if (document.getElementById("stats-sp-accounts")) {
          document.getElementById("stats-sp-accounts").addEventListener("mouseup", function(e) {
              console.log('stats-sp-accounts got mouseup', e);
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
  counts and links. We set the counts' values and the links' hrefs.
*/
function setContext(dataConfig) {
  let eleSection = document.getElementsByClassName('hero');
  let eleBody = document.getElementsByTagName('body')[0];
  if (eleBody) {
    console.log('background element', eleBody);
    //eleBody.style.backgroundImage=`url(${dataConfig.backgroundImageUrl.default})`;
    //eleBody.classList.remove('page-template-page-species-explorer-2022')
    changeStyle('.page-template-page-species-explorer-2022 .hero', 'background-image', dataConfig.backgroundImageUrl.default);
  }
  let homeTitle = document.getElementById("home-title")
  let countOccs = document.getElementById("count-occurrences");
  let countDset = document.getElementById("count-datasets");
  let countSpcs = document.getElementById("count-species");
  let countCite = document.getElementById("count-citations");
  let countPubl = document.getElementById("count-publishers");
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

function startUp(dataConfig) {
  let qrys = predicateToQueries(dataConfig.rootPredicate); //['?state_province=Vermont&hasCoordinate=false', '?gadmGid=USA.46_1'];
  console.log('gbif_data_stats.js | rootPredicate converted to http query parameters:');
  console.dir(qrys);
  setContext(dataConfig);
  qrys.forEach(qry => {
    console.log('gbif_data_stats.js NOW QUERYING:', qry);
    if (!dataConfig.speciesFilter) speciesOccStats(qry); //backup query of all unique scientificNames from occurrences
    occStats(qry);
    datasetStats(qry);
    if (!dataConfig.publishingOrKey) publisherOccStats(qry); //backup query of 
  })
  if (dataConfig.speciesFilter) {speciesStats(dataConfig);}
  //if (dataConfig.publishingOrgKey) {publisherStats(dataConfig.publishingOrgKey);} //this is done manually new in WordPress
  otherStats(); //attempt to do this within WP user access so it can be easily edited
  addListeners(dataConfig);
}