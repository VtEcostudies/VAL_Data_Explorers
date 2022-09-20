<?php
/*
	Template Name: Species Explorer 2022
*/
?>

<?php get_header(); the_post(); ?>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-iYQeCzEYFbKjA/T2uDLTpkwGzCiq6soy8tYaI1GyVh/UjpbCx/TYkiZhlZB6+fzT" crossorigin="anonymous">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" rel="stylesheet">

  <section class="hero">

  	<div class="content">

  		<h2>GBIF Species Explorer</h2>

  		<form id="searchform" onsubmit="return false;" >

				<input id="species_search" autocomplete="off" list="gbif_autocomplete_list" class="search-field" value="" type="text" placeholder="Search the Atlas..." />
  			<datalist id="gbif_autocomplete_list"></datalist>

  			<div class="searchsubmit-wrap">
  				<button id="species_search_button">
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

    		<div class="col-lg-5 col-md-6 col-xs-12" id="species-value">
    			<label id="search-value"></label>
    		</div>
  <!--
    		<div class="species-paging" style="display:inline;">
    			<input id="page-first" type="button" value="|< First" />
    			<input id="page-prev" type="button" value="< Prev" />
    			<input id="page-next" type="button" value="Next >" />
    			<input id="page-last" type="button" value="Last >|" />
    		</div>
  -->
        <div class="col-lg-4 col-md-6 col-xs-12" id="species-paging">
          <ul class="pagination">
            <li id="page-first" class="page-item"><a class="page-link">First</a></li>
            <li id="page-prev" class="page-item"><a class="page-link">Prev</a></li>
            <!--
            <li id="page-number" class="page-item"><a class="page-link">1</a></li>
            <li id="page-number" class="page-item"><a class="page-link">2</a></li>
            <li id="page-number" class="page-item"><a class="page-link">3</a></li>
            <li id="page-elipsis" class="page-item"><a class="page-link">...</a></li>
            -->
            <li id="page-next" class="page-item"><a class="page-link">Next</a></li>
            <li id="page-last" class="page-item"><a class="page-link">Last</a></li>
          </ul>
        </div>
    		<div class="col-lg-3 col-md-6 col-xs-12" id="species-download">
          <button class="btn btn-link" id="download-csv" type="submit">
            <i class="fa fa-download" aria-hidden="true"></i>
            CSV
          </button>
          <button class="btn btn-link" id="download-json" type="submit">
            <i class="fa fa-download" aria-hidden="true"></i>
            JSON
          </button>
        </div>

      </div>

  		<div id="species-results">
  			<table id="species-table" class="table table-striped table-sm">
        </table>
  		</div>

  	</div>

  </section>

<script src="/wp-content/themes/val/js/gbif_auto_complete.js" type="module"></script>
<script src="/wp-content/themes/val/js/gbif_species_search.js" type="module"></script>
<script src="/wp-content/themes/val/js/gbif_species_results.js" type="module"></script>
