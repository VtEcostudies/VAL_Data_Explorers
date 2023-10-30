<?php

	/*
		Template Name: Project Child
	*/

?>

<?php get_header(); the_post(); ?>

<?php get_template_part( 'page-top-content' ); ?>

<main role="main">

	<?php get_template_part( 'page-project-aside' ); ?>
	
	<article>
		
		<?php get_template_part( 'page-flexible-content' ); ?>

	</article>

	<div class="clear"></div>

</main>

<?php get_footer(); ?>
