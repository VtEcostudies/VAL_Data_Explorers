// "SKIP TO CONTENT" link: bring target into focus
jQuery(document).ready(function ($) {
	$(".skip").click(function(){
		var skipTo="#"+this.href.split('#')[1];
		$(skipTo).attr('tabindex', -1).on('blur focusout', function () {
			$(this).removeAttr('tabindex');
		}).focus();
	});
});

// OFF-CANVAS SIDEBAR funcionality
jQuery(document).ready(function ($) {
  $('[data-toggle=offcanvas]').click(function() {
    $('main, #title-wrap').toggleClass('active');
  });
});

// TOOGLE BLOG CATEGORIES
jQuery(document).ready(function ($) {
  $("a.category-toggle").on("click", function () {
    $( this ).toggleClass( "active" );
    $("ul.categories").toggleClass( "active" );  
  });
});