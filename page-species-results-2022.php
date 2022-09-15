<?php
/*
	Template Name: Species Results 2022
*/
?>

<?php get_header(); the_post(); ?>

<section>

		<input id="species_search" autocomplete="off" list="gbif_autocomplete_list" class="search-field" onfocus="this.value=''" value="Search the Atlas..." type="text" placeholder="Search the Atlas..." />
		<datalist id="gbif_autocomplete_list"></datalist>

		<div class="searchsubmit-wrap">
			<button id="species_search_button">
				<i class="far fa-search"></i>
			</button>
		</div>

		<div>
			<label id="search-value"></label>
		</div>
		<div id="page-div">
			<input id="page-first" type="button" value="|< First" />
		  <input id="page-prev" type="button" value="< Prev" />
		  <input id="page-next" type="button" value="Next >" />
		  <input id="page-last" type="button" value="Last >|" />
		</div>

</section>

<section>
	<div id="species-results">
		<table id="species-table">
		</table>
	</div>
</section>

<script src="/wp-content/themes/val/js/gbif_species_search.js" type="module"></script>
<script src="/wp-content/themes/val/js/gbif_species_results.js" type="module"></script>