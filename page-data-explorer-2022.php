<?php
/*
	Template Name: Data Explorer 2022
*/
?>

<link rel='stylesheet' href='gbif-data-explorer.css' />

<!-- GBIF react data widget includes begin -->

		<!-- HEAD react and gbif component -->
		<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
		<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css" integrity="sha512-j4BKLk7HB2Umio2SKGP4gh1L3jouxJDuBxcWoq4kf1fYIkJyXQUGxs9me8yz2wexxAIHIcQHzn64UfPIG232xQ==" crossorigin="anonymous" />
		<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css' />

		<!--dynamically include version running in environment-->
		<script type="text/javascript" src="https://react-components.gbif.org/lib/gbif-react-components.js"></script>

<!-- GBIF react data widget includes end -->

<?php get_header(); the_post(); ?>

<?php
	$image_object = get_field('hero-img');
	$image_size = 'hero';
	$image_url = $image_object['sizes'][$image_size];
?>

<section class="hero" style="background-image: url(<?php echo $image_url; ?>)">

	<div class="content">

		<h1><?php the_field('heading-1'); ?></h1>

		<form id="searchform" onsubmit="return false;" >

			<!-- gbif autocomplete scientific name lookup -->
			<input id="occ_search" autocomplete="off" list="gbif_autocomplete_list" class="search-field" onfocus="this.value=''" value="Search GBIF-VT..." type="text" placeholder="Search GBIF-VT..." />
			<datalist id="gbif_autocomplete_list"></datalist>

			<div class="searchsubmit-wrap">
				<button id="occ_search_button">
					<i class="far fa-search"></i>
				</button>
			</div>

		</form>

	</div> <!-- end 'content' -->

	<span class="overlay"></span>

</section>

<section> <!-- GBIF REACT Data Widget hangs on root -->
	<div id="gbif_react" class="data-widget">
		<div id="root"></div>
	</div>
</section>

<!--
<section>
	<iframe
		id="gbif_frame"
		title="VAL GBIF Data Explorer"
		src="https://hp-vtatlasoflife.gbif.org/occurrence/search/?view=MAP"
		width="100%"
		height="900"
		scrolling="no"
		seamless="seamless">
	</iframe>
</section>
-->

<script src="https://val.vtecostudies.org/wp-content/themes/val/js/gbif_data_widget.js" type="text/javascript"></script>
<script src="https://val.vtecostudies.org/wp-content/themes/val/js/gbif_data_explorer.js" type="text/javascript"></script>
<script src="https://val.vtecostudies.org/wp-content/themes/val/js/gbifAutoComplete.js" type="module"></script>
