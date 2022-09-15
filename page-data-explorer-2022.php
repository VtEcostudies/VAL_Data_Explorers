<?php
/*
	Template Name: Data Explorer 2022
*/
?>

<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css" integrity="sha512-j4BKLk7HB2Umio2SKGP4gh1L3jouxJDuBxcWoq4kf1fYIkJyXQUGxs9me8yz2wexxAIHIcQHzn64UfPIG232xQ==" crossorigin="anonymous" />
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css' />

<script type="text/javascript" src="https://react-components.gbif.org/lib/gbif-react-components.js"></script>

<?php get_header(); the_post(); ?>

<section> <!-- GBIF REACT Data Widget hangs on root -->
	<div id="gbif_react" class="data-widget">
		<div id="root"></div>
	</div>
</section>

<script src="/wp-content/themes/val/js/gbif_data_widget.js" type="text/javascript"></script>
