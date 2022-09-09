<?php

// enable editor-style.css
add_editor_style();

// customize wp login logo
function my_login_logo() { ?>
    <style type="text/css">
        body.login div#login h1 a {
            background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/images/logo-large.png);
			width: 250px;
			height: 64px;
			background-size: 250px 64px;
        }
    </style>
<?php }
add_action( 'login_enqueue_scripts', 'my_login_logo' );

// change wp login logo link
add_filter( 'login_headerurl', 'custom_loginlogo_url' );
function custom_loginlogo_url($url) {
	return get_option('home'); // link to the homepage
}

// remove wp login logo link title
function new_wp_login_title() {
		return get_option(''); // or use get_option('blogname') to show site title tooltip on hover
}
add_filter('login_headertitle', 'new_wp_login_title');

// add scripts for site-wide functionality
function scripts() {
    wp_enqueue_script(
        'scripts',
        get_stylesheet_directory_uri() . '/js/scripts.js',
        array('jquery')
    );
}
add_action( 'wp_enqueue_scripts', 'scripts' );

// add scripts for GBIF Data Explorer
function data_explorer_js() {
  //i think we don't need this bootstrap include anymore
  //wp_enqueue_script( 'val-bootstrap', 'https://vtatlasoflife.org/js/bootstrap.js');
  //this is still used by gbif-data-explorer.js
  wp_enqueue_script( 'val-numeral', '//cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js');

  // react and gbif components and VAL's implementation
  //wp_enqueue_script( 'gbif-react', 'https://unpkg.com/react@16/umd/react.production.min.js');
  //wp_enqueue_script( 'gbif-react-dom', 'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js', array('gbif-react') );

  //wp_enqueue_style('mapbox-gl', 'https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.min.css');
  //wp_enqueue_style('open-layers', 'https://cdnjs.cloudflare.com/ajax/libs/openlayers/6.1.1/ol.min.css');

  //wp_enqueue_script( 'gbif-react-comp', 'https://react-components.gbif.org/lib/gbif-react-components.js');
  //wp_enqueue_script( 'gbif-data-widget', 'https://val.vtecostudies.org/wp-content/themes/val/js/gbif_data_widget.js');
}
add_action( 'wp_enqueue_scripts', 'data_explorer_js' );

// add custom admin & ACF stylesheet
function admin_acf_styles() {
    wp_enqueue_style('admin-acf-styles', get_template_directory_uri() . '/css/admin-acf-styles.css');
}
add_action( 'admin_enqueue_scripts', 'admin_acf_styles' );

function jason_loomis_dedicated_stylesheet() {
    wp_enqueue_style('dadra-style', get_stylesheet_directory_uri().'/css/jason-styles.css');
}
add_action('wp_enqueue_scripts', 'jason_loomis_dedicated_stylesheet');

// acf options page settings
if(function_exists('acf_add_options_page')) {

	acf_add_options_page();
    acf_add_options_sub_page('Footer');
    acf_set_options_page_title( __('Footer Content') );
    acf_set_options_page_menu( __('Footer Content') );
}

// ACF: show order number on field groups page
function acf_field_group_columns($columns) {
  $columns['menu_order'] = __('Order');
  return $columns;
} // end function reference_columns
add_filter('manage_edit-acf-field-group_columns', 'acf_field_group_columns', 20);

function acf_field_group_columns_content($column, $post_id) {
  switch ($column) {
    case 'menu_order':
      global $post;
      echo '<strong>',$post->menu_order,'</strong>';
      break;
    default:
      break;
  } // end switch
} // end function reference_columns_content
add_action('manage_acf-field-group_posts_custom_column', 'acf_field_group_columns_content', 20, 2);

// enable post thumbnails
add_theme_support( 'post-thumbnails' );

// customize excerpt length
function custom_excerpt_length( $length ) {
	return 40; // length in words
}
add_filter( 'excerpt_length', 'custom_excerpt_length', 999 );

// customize excerpt "more string"
function new_excerpt_more( $more ) {
	return '...';
}
add_filter('excerpt_more', 'new_excerpt_more');

// add post pagination
// http://design.sparklette.net/teaches/how-to-add-wordpress-pagination-without-a-plugin
function pagination($pages = '', $range = 4)
{
     $showitems = ($range * 2)+1;

     global $paged;
     if(empty($paged)) $paged = 1;

     if($pages == '')
     {
         global $wp_query;
         $pages = $wp_query->max_num_pages;
         if(!$pages)
         {
             $pages = 1;
         }
     }

     if(1 != $pages)
     {
         echo "<div class=\"pagination\"><span>Page ".$paged." of ".$pages."</span>";
         if($paged > 2 && $paged > $range+1 && $showitems < $pages) echo "<a href='".get_pagenum_link(1)."'>&laquo; First</a>";
         if($paged > 1 && $showitems < $pages) echo "<a href='".get_pagenum_link($paged - 1)."'>&lsaquo; Previous</a>";

         for ($i=1; $i <= $pages; $i++)
         {
             if (1 != $pages &&( !($i >= $paged+$range+1 || $i <= $paged-$range-1) || $pages <= $showitems ))
             {
                 echo ($paged == $i)? "<span class=\"current\">".$i."</span>":"<a href='".get_pagenum_link($i)."' class=\"inactive\">".$i."</a>";
             }
         }

         if ($paged < $pages && $showitems < $pages) echo "<a href=\"".get_pagenum_link($paged + 1)."\">Next &rsaquo;</a>";
         if ($paged < $pages-1 &&  $paged+$range-1 < $pages && $showitems < $pages) echo "<a href='".get_pagenum_link($pages)."'>Last &raquo;</a>";
         echo "<div class=\"clear\"></div></div>\n";
     }
}

// custom images sizes
add_image_size( 'thumbnail-small', 100, 80, true ); // 100px x 80px, hard crop enabled
add_image_size( 'boxed-link-large-thumbnail', 400, 155, true );
add_image_size( 'grid-thumbnail', 180, 130, true );
add_image_size( 'news', 500, 300, true );
add_image_size( 'card', 620, 410, true );
add_image_size( 'hero', 1800, 700, true );
add_image_size( 'partner-logo', 250, 250, false );

// set compression for ACF Image Crop Add-on
// https://wordpress.org/support/topic/cropped-images-larger
add_filter('acf-image-crop/image-quality', function($arg){return 60;});

// make custom image sizes selectable in media uploader
function add_custom_sizes( $imageSizes ) {
  $my_sizes = array(
		'nav-img' => 'Nav Image'
	);
	return array_merge( $imageSizes, $my_sizes );
}
add_filter( 'image_size_names_choose', 'add_custom_sizes' );

// Remove H1 and other extraneous tags from the visual editor
// Default: p,address,pre,h1,h2,h3,h4,h5,h6
// http://wordpress.stackexchange.com/questions/45815/disable-h1-and-h2-from-rich-text-editor-combobox

function wp_wysiwyg_clean($arr){
    $arr['block_formats'] = 'Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4';
    return $arr;
  }
add_filter('tiny_mce_before_init', 'wp_wysiwyg_clean');

// widgets
if ( function_exists('register_sidebar') )
	register_sidebar(array(
		'name' => 'AddThis Widget Area',
        'before_widget' => '',
        'after_widget' => '',
        'before_title' => '<h3>',
        'after_title' => '</h3>',
    )
);

// remove auto-generated div container from custom menu widget
// http://wordpress.org/support/topic/custom-menu-remove-div-container
add_filter('wp_nav_menu_args', 'prefix_nav_menu_args');
function prefix_nav_menu_args($args = ''){
    $args['container'] = false;
    return $args;
}

// nav menus
if (function_exists('register_nav_menus')) {
	register_nav_menus(
		array(
			'main-nav' => 'Main Menu',
            'secondary-nav' => 'Secondary Menu',
            'newsfeed-nav' => 'Newsfeed Menu',
			'footer-menu' => 'Footer Menu'
		)
	);
}

// automatic feed links
add_theme_support('automatic-feed-links');

// remove automatic css from wp gallery
add_filter('gallery_style', create_function('$a', 'return "
<div class=\'gallery\'>";'));

/*
Plugin Name: Fix Image Margins
Plugin URI: http://rathercurious.net
Description: removes the arbitrary 10px margin from caption based images
Version: 1.0.2
Author: Justin Adie
Author URI: http://rathercurious.net
*/
class fixImageMargins{
    public $xs = 0; //change this to change the amount of extra spacing

    public function __construct(){
        add_filter('img_caption_shortcode', array(&$this, 'fixme'), 10, 3);
    }
    public function fixme($x=null, $attr, $content){

        extract(shortcode_atts(array(
                'id'    => '',
                'align'    => 'alignnone',
                'width'    => '',
                'caption' => ''
            ), $attr));

        if ( 1 > (int) $width || empty($caption) ) {
            return $content;
        }

        if ( $id ) $id = 'id="' . $id . '" ';

    return '<div ' . $id . 'class="wp-caption ' . $align . '" style="width: ' . ((int) $width + $this->xs) . 'px">'
    . $content . '<p class="wp-caption-text">' . $caption . '</p></div>';
    }
}
$fixImageMargins = new fixImageMargins();

// add code to youtube embeds so they're not on top of dropdown menus
function add_video_wmode_transparent($html, $url, $attr) {

if ( strpos( $html, "<embed src=" ) !== false )
	{ return str_replace('</param><embed', '</param><param name="wmode" value="opaque"></param><embed wmode="opaque" ', $html); }
elseif ( strpos ( $html, 'feature=oembed' ) !== false )
	{ return str_replace( 'feature=oembed', 'feature=oembed&wmode=opaque', $html ); }
else
	{ return $html; }
}
add_filter( 'embed_oembed_html', 'add_video_wmode_transparent', 10, 3);

// change "howdy" in admin bar
function replace_howdy( $wp_admin_bar ) {
 $my_account=$wp_admin_bar->get_node('my-account');
 $newtitle = str_replace( 'Howdy,', 'Your account:', $my_account->title );
 $wp_admin_bar->add_node( array(
 'id' => 'my-account',
 'title' => $newtitle,
 ) );
 }
 add_filter( 'admin_bar_menu', 'replace_howdy',25 );

?>
