<?php
/*
	Template Name: Data Explorer Literature
*/
?>
<!-- 
NOTE: This was copied from the VAL_Remote_Explorers repository. This approach - to externalize all
VAL/GBIF .js code onto vtatlasoflife servers - is our standard approach.

We created a WordPress function within functions.php to define which VAL server to use based on the
name of the WordPress site. The initial VAL servers are staging.vtatlsoflife.org and vtatlasoflife.org.

The only local javascript code is the localSiteConfig.js file, which can be used to override other
siteName directives. siteName defines which VAL Atlas to display - each is defined primarily by a
published GBIF species checklist, then by an occurrence taxnomic scope.
-->

<link rel="stylesheet" href="https://www-lib.gbif.org/style.css" />
<link href="https://<?php echo get_val_server_name(); ?>/VAL_Data_Explorers/css/gbif-data-styles.css" rel="stylesheet">

<script type="module" src="<?php echo get_template_directory_uri(); ?>/VAL_Data_Explorers/js/localSiteConfig.js">/*THIS SCRIPT MUST COME FIRST*/</script>

<?php get_header(); the_post(); ?>

<section> <!-- GBIF REACT Data Widget hangs on root -->
	<div id="gbif_react" class="lit-widget gbif">
		<div id="root"></div>
	</div>
</section>

<script src="https://<?php echo get_val_server_name(); ?>/VAL_Data_Explorers/js/freshworks.js" type="module"></script>
<script src="https://<?php echo get_val_server_name(); ?>/VAL_Data_Explorers/js/gbif_lit_widget.js" type="module"></script>

<!-- This, combined with the gbif-data-widget, causes double scrollbars. Remove the footer until we can fix it. -->
<?php //get_footer(); ?>
