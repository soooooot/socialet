(function ($) {
  console.log('social');

  $(document).ready(function () {
    //chrome.runtime.sendMessage({greeting: "hello", "content": 'afasdf'});
    chrome.runtime.sendMessage({
      "method": 'getLinkInfo'
    }, function (data) {
      console.log('get linkinfo : ', data);
      $('#title').val(data.title);
      //$('#titlespan').text(data.title);
      $('#url').val(data.url);
    });

    // set growl(notification-alert) default setting
    $.growl(false, {position: 'inherit', element: '#alert', width: '100%', z_index: 999});
    //$.growl({message: 'Saved Successfully!'}, {type: 'success'});

    function closeSocialet() {
      chrome.runtime.sendMessage({
        "method": 'close'
      });
    }

    $('#remark').focus();

    $('form').submit(function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      
      console.log('form submit!!');
      var title = $('#title').val(),
          remark = $('#remark').val(),
          url = $('#url').val(),
          is_public = $('#public').is(':checked');

      chrome.runtime.sendMessage({
        "method": 'createRecord',
        "params": {
          "model": "link.link",
          "args": [{
              "title": title,
              "remark": remark,
              "url": url,
              "is_public": is_public 
          }],
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
          $.growl({message: 'Saved Successfully!'}, {
            type: 'success',
            onclose: closeSocialet,
            delay: 1
          });
        }
      });


    }); // end of form submit

    $('.close').click(closeSocialet);

  });  //end of document ready

})(jQuery);

