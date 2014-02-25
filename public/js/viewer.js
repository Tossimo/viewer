$(function($) {
    var $collectionsHolder = $('ul.collections-holder'),
        $imagesHolder = $('ul.images-holder');

    $('#upload-form').submit(function(evt) {
        evt.preventDefault();
        var fd = new FormData($(this)[0]);

        $.ajax({
            url: '/image/new',
            data: fd,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function(data){
                $imagesHolder.prepend(data);
            }
        }).fail(function() {
                alert('Unable to upload');
            });
    });


    $('#logout').on('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
            var element = $(this),
                form = $('<form></form>');
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


    $collectionsHolder.on('click', 'li', function() {
        var collId = $(this).children().data('id');
        $("#upload-form input[name='collectionId']").attr('value', collId);

        $.get('/images/' + collId, function(data) {
            $imagesHolder.html(data);
        });
        $('li.active').removeClass('active');
        $(this).addClass('active');
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
                $collectionsHolder.html(data);                                                                          //TODO: think better all list or element
            });
        };
        evt.preventDefault();
    });


    $imagesHolder.on('click', 'a.imageDel', function(evt) {

        var collId = $("input[name='collectionId']").val(),
            imgId = $(this).data('id'),
            parentLi = $(this).parent();

        $.ajax({
            url: '/image/del/' + collId,
            type: 'post',
            data: {
                imgId: imgId
            },
            success: function(data) {
                if(data == 'deleted') {
                    parentLi.remove();
                }
            },
            error: function(err) {
                alert('Sorry, something went wrong');
            }
        });

        evt.preventDefault();
    });

    $('div.error-message').delay(2000).fadeOut(1000);



});
