var begEvent = new Event('xhttpBeg');
var endEvent = new Event('xhttpEnd');
var xhrTimeout = 10000;
var occs = 0;
var sets = {};//[]; //use object. array.find is waaaay slower than obj[value]
var spcs = {};//[]; //ditto
var pubs = {};//[]; //ditto
var qrys = ['?state_province=Vermont&hasCoordinate=false', '?gadmGid=USA.46_1'];
var datasetKey = '0b1735ff-6a66-454b-8686-cae1cbc732a2'; //VCE VT Species Dataset Key

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

// Add listeners to handle clicks on stats items
function addListeners() {

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

qrys.forEach(qry => {
  console.log('**************Data Stats NOW QUERYING:', qry);
  speciesStats(qry);
  occStats(qry);
  datasetStats(qry);
  publisherStats(qry);
})
otherStats(); //attempt to do this within WP user access so it can be easily edited
addListeners();
