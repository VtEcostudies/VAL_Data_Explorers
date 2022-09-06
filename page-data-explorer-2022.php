<?php
/*
	Template Name: Data Explorer 2022
*/
?>

<!-- GBIF react data widget includes begin -->

		<!-- HEAD react and gbif component -->
		<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
		<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css" integrity="sha512-j4BKLk7HB2Umio2SKGP4gh1L3jouxJDuBxcWoq4kf1fYIkJyXQUGxs9me8yz2wexxAIHIcQHzn64UfPIG232xQ==" crossorigin="anonymous" />
		<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css' />

		<!--dynamically include version running in environment-->
		<script type="text/javascript" src="https://react-components.gbif.org/lib/gbif-react-components.js"></script>

<!-- GBIF react data widget includes end -->

<!-- JTL gbif-data-explorer includes begin -->

<link rel='stylesheet' href='gbif-data-explorer.css' />

<!-- JTL gbif-data-explorer includes end -->

<?php get_header(); the_post(); ?>

<?php
	$image_object = get_field('hero-img');
	$image_size = 'hero';
	$image_url = $image_object['sizes'][$image_size];
?>

<section class="hero" style="background-image: url(<?php echo $image_url; ?>)">

	<div class="content">

		<h1><?php the_field('heading-1'); ?></h1>
<!--
		<h2><?php the_field('heading-2'); ?></h2>
-->
		<!-- JTL changes for stats items

			- changed <a> to <button> and left href intact, which should do nothing
			- added unique ids for buttons
			- see js/gbif-data-explorer.js for button-mouseup function calls which set gbif-explorer iframe src value
		-->

<!--

		<div class="hero-stats-wrap">

			<button id="stats-records" class="hero-stats-item" href="<?php the_field('records-link'); ?>">

				<i class="stats-icon far fa-globe-americas"></i>

				<div class="stats">
					<span id="<?php the_field('records-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">records</span>
				</div>

			</button>

			<button id="stats-species" class="hero-stats-item" href="<?php the_field('species-link'); ?>">

				<i class="stats-icon fas fa-trees"></i>

				<div class="stats">
					<span id="<?php the_field('species-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">species</span>
				</div>

			</button>

			<button id="stats-datasets" class="hero-stats-item" href="<?php the_field('datasets-link'); ?>">

				<i class="stats-icon far fa-list-alt"></i>

				<div class="stats">
					<span id="<?php the_field('datasets-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">datasets</span>
				</div>

			</button>

			<button id="stats-publishers" class="hero-stats-item" href="<?php the_field('publishers-link'); ?>">

				<i class="stats-icon fa-regular fa-address-card"></i>

				<div class="stats">
					<span id="<?php the_field('publishers-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">publishers</span>
				</div>

			</button>

			<button id="stats-citations"  class="hero-stats-item" href="<?php the_field('citations-link'); ?>">

				<i class="stats-icon fa-light fa-books"></i>

				<div class="stats">
					<span id="<?php the_field('citations-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">citations</span>
				</div>

			</button>

			<button id="stats-sp-accounts"  class="hero-stats-item" href="<?php the_field('species-accounts-link'); ?>">

				<i class="stats-icon fa-regular fa-memo-circle-info"></i>

				<div class="stats">
					<span id="<?php the_field('species-accounts-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">species accounts</span>
				</div>

			</button>

		</div>

end 'hero-stats-wrap' -->

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
	<div id="gbif_react" class="whatever">
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

<!-- REMOVE footer as an interim solution to double-scrollbar problem: https://github.com/VtEcostudies/VAL_GBIF_Wordpress/issues/11
<?php get_footer(); ?>
-->
