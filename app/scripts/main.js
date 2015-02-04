// Platypus - made by @b10nik

//Linter preferences
/*global $, FastClick*/
/*jslint node: true*/
/*jshint unused:false, camelcase:false */

var config = {
  debug: true,
  loadRange: 6000,
  loadNumber: 15
};

// --- Generic functions

//Log output if debug is true
function log(obj){
  'use strict';
  if (config.debug && typeof(console) !== 'undefined' && console.log) {
    console.log(obj);
  }
}

//Get query variables from URL
function getQueryVariable(variable){
  'use strict';
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split('=');
    if(pair[0] === variable){
      return pair[1];
    }
  }
  return(false);
}

// --- App

function App(imageContainer){
  'use strict';

  var a = this;

  a.imageContainer = imageContainer;

  a.loadLock = true;
  a.offset = 0;
  a.scrolled = false;

  a.seed = typeof getQueryVariable('shuffle') === 'undefined' ? Math.floor(Math.random()*100000) : 0;
  a.nsfw = typeof getQueryVariable('nsfw') === 'undefined' ? true : false;

  a.init = function(){
    log('app.init');

    if (a.nsfw) {
      $('[role="toggle-nsfw"]').hide();
    }

    a.bindEvents();
    a.loadImages();

  };

  a.bindEvents = function(){
    log('app.bindEvents');

    $(document).on('click', '.tags', function(e){
      if (!$(this).find('input').length) {
        var text = $(this).find('.text');
        var tags = $(text).html();
        var width = $(text).width();
        var input = $('<input value="'+tags+'" />');
        $(input).css({width: (width+40)+'px'});
        $(this).html( $(input) );
        $(input).focus();
      }
    });

    $(document).on('keyup', '.tags input', function(e){
      e.preventDefault();

      var input = $(this);

      if (e.keyCode === 13) {

        log('Submit tags');

        var id = $(this).closest('.image').attr('image_id');
        var tags = $(this).val();

        $.get(
          'backend/',
          {a: 'save_tags', id: id, tags: tags},
          function(data){
            if (data.status === 'OK') {
              $(input).closest('.tags').removeClass('changed');
              $(input).closest('.tags').addClass('saved');
            }
          }, 'json'
        );

      } else {
        $(input).closest('.tags').addClass('changed');
        $(input).closest('.tags').removeClass('saved');
      }

    });

    $(document).on('keyup', 'input.search', function(e){
      e.preventDefault();

      var input = $(this);

      if ( !a.loadLock && e.keyCode === 13 ) {
        a.loadLock = true;
        var search = $(input).val();
        a.searchImages(search);
      }

    });

    $(window).scroll(function(){
      a.scrolled = true;
    });

    setInterval(function(){ a.scrollCheck(); }, 250);

  };

  a.searchImages = function(search){
    log('app.searchImages');

    $(a.imageContainer).html('');
    a.imageOffset = 0;
    a.loadImages(search);
  };

  a.loadImages = function(search){
    log('app.loadImages');

    a.loadLock = true;

    if (typeof search === 'undefined') {
      search = '';
    }

    $.get(
      'backend/',
      {a: 'images', offset: a.imageOffset, number: config.loadNumber, nsfw: a.nsfw, search: search, seed: a.seed},
      function(data){
        if ( data.status === 'OK' ) {
          a.renderImages(data.images);
          a.imageOffset += data.images.length;
        }
        a.loadLock = false;
      }, 'json'
    );

  };

  a.renderImage = function(image){
    log('app.renderImage');

    var width = image.width;
    var height = image.height;

    if ( image.width > 1000 ) {
      height = 1000/width*height;
      width = 1000;
    }

    var obj = $('<div class="image" image_id="'+image.id+'" style="height: '+height+'px;" ><img src="../'+image.filename+'" style="width: '+width+'px; height: '+height+'px;"/><div class="tags"><div class="text">'+image.tags+'</div></div></div>');

    if ( image.width < 1000 ) {
      $(obj).css( {background: 'transparent url("../'+image.filename+'") repeat-x' } );
      $(obj).append( '<div class="shadow"></div>' );
    }

    return obj;
  };

  a.appendImages = function(images){
    log('app.appendImages');
    $.each(images, function(i, image){
      $(imageContainer).append( a.renderImage(image) );
    });
  };


  a.scrollCheck = function(){
    log('app.scrollCheck');
    if (a.scrolled){
      a.scrolled = false;
      var scrollTop = $(window).scrollTop();
      if (scrollTop > ($(a.imageContainer).height() - config.loadRange)) {
        a.loadImages();
      }
    }
  };

  a.init();

}

$(document).ready(function(){
  'use strict';

  var app = new App($('.imagewrapper'));

});