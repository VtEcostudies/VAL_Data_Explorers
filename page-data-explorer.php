<?php
/*
	Template Name: Data Explorer
*/
?>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css" integrity="sha512-j4BKLk7HB2Umio2SKGP4gh1L3jouxJDuBxcWoq4kf1fYIkJyXQUGxs9me8yz2wexxAIHIcQHzn64UfPIG232xQ==" crossorigin="anonymous" />
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css' />
<link href="/wp-content/themes/val/VAL_Data_Explorers/css/gbif-data-styles.css" rel="stylesheet">

<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

<script type="text/javascript" src="https://react-components.gbif.org/lib/gbif-react-components.js"></script>

<?php get_header(); the_post(); ?>

<section> <!-- GBIF REACT Data Widget hangs on root -->
	<div id="gbif_react" class="data-widget">
		<div id="root"></div>
	</div>
</section>

<script src="/wp-content/themes/val/VAL_Data_Explorers/js/gbif_data_widget.js" type="module"></script>

<!-- This, combined with the gbif-data-widget, causes double scrollbars. Remove the footer until we can fix it. -->
<?php //get_footer(); ?>
