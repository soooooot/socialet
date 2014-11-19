(function ($) {
  console.log('social');

  $(document).ready(function () {

    chrome.runtime.sendMessage({
      "method": 'getBlogCategory'
    }, function (data) {
      console.log('get blog category: ', data);
      if (data.length > 0) {
        var $blog = $('#blog');
        $.each(data.records, function (idx, data) {
          $blog.append($('<option>', { value : data.id })
                .text(data.name)); 
        });
      }
    });

    // set growl(notification-alert) default setting
    $.growl(false, {position: 'inherit', element: '#alert', width: '100%', z_index: 999});
    //$.growl({message: 'Saved Successfully!'}, {type: 'success'});

    function closeSocialet() {
      chrome.runtime.sendMessage({
        "method": 'close'
      });
    }

    $('form').submit(function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      
      console.log('form submit!!');
      var blog_id = $('#blog').val();

      chrome.runtime.sendMessage({
        "method": 'createBlog',
        "params": {
          'blog_id': blog_id
        }
      }, function (data) {
        if (data.error) {
          console.log('create record failed: ', data);
          $.growl({message: 'Error Happened! Please try again or try it later'}, {
            type: 'danger',
            delay: 0
          });
        } else {
          console.log('created');
          $('form').hide();
          closeSocialet();
        }
      });


    }); // end of form submit

    $('.close').click(closeSocialet);

  });  //end of document ready

})(jQuery);

