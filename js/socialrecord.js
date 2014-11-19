(function ($) {
  console.log('social');

  $(document).ready(function () {
    //chrome.runtime.sendMessage({greeting: "hello", "content": 'afasdf'});
    chrome.runtime.sendMessage({
      "method": 'getSelectionText'
    }, function (data) {
      console.log('get selection text: ', data);
      $('#content').val(data.selectionText);
    });

    chrome.runtime.sendMessage({
      "method": 'getInitialStage'
    }, function (data) {
      console.log('get stages: ', data);
      if (data.length > 0) {
        var $stage = $('#stage');
        $.each(data.records, function (idx, data) {
          $stage.append($('<option>', { value : data.id })
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
      var content = $('#content').val(),
          stage = $('#stage').val();

      chrome.runtime.sendMessage({
        "method": 'createRecord',
        "params": {
          "model": "sale.sns.record",
          "args": [{
              "message": content,
              "image": false,
              "stage": stage,
              "nodes": [
                  [6, false, []]
              ]
          }]
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

