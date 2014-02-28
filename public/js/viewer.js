$(function($) {
    var $collectionsHolder = $('ul.collections-holder'),
        $collectionIdInput = $('input[name="collectionId"]'),
        imagesArr = [],
        $container = $('#container').masonry();


    var showImages = function(collId, fromZero) {
        var dataToInsert = [],
            collection = imagesArr[collId],
            loadFrom = collection.from;

        if (fromZero) {
            for (var index=0; index<=12; index++) {
                dataToInsert.push(collection.data[index]);
            }
            imagesArr[collId].from = loadFrom + 12;
        } else {
            for (var index=0; index<=loadFrom; index++) {
                dataToInsert.push(collection.data[index]);
            }
        }
        $container.html(dataToInsert);
        $container.imagesLoaded( function() {
            $container
                .masonry()
                .masonry('reloadItems', dataToInsert)
                .masonry();
        });
    };

    var appendImages = function(collId) {
        var dataToAppend = [],
            collection = imagesArr[collId],
            loadFrom = collection.from,
            loadTo = collection.data.length;

        loadTo = loadTo > loadFrom ? loadFrom+9 : loadFrom;

        for (var index=loadFrom; index<=loadTo; index++) {
            dataToAppend.push(collection.data[index]);
        }
        imagesArr[collId].from = loadTo;

        $container
            .append(dataToAppend)
            .masonry('reloadItems', dataToAppend)
            .masonry();
    };

    $('#upload-form').submit(function(evt) {
        evt.preventDefault();
        if($('#fileUpload').val()) {
            var fd = new FormData($(this)[0]),
                collId = $collectionIdInput.val();
            console.log(imagesArr[collId].data);

            $.ajax({
                url: '/image/new',
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function(data){
                    data = $(data);
                    $container.prepend(data);
                    $container.imagesLoaded( function() {
                        $container.masonry()
                                  .masonry('prepended', data)
                                  .masonry();
                    });
                    delete imagesArr[collId];
                }
            }).fail(function() {
                    alert('Unable to upload');
                });
        } else {
            alert('Please select file');
        }

    });


    $('#logout').on('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
            var form = $('<form></form>');
            form
                .attr({
                    method: 'POST',
                    action: '/logout'
                })
                .hide()
                .append('<input type="hidden" />')
                .find('input')
                .attr({
                    'name': '_method',
                    'value': 'delete'
                })
                .end()
                .appendTo('body')
                .submit();
        }
    });


    $collectionsHolder.on('click', 'li', function(evt) {
        var collId = $(this).children().data('id'),
            isActive = $(this).hasClass('active'),
            wasLoaded = imagesArr[collId];

        if (!isActive) {
            $collectionIdInput.prop('value', collId).next().prop('disabled', false);
            if (!wasLoaded) {
                $.get('/images/' + collId)
                    .done(function(data) {
                        if (!wasLoaded) {
                            imagesArr[collId] = {data: $(data), from: 0};
                        };
                        showImages(collId, true);
                    })
                    .fail(function() {
                        alert('Sorry, can\'t load');
                    });
            } else {
                showImages(collId, false);
            }
            $('li.active').removeClass('active');
            $(this).addClass('active');

            return false;
        }
    });


    $('a.collection-name').click(function(evt) {
        evt.preventDefault();
    });


    $collectionsHolder.on('click', 'a.collectionDel', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var collId = $(this).parents('li').children('a').data('id');

        if(confirm('You\'re shurely want to delete the collection?')) {
            $.get('/collection/del/' + collId, function(data) {
                $collectionsHolder.html(data);
            });
        };
    });

    $collectionsHolder.on('click', 'a.collectionEdt', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var $parentsCtrls = $(this).parents('div.parents'),
            $parentLi = $parentsCtrls.parents('li'),
            $childrenCtrls = $parentLi.find('div.children'),
            $editable = $parentLi.children('a'),
            oldName = $editable.text();

        var revertState = function(elem) {
            $childrenCtrls.hide();
            elem.attr('contenteditable', 'false');
        };

        $editable.attr('contenteditable', 'true').focus();
        $childrenCtrls.show();

        $childrenCtrls.on('click', 'a.collectionSav', function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var collId = $editable.data('id'),
                newName = $editable.text();

            if (oldName != newName) {
                $.get('/collection/ren/' + collId, {newName: newName})
                    .done(function(data) {
                        revertState($(this));
                    })
                    .fail(function() {
                        alert('Sorry, can\'t rename');
                        $editable.text(oldName);
                        revertState($(this));
                    });
            } else {
                revertState($(this));
            }
        });
        $childrenCtrls.on('click', 'a.collectionCnl', function(evt) {
            evt.preventDefault();
            $editable.text(oldName);
            revertState($(this));
        });

        $editable.focusout(function(evt) {
            $(this).attr('contenteditable', 'false');
        });
    });


    $('ul.collection-input a.collectionAdd').click(function(evt) {
        var $input = $(this).siblings().first();
        var collName = $input.val();
        $input.val('');
        if (collName) {
            $.get('/collection/new/' + collName, function(data) {
                $collectionsHolder.html(data);
            });
        };

        evt.preventDefault();
    });


    $container.on('click', 'a.imageDel', function(evt) {

        var collId = $collectionIdInput.val(),
            imgId = $(this).data('id'),
            item = $(this).parents('div.item');

        $.ajax({
            url: '/image/del/' + collId,
            type: 'post',
            data: {
                imgId: imgId
            },
            success: function(data) {
                if(data == 'deleted') {
                    $container.masonry('remove', item).masonry();
                    item.remove();
                    delete imagesArr[collId];
                }
            },
            error: function(err) {
                alert('Sorry, something went wrong');
            }
        });

        evt.preventDefault();
    });

    $('div.error-message').delay(2000).fadeOut(1000);


    $(window).scroll(function(evt) {
        if  ($(window).scrollTop() + 50 >= $(document).height() - $(window).height()) {
            var collId = $collectionIdInput.val();
            appendImages(collId);
        }
    })
});
