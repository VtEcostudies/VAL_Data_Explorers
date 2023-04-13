<?php
/*
	Template Name: Species Explorer
*/
?>

<?php get_header(); the_post(); ?>

<script language="Javascript">
	var info_on = false;
	function showInfo(text=false) {
		document.getElementById("information-overlay").style.display = 'flex';
		if (text) {document.getElementById("information-content").innerText = text;}
		info_on = true;
	}
	function hideInfo() {
		document.getElementById("information-overlay").style.display = 'none';
		info_on = false;
	}
	function toggleInfo(text=false) {
		var eleTxt = document.getElementById("information-content");
		if (eleTxt) {
			if (!info_on || `${text}` != `${eleTxt.innerText}`) {showInfo(text);} else {hideInfo();}
		} else {console.log(`No element with id 'information-content'`); }
	}
</script>

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-iYQeCzEYFbKjA/T2uDLTpkwGzCiq6soy8tYaI1GyVh/UjpbCx/TYkiZhlZB6+fzT" crossorigin="anonymous">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" rel="stylesheet">
<link href="/wp-content/themes/val/VAL_Data_Explorers/css/gbif-data-styles.css" rel="stylesheet">
<link href="/wp-content/themes/val/VAL_Web_Utilities/css/tableSortSimple.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.1/css/dataTables.bootstrap5.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.datatables.net/responsive/2.4.0/css/responsive.bootstrap.min.css" crossorigin="anonymous">

<script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js" integrity="sha256-lSjKY0/srUM9BE3dPm+c4fBo1dky2v27Gdjm2uoZaL0=" crossorigin="anonymous"></script>
<script src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdn.datatables.net/1.13.1/js/dataTables.bootstrap5.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdn.datatables.net/responsive/2.4.0/js/dataTables.responsive.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdn.datatables.net/responsive/2.4.0/js/responsive.bootstrap.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

  <section class="hero">

  	<div class="content">

      <div class="hero-header-info-icon">
  		  <h2 style="display: inline-block;">Species Explorer</h2>
        <a href="#" onclick="toggleInfo('The Species Explorer does a full text search of the Checklist of Vermont Species on GBIF. Text is searched against Scientific Name, Common Name, and Species Description.');"
          style="display: inline-block; vertical-align: top;">
          <i class="fa fa-info-circle"></i>
        </a>`;
      </div>

  		<form id="searchform" onsubmit="return false;" >

				<input id="results_search"
          autocomplete="off"
          list="gbif_autocomplete_list"
          class="search-field"
          type="text"
          placeholder="Search the Atlas..."
          onClick="this.setSelectionRange(0, this.value.length)"
          />
  			<datalist id="gbif_autocomplete_list"></datalist>

  			<div class="searchsubmit-wrap">
  				<button id="results_search_button">
  					<i class="far fa-search"></i>
  				</button>
  			</div>

  		</form>

  	</div>

  	<span class="overlay"></span>

  </section>

  <section>

  	<div class="container species-display">

      <div class="row">

    		<div class="col-lg-3 col-md-6 col-xs-12" id="search-term">
    			<label id="search-value"></label>
    		</div>

        <div class="col-lg-4 col-md-6 col-xs-6">
          <ul class="pagination">
            <li id="rank-list" class="page-item page-list">
              <label id="select-label">Filter by Rank</label>
              <select id="taxon-rank" class="page-link" title="Filter Search Results by Taxon Rank">
                <option value="ALL">All</option>
                <option value="KINGDOM">Kingdom</option>
                <option value="PHYLUM">Phylum</option>
                <option value="CLASS">Class</option>
                <option value="ORDER">Order</option>
                <option value="FAMILY">Family</option>
                <option value="GENUS">Genus</option>
                <option value="SPECIES">Species</option>
                <option value="SUBSPECIES">Subspecies</option>
                <option value="VARIETY">Variety</option>
              </select>
            </li>
            <li id="compare-list" class="page-item page-list">
              <label id="select-label">Status</label>
              <select id="taxon-status" class="page-link" title="Filter Search Results by Taxonomic Status">
                <option value="ALL">All</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="SYNONYM">Synonym</option>
                <option value="DOUBTFUL">Doubtful</option>
                <option value="HOMOTYPIC_SYNONYM">Homotypic Synonym</option>
                <option value="HETEROTYPIC_SYNONYM">Heterotypic Synonym</option>
                <option value="PROPARTE_SYNONYM">Proparte Synonnym</option>
              </select>
            </li>
            <li id="compare-list" class="page-item page-list">
              <label id="select-label">Compare To</label>
              <select id="compare-to" class="page-link" title="Compare Search Term To">
                <option value="ALL">All</option>
                <option value="SCIENTIFIC">Scientific Name</option>
                <option value="VERNACULAR">Common Name</option>
                <option value="DESCRIPTION">Description</option>
              </select>
            </li>
            <li id="page-list" class="page-item page-list">
              <label id="select-label">Recs/page</label>
              <select id="page-size" class="page-link" title="Number of Records to Show per Page - Also Applies to Download Page-Size">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </select>
            </li>
          </ul>
        </div>

        <div class="col-lg-3 col-md-6 col-xs-12">
          <ul class="pagination">
          <li id="page-first" name="page-first" class="page-item"><a class="page-link">First</a></li>
            <li id="page-prev" name="page-prev" class="page-item"><a class="page-link">Prev</a></li>
            <li class="page-item"><a id="page-number" class="page-link">Page 1</a></li>
            <li id="page-next" name="page-next" class="page-item"><a class="page-link">Next</a></li>
            <li id="page-last" name="page-last" class="page-item"><a class="page-link">Last</a></li>
          </ul>
        </div>

        <div class="col-lg-2 col-md-4 col-xs-12" id="species-download">
          <button class="btn btn-link" id="download-csv" type="submit" title="Download CSV">
            <i class="fa fa-download" aria-hidden="true"></i>
            CSV
          </button>
          <button class="btn btn-link" id="download-json" type="submit" title="Download JSON">
            <i class="fa fa-download" aria-hidden="true"></i>
            JSON
          </button>
          <a class="btn btn-link" id="flag-issue"
            href=""
            target="_blank"
            title="Flag an issue with VT Species Info"
            > 
            <i class="fa-solid fa-flag" aria-hidden="true"></i>
          </a>
        </div>

      </div>

      <div class="centered-text">
          <label id="download-progress" class="download-progress">Downloading...</label>
      </div>

      <div id="download-overlay"></div>

      <div id="information-overlay">
        <p id="information-content">
          Click Scientific Name to list all its child taxa.
        </p>
        <button class="btn btn-primary" id="information-button" onclick="hideInfo();">Ok</button>
      </div>

      <div class="row" id="species-results">
        <div class="col-lg-12">
          <table id="species-table" class="table table-striped table-responsive table-sm"></table>
        </div>
  		</div>

      <!-- repeat search term at bottom of list -->
      <div class="row">
        <div class="col-lg-6" id="search-term">
          <label id="search-value-bot"></label>
        </div>
      <!-- repeat pagination button at bottom of list -->
        <div class="col-lg-6">
          <ul class="pagination">
            <li id="page-first" name="page-first" class="page-item"><a class="page-link">First</a></li>
            <li id="page-prev" name="page-prev" class="page-item"><a class="page-link">Prev</a></li>
            <li class="page-item"><a id="page-number" class="page-link">Page 1</a></li>
            <li id="page-next" name="page-next" class="page-item"><a class="page-link">Next</a></li>
            <li id="page-last" name="page-last" class="page-item"><a class="page-link">Last</a></li>
          </ul>
        </div>
      </div>

  	</div>

  </section>

<?php get_footer(); ?>

<script src="/wp-content/themes/val/VAL_Data_Explorers/js/gbif_auto_complete.js" type="module"></script>
<script src="/wp-content/themes/val/VAL_Data_Explorers/js/gbif_species_results.js" type="module"></script>
