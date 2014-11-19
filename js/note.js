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

    // set growl(notification-alert) default setting
    $.growl(false, {position: 'inherit', element: '#alert', width: '100%'});
    //$.growl({message: 'Saved Successfully!'}, {type: 'success'});

    function closeSocialet() {
      chrome.runtime.sendMessage({
        "method": 'close'
      });
    }

    $('#tags').select2({
      //width: 'element',
      tokenSeparators: [','],
      createSearchChoice: function (term, data) {
          console.log('choice: ', data);
          var trim_term = $.trim(term);
          var same_terms = $(data).filter(function() {
              return (this.text === trim_term);
          });

          // create new tag only when not exsits in dataset
          if (same_terms.length === 0) {
            return {
                id: "NEW" + trim_term,
                text: trim_term
            };
          }
          
      },
      tags: function (query) {
        if (query.term === '') {
          query.callback({results: []});
        } else {
          chrome.runtime.sendMessage({
            "method": 'searchForTags',
            "term": query.term
          }, function (data) {
            var tags = {results: []};
            $.each(data, function (idx, item) {
              tags.results.push({id: item[0], text: item[1]});
            });
            query.callback(tags);
          });
          
          //data.results.push({id: 1, text: 'hehe'});
          //data.results.push({id: 2, text: 'haha'});
        }
      }
    });

    $('form').submit(function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      
      console.log('form submit!!');
      var raw_tags = $('#tags').select2('val'),
          content = $('#content').val(),
          dfds = [],
          tag_ids = [];

      $.each(raw_tags, function (idx, item) {
        if (item.indexOf('NEW') === 0) {
          //create new tag
          var dfd = $.Deferred(),
              promise = dfd.promise(),
              name = item.slice(3); //repeal 'NEW' string
          dfds.push(promise);
          chrome.runtime.sendMessage({
            "method": 'createNoteTag',
            "name": name
          }, function (data) {
            if (data.length) {
              console.log('new id: ', data[0], 'data ', data);
              tag_ids.push(data[0]);
            }
            dfd.resolve({});
          });

        } else {
          //it's the real ID
          tag_ids.push(parseInt(item, 10));
        }
      });

      $.when.apply($, dfds).done(createRecord).fail(createRecord);

      function createRecord(options) {
        console.log('create Record');
        console.log('tag_ids ', tag_ids);
        chrome.runtime.sendMessage({
          "method": 'createRecord',
          "params": {
            "model": "note.note",
            "args": [{
              "tag_ids": [
                  [6, false, tag_ids]
              ],
              //"stage_id": 1,
              "memo": content,
              "message_follower_ids": false,
              "message_ids": false
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
      } // end of createRecord


    }); // end of form submit

    $('.close').click(closeSocialet);

  });  //end of document ready

})(jQuery);

