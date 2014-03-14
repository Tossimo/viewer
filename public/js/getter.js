$(function($) {
    var $container = $('#container');

    $container.masonry({
        columnWidth: 350,
        gutter: 0,
        itemSelector: '.item'
    });

    $.get('http://toss.od:3000/viewer', function(data) {
        $container.html(data);
        $container.imagesLoaded( function() {
            $container
                .masonry()
                .masonry('reloadItems', data)
                .masonry();
        });
    });


});
