<?php
/*
	Template Name: Literature Explorer 2022
*/
?>

		<!-- HEAD react and gbif component -->
		<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
		<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css" integrity="sha512-j4BKLk7HB2Umio2SKGP4gh1L3jouxJDuBxcWoq4kf1fYIkJyXQUGxs9me8yz2wexxAIHIcQHzn64UfPIG232xQ==" crossorigin="anonymous" />
		<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css' />

		<!--dynamically include version running in environment-->
		<script type="text/javascript" src="https://react-components.gbif.org/lib/gbif-react-components.js"></script>

<?php get_header(); the_post(); ?>

<section> <!-- GBIF REACT Data Widget hangs on root -->
	<div id="gbif_react" class="lit-widget">
		<div id="root"></div>
	</div>
</section>

<script src="/wp-content/themes/val/js/gbif_lit_widget.js" type="module"></script>

<!-- This, combined with the gbif-data-widget, causes double scrollbars. Remove the footer until we can fix it. -->
<?php //get_footer(); ?>
