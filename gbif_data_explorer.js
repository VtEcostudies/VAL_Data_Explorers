var begEvent = new Event('xhttpBeg');
var endEvent = new Event('xhttpEnd');
var xhrTimeout = 10000;
var occs = 0;
var sets = {};//[]; //use object. array.find is waaaay slower than obj[value]
var spcs = {};//[]; //ditto
var pubs = {};//[]; //ditto
var qrys = ['?state_province=Vermont&hasCoordinate=false', '?gadmGid=USA.46_1'];
var gbifHost = 'https://hp-vtatlasoflife.gbif.org'; // "https://hp-vtatlasoflife.gbif-staging.org";
var datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2';
var filterVermont = true;

/*
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?stateProvince=Vermont&limit=0
*/
function occStats(reqQuery) {
    var xmlhttp = new XMLHttpRequest();
    var reqHost = "https://api.gbif.org/v1";
    var reqRoute = "/occurrence/search";
    //var reqQuery = "?state_province=Vermont";
    var reqLimit = "&limit=0";
    var reqAll=reqHost+reqRoute+reqQuery+reqLimit;
    var elem = document.getElementById("vt_occurrences");

    document.dispatchEvent(begEvent);

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                var res = JSON.parse(xmlhttp.responseText);
                console.log(`OCCURRENCES => ${reqAll} occurrences: ${res.count}`);
                occs += res.count;
                if (elem) {
                  elem.innerHTML = numeral(occs).format('0,0');
                } else {
                  console.log('HTML element id="vt_occurrences" NOT found.')
                }
            } else {
                console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
                if (elem) {
                  elem.style="font-size:8pt";
                  elem.innerHTML = `(http ${xmlhttp.status} from ${reqAll})`;
                } else {
                  console.log('HTML element id="vt_occurrences" NOT found.')
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
  //var reqQuery = "?state_province=Vermont"
  var reqFacet="&facet=datasetKey&facetMincount=1&datasetKey.facetLimit=10000";
  var reqLimit="&limit=0";
  var reqAll=reqHost+reqRoute+reqQuery+reqFacet+reqLimit
  var elem = document.getElementById("vt_datasets");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const set = res.facets[0].counts; //array of objects haing datasetID and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              set.forEach((ele) => {
                if (!sets[ele.name]) {sets[ele.name] = ele.count}
              });
              var count = Object.keys(sets).length;
              console.log(`DATASETS => This:`, set.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = numeral(count).format('0,0');
              } else {
                console.log('HTML element id="vt_datasets" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqAll})`;
              } else {
                console.log('HTML element id="vt_datasets" NOT found.')
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
function speciesStats(reqQuery) {
  var speciesOffset = 0;//20000;
  var speciesLimit = 30000;//10000;
  var xmlhttp = new XMLHttpRequest();
  var reqHost = "https://api.gbif.org/v1";
  var reqRoute = "/occurrence/search";
  //var reqQuery = "?state_province=Vermont"
  var reqFacet=`&facet=scientificName&facetMincount=1&scientificName.facetOffset=${speciesOffset}&scientificName.facetLimit=${speciesLimit}`;
  var reqLimit="&limit=0";
  var reqAll=reqHost+reqRoute+reqQuery+reqFacet+reqLimit;
  var elem = document.getElementById("vt_species");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const spc = res.facets[0].counts; //array of objects having sciName and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              spc.forEach((ele) => {
                if (!spcs[ele.name]) {spcs[ele.name] = ele.count}
              })
              var count = Object.keys(spcs).length;
              console.log(`SPECIES => This:`, spc.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = numeral(speciesOffset+count).format('0,0');
              } else {
                console.log('HTML element id="vt_species" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit})`;
              } else {
                console.log('HTML element id="vt_species" NOT found.')
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
  this is now called for each value in global array 'qrys', but here's example query:
  https://api.gbif.org/v1/occurrence/search?state_province=Vermont&limit=0&facet=publishingOrg&facetMincount=1&publishingOrg.facetLimit=1000
*/
function publisherStats(reqQuery) {
  var xmlhttp = new XMLHttpRequest();
  var reqHost = "https://api.gbif.org/v1";
  var reqRoute = "/occurrence/search";
  //var reqQuery = "?state_province=Vermont"
  var reqFacet="&facet=publishingOrg&facetMincount=1&publishingOrg.facetLimit=1000";
  var reqLimit="&limit=0";
  var reqAll=reqHost+reqRoute+reqQuery+reqFacet+reqLimit;
  var elem = document.getElementById("vt_publishers");

  document.dispatchEvent(begEvent);

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
          if (xmlhttp.status == 200) {
              const res = JSON.parse(xmlhttp.responseText);
              const spc = res.facets[0].counts; //array of objects having vt_publishers and occurrence count, like [{name:4fa7b334-ce0d-4e88-aaae-2e0c138d049e,count:6758210},{},...]
              spc.forEach((ele) => {
                if (!pubs[ele.name]) {pubs[ele.name] = ele.count}
              })
              var count = Object.keys(pubs).length;
              console.log(`PUBLISHERS => This:`, spc.length, 'Agg:', count, 'Query:', reqAll);
              if (elem) {
                elem.innerHTML = numeral(count).format('0,0');
              } else {
                console.log('HTML element id="vt_publishers" NOT found.')
              }
          } else {
              console.log(`An http ${xmlhttp.status} result was returned from ${reqHost}.`);
              if (elem) {
                elem.style="font-size:8pt";
                elem.innerHTML = `(http ${xmlhttp.status} from ${reqHost+reqRoute+reqQuery+reqFacet+reqLimit})`;
              } else {
                console.log('HTML element id="vt_publishers" NOT found.')
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

function otherStats() {
  var elemCitations = document.getElementById("vt_citations");
  var elemSpAccounts = document.getElementById("vt_species_accounts");
  var citeCount = 68;
  var spAcCount = 0;
  if (elemCitations) {elemCitations.innerHTML = numeral(citeCount).format('0,0');}
  if(elemSpAccounts) {
    //elemSpAccounts.innerHTML = numeral(spAcCount).format('0,0');
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

/*
  https://api.gbif.org/v1/species?name=Turdus%20migratorius
  Lists name usages across all or some checklists that share the exact same canonical name, i.e. without authorship.

  https://api.gbif.org/v1/species/search?q=Turdus%20migratorius
  Full text search of name usages covering the scientific and vernacular name, the species description,
  distribution and the entire classification across all name usages of all or some checklists. Results
  are ordered by relevance as this search usually returns a lot of results.

  https://api.gbif.org/v1/species/suggest?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=Turdus%20migratorius
  A quick and simple autocomplete service that returns up to 20 name usages by doing prefix matching against
  the scientific name. Results are ordered by relevance.
*/
async function speciesSearch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${text_value}`;
  let reqFilter = `&status=ACCEPTED&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`speciesSearch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesSearch(${text_value}) QUERY:`, enc);
    console.log(`speciesSearch(${text_value}) RESULT:`, json);
    return {query:enc, result:json};
  } catch (err) {
    console.log(`speciesSearch(${text_value}) QUERY:`, enc);
    console.log(`speciesSearch(${text_value}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

/*
https://api.gbif.org/v1/species/search?qField=VERNACULAR&status=ACCEPTED&q=spotted%20salamander&datasetKey=0b1735ff-6a66-454b-8686-cae1cbc732a2
*/
async function commonSearch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/search";
  let reqQuery = `?q=${text_value}`;
  let reqFilter = `&qField=VERNACULAR&status=ACCEPTED&datasetKey=${datasetKey}`;
  let url = reqHost+reqRoute+reqQuery+reqFilter;
  let enc = encodeURI(url);

  console.log(`commonSearch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`commonSearch(${text_value}) QUERY:`, enc);
    console.log(`commonSearch(${text_value}) RESULT:`, json);
    return {query:enc, result:json};
  } catch (err) {
    console.log(`commonSearch(${text_value}) QUERY:`, enc);
    console.log(`commonSearch(${text_value}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

/*
  https://api.gbif.org/v1/species/match?name=Turdus%20migratorius

  Fuzzy matches scientific names against the GBIF Backbone Taxonomy with the optional classification provided.
  If a classification is provided and strict is not set to true, the default matching will also try to match
  against these if no direct match is found for the name parameter alone.
*/
async function speciesMatch(text_value) {
  let reqHost = "https://api.gbif.org/v1";
  let reqRoute = "/species/match";
  let reqQuery = `?name=${text_value}`;
  let url = reqHost+reqRoute+reqQuery;
  let enc = encodeURI(url);

  console.log(`speciesMatch(${text_value})`, enc);

  try {
    let res = await fetch(enc);
    let json = await res.json();
    console.log(`speciesMatch(${text_value}) QUERY:`, enc);
    console.log(`speciesMatch(${text_value}) RESULT:`, json);
    return {query:enc, result:json};
  } catch (err) {
    console.log(`speciesMatch(${text_value}) QUERY:`, enc);
    console.log(`speciesMatch(${text_value}) ERROR:`, err);
    err.query = enc;
    return new Error(err)
  }
}

/*
  Navigate to Occurrence Search page with the search value from html element occ_search
*/
async function textOccSearch(search_value=null) {
  if (!search_value) {search_value = document.getElementById("occ_search").value;}
  let frame = document.getElementById("gbif_frame");
  let react = document.getElementById("gbif_react");
  console.log(`textOccSearch(${search_value})`);

  //let thisUrl = document.URL.split('?')[0]; //the base URL for this page without route params, which we update here

  let mRes = await speciesMatch(search_value);

  if (mRes.usageKey) { //send taxonKey for scientificName
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?taxonKey=${mRes.usageKey}&view=MAP`;}
    else {
      await window.location.assign(`https://val.vtecostudies.org/gbif-explorer/?taxonKey=${mRes.usageKey}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  } else { //send raw text for search
    if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?q=${search_value}&view=MAP`;}
    else {
      await window.location.assign(`https://val.vtecostudies.org/gbif-explorer/?q=${search_value}&view=MAP`);
      if (react) react.scrollIntoView();
    }
  }
}

async function testSearch(search_value=null) {
  if (!search_value) {search_value = document.getElementById("test_search").value;}

  console.log(`testSearch(${search_value})`);

  let mRes = await speciesMatch(search_value);
  let sRes = await speciesSearch(search_value);
  let cRes = await commonSearch(search_value);

  window.location.assign(mRes.query);
  window.open(sRes.query);
  window.open(cRes.query);
}

/*
  Add listeners to activate search results on Enter key.

  TODO: Make this work in a more generalized manner, ie. for Enter, Tab, and on button press.
*/
function addListeners() {

      if (document.getElementById("occ_search")) {
          document.getElementById("occ_search").addEventListener("keypress", function(e) {
              //console.log('occ_search got keypress', e);
              if(e.which == 13){
                  textOccSearch();
              }
          });
      }

      if (document.getElementById("test_search")) {
          document.getElementById("test_search").addEventListener("keypress", function(e) {
              console.log('test_search got keypress', e);
              if(e.which == 13){
                  testSearch();
              }
          });
      }

      if (document.getElementById("occ_search_button")) {
          document.getElementById("occ_search_button").addEventListener("mouseup", function(e) {
              //console.log('occ_search_button got mouseup', e);
              textOccSearch();
          });
      }

      /* Respond to mouse click on Occurrence Stats button */
      if (document.getElementById("stats-records")) {
          document.getElementById("stats-records").addEventListener("mouseup", function(e) {
              //console.log('stats-records got mouseup', e);
              var frame = document.getElementById("gbif_frame")
              if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?view=MAP`;}
              else {window.location.assign(`https://val.vtecostudies.org/gbif-explorer/?view=MAP`)}
              //else {window.open(`${gbifHost}/occurrence/search/?view=MAP`, "_blank")}
          });
      }

      /*
        Respond to mouse click on Species Stats button
        For now, since GBIF do not have this query, just show occurrence GALLERY
      */
      if (document.getElementById("stats-species")) {
          document.getElementById("stats-species").addEventListener("mouseup", function(e) {
              var frame = document.getElementById("gbif_frame")
              if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search`;}
              else {window.location.assign(`https://val.vtecostudies.org/gbif-explorer/?view=GALLERY`)}
              //else {window.open(`${gbifHost}/occurrence/search`, "_blank")}
          });
      }

      /* Respond to mouse click on Datasets Stats button */
      if (document.getElementById("stats-datasets")) {
          document.getElementById("stats-datasets").addEventListener("mouseup", function(e) {
              var frame = document.getElementById("gbif_frame")
              if (frame) {frame.scrollIntoView(); frame.src = `${gbifHost}/occurrence/search/?view=DATASETS`;}
              else {window.location.assign(`https://val.vtecostudies.org/gbif-explorer/?view=DATASETS`)}
              //else {window.open(`${gbifHost}/occurrence/search/?view=DATASETS`,"_blank")}
          });
      }

      if (document.getElementById("stats-publishers")) {
          document.getElementById("stats-publishers").addEventListener("mouseup", function(e) {
              window.open(
                "https://www.gbif.org/publisher/search?q=vermont"
                //"https://api.gbif.org/v1/occurrence/search?state_province=Vermont&limit=0&facet=publishingOrg&facetMincount=1&publishingOrg.facetLimit=1000"
                , "_blank"
              );
          });
      }

      if (document.getElementById("stats-citations")) {
          document.getElementById("stats-citations").addEventListener("mouseup", function(e) {
              window.open(
              "https://www.gbif.org/resource/search?contentType=literature&publishingOrganizationKey=b6d09100-919d-4026-b35b-22be3dae7156"
              , "_blank"
              );
          });
      }

      if (document.getElementById("stats-sp-accounts")) {
          document.getElementById("stats-sp-accounts").addEventListener("mouseup", function(e) {
              console.log('stats-sp-accounts got mouseup', e);
          });
      }
}

addListeners();
qrys.forEach(qry => {
  //console.log('**************NOW QUERYING', qry);
  speciesStats(qry);
  occStats(qry);
  datasetStats(qry);
  publisherStats(qry);
})
otherStats(); //attempt to do this within WP user access so it can be easily edited

//let mRes = await speciesMatch('Turdus migratorius') //test code
//let sRes = await speciesSearch('Turdus migratorius') //test code
//textOccSearch('Ambystoma maculatum'); //test code
