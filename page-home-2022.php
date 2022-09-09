<?php
/*
	Template Name: Home 2022
*/
?>

<?php get_header(); the_post(); ?>

<section class="hero">

	<div class="content">

		<h1><?php the_field('heading-1'); ?></h1>

		<h2><?php the_field('heading-2'); ?></h2>

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

		</div>

		<form id="searchform" onsubmit="return false;" >

			<!-- gbif autocomplete scientific name lookup -->
			<input id="occ_search" autocomplete="off" list="gbif_autocomplete_list" class="search-field" onfocus="this.value=''" value="Search the Atlas..." type="text" placeholder="Search the Atlas..." />

			<datalist id="gbif_autocomplete_list"></datalist>

			<div class="searchsubmit-wrap">
				<button id="occ_search_button">
					<i class="far fa-search"></i>
				</button>
			</div>

		</form>

	</div>

	<span class="overlay"></span>

</section>

<section class="home-data-explorer">

	<div class="content">

		<div class="text-wrap">

			<h2>
				<a href="<?php the_field('data-explorer-button-link'); ?>">
					<?php the_field('data-explorer-head'); ?>
				</a>
			</h2>

			<p><?php the_field('data-explorer-desc'); ?></p>

		</div>

		<div class="button-wrap">

			<a class="button" href="<?php the_field('data-explorer-button-link'); ?>">
				<?php the_field('data-explorer-button-text'); ?>
			</a>

		</div>

	</div>

</section>

<section class="home-sightings card-grid">

	<div class="content">

		<h2><?php the_field('sightings-head'); ?></h2>

		<div class="cards">

			<?php
				if( have_rows('sightings-cards') ):
				while( have_rows('sightings-cards') ): the_row();
			?>

				<a class="card" href="<?php the_sub_field('sightings-card-button-link'); ?>">

					<?php
						$image = get_sub_field('sightings-card-img');
						echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
					?>

					<div class="card-content">

						<h3><?php the_sub_field('sightings-card-head'); ?></h3>

						<p><?php the_sub_field('sightings-card-desc'); ?></p>

						<span class="button">
							<?php the_sub_field('sightings-card-button-text'); ?>
						</span>

					</div>

				</a>

			<?php endwhile; endif; ?>

		</div>

	</div>

</section>

<section class="home-featured-species">

	<h2><?php the_field('featured-species-head'); ?></h2>

	<div class="content">

		<div class="cards">

			<?php
				if( have_rows('featured-species-cards') ):
				while( have_rows('featured-species-cards') ): the_row();
			?>

				<a class="card" href="<?php the_sub_field('featured-species-card-link'); ?>">

					<?php
						$image = get_sub_field('featured-species-card-img');
						echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
					?>

					<h3><?php the_sub_field('featured-species-card-head'); ?></h3>

				</a>

			<?php endwhile; endif; ?>

		</div>

	</div>

</section>

<?php
	$image_object = get_field('featured-project-img');
	$image_size = 'hero';
	$image_url = $image_object['sizes'][$image_size];
?>

<section class="home-discoveries card-grid">

	<div class="content">

		<h2>
			<a href="<?php the_field('discoveries-all-button-link'); ?>">
				<?php the_field('discoveries-head'); ?>
			</a>
		</h2>

		<div class="cards">

			<?php
				if( have_rows('discoveries-cards') ):
				while( have_rows('discoveries-cards') ): the_row();
			?>

				<a class="card" href="<?php the_sub_field('discoveries-card-link'); ?>">

					<?php
						$image = get_sub_field('discoveries-card-img');
						echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
					?>

					<div class="card-content">

						<h3><?php the_sub_field('discoveries-card-head'); ?></h3>

						<p><?php the_sub_field('discoveries-card-desc'); ?></p>

					</div>

				</a>

			<?php endwhile; endif; ?>

		</div>

		<a class="discoveries-all-link button" href="<?php the_field('discoveries-all-button-link'); ?>">
			<?php the_field('discoveries-all-button-text'); ?> &raquo;
		</a>

	</div>

</section>

<section class="home-featured-project" style="background-image: url(<?php echo $image_url; ?>)">

	<img
		src="<?php $image = get_field('featured-project-img'); echo $image['url'] ?>"
		alt="<?php echo $image['alt']; ?>"
	>

	<div class="content-wrap <?php the_field('featured-project-content-align'); ?>">

		<div class="content <?php the_field('featured-project-text-color'); ?> <?php the_field('featured-project-content-bkgnd'); ?>">

			<h3><?php the_field('featured-project-label'); ?></h3>

			<h2>
				<a href="<?php the_field('featured-project-button-link'); ?>">
					<?php the_field('featured-project-name'); ?>
				</a>
			</h2>

			<p><?php the_field('featured-project-desc'); ?></p>

			<a class="button" href="<?php the_field('featured-project-button-link'); ?>">
				<?php the_field('featured-project-button-text'); ?>
			</a>

		</div>

	</div>

</section>

<section class="home-news card-grid">

	<div class="content">

		<h2><?php the_field('news-head'); ?></h2>

		<div class="cards">

			<?php
				if( have_rows('news-cards') ):
				while( have_rows('news-cards') ): the_row();
			?>

				<a class="card" href="<?php the_sub_field('news-card-link'); ?>">

					<?php
						$image = get_sub_field('news-card-img');
						echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
					?>

					<div class="card-content">

						<h3><?php the_sub_field('news-card-head'); ?></h3>

						<p><?php the_sub_field('news-card-desc'); ?></p>

					</div>

				</a>

			<?php endwhile; endif; ?>

		</div>

	</div>

</section>

<script src="https://val.vtecostudies.org/wp-content/themes/val/js/gbif_data_explorer.js" type="text/javascript"></script>
<script src="https://val.vtecostudies.org/wp-content/themes/val/js/gbifAutoComplete.js" type="module"></script>

<?php get_footer(); ?>
