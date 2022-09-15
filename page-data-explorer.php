<?php
/*
	Template Name: Data Explorer
*/
?>

<?php get_header(); the_post(); ?>

<?php
	$image_object = get_field('hero-img');
	$image_size = 'hero';
	$image_url = $image_object['sizes'][$image_size];
?>

<section class="hero" style="background-image: url(<?php echo $image_url; ?>)">

	<div class="content">

		<h1><?php the_field('heading-1'); ?></h1>

		<h2><?php the_field('heading-2'); ?></h2>

		<div class="hero-stats-wrap">

			<a class="hero-stats-item" href="<?php the_field('records-link'); ?>">

				<i class="stats-icon far fa-globe-americas"></i>

				<div class="stats">
					<span id="<?php the_field('records-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">records</span>
				</div>

			</a>

			<a class="hero-stats-item" href="<?php the_field('species-link'); ?>">

				<i class="stats-icon fas fa-trees"></i>

				<div class="stats">
					<span id="<?php the_field('species-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">species</span>
				</div>

			</a>

			<a class="hero-stats-item" href="<?php the_field('datasets-link'); ?>">

				<i class="stats-icon far fa-list-alt"></i>

				<div class="stats">
					<span id="<?php the_field('datasets-id'); ?>" class="stats-count"><i class="far fa-compass"></i></span>
					<span class="stats-desc">datasets</span>
				</div>

			</a>

		</div>

		<form id="searchform" onsubmit="return false;" >

			<input id="bie_search" class="search-field" onfocus="this.value=''" value="Search the Atlas..." type="text" placeholder="Search the Atlas..." />

			<div class="searchsubmit-wrap">
				<button id="bie_search_button">
					<i class="far fa-search"></i>
				</button>
			</div>
		</form>

	</div>

	<span class="overlay"></span>

</section>

<section class="card-grid">

	<?php if( have_rows('cards') ): ?>

		<div class="content">

			<?php if(get_field('cards-head')): ?>

				<h2><?php the_field('cards-head'); ?></h2>

			<?php endif; ?>

			<div class="cards">

				<?php while( have_rows('cards') ): the_row(); ?>

					<a class="card" href="<?php the_sub_field('card-link'); ?>">

						<?php
							$image = get_sub_field('card-img');
							echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
						?>

						<div class="card-content">

							<h3><?php the_sub_field('card-head'); ?></h3>

							<p><?php the_sub_field('card-desc'); ?></p>

						</div>

					</a>

				<?php endwhile; ?>

			</div>

		</div>

	<?php endif; ?>

</section>

<section class="data-cards card-grid">

	<div class="content">

		<h2><?php the_field('data-cards-head'); ?></h2>

		<div class="cards">

			<?php
				if( have_rows('data-cards') ):
				while( have_rows('data-cards') ): the_row();
			?>

				<a class="card" href="<?php the_sub_field('data-card-link'); ?>">

					<?php
						$image = get_sub_field('data-card-img');
						echo '<img src="' . $image['sizes']['card'] . '" alt="' . $image['alt'] . '" />';
					?>

					<div class="card-content">

						<h3><?php the_sub_field('data-card-head'); ?></h3>

						<div class="card-stats">

							<div class="stats">

								<?php if(get_sub_field('records-data-type') == "static"): ?>

									<span><?php the_sub_field('data-card-records-count'); ?></span> records

								<?php endif; ?>

								<?php if(get_sub_field('records-data-type') == "dynamic"): ?>

									<span id="<?php the_sub_field('data-card-records-id'); ?>"></span> records

								<?php endif; ?>

							</div>

							<div class="stats">

								<?php if(get_sub_field('species-data-type') == "static"): ?>

									<span><?php the_sub_field('data-card-species-count'); ?></span> species

								<?php endif; ?>

								<?php if(get_sub_field('species-data-type') == "dynamic"): ?>

									<span id="<?php the_sub_field('data-card-species-id'); ?>"></span> species

								<?php endif; ?>

							</div>

						</div>

					</div>

				</a>

			<?php endwhile; endif; ?>

		</div>

	</div>

</section>

<?php
	$image_object = get_field('living-atlas-img');
	$image_size = 'hero';
	$image_url = $image_object['sizes'][$image_size];
?>

<section class="living-atlas" style="background-image: url(<?php echo $image_url; ?>)">

	<div class="content">

		<h2>
			<a href="<?php the_field('living-atlas-button-link'); ?>">
				<?php the_field('living-atlas-head'); ?>
			</a>
		</h2>

		<p><?php the_field('living-atlas-desc'); ?></p>

		<a class="button" href="<?php the_field('living-atlas-button-link'); ?>">
			<?php the_field('living-atlas-button-text'); ?>
		</a>

	</div>

	<span class="overlay"></span>

</section>

<script src="/wp-content/themes/val/js/gbif_data_explorer.js" type="text/javascript"></script>

<?php get_footer(); ?>
