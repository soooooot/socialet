console.log('popup');

function getOdooSessionId(option) {
  var result = $.Deferred(),
      domain = window.localStorage.getItem('domain');

  chrome.cookies.getAll({
    domain: domain,
    name: 'session_id'
  }, function (cookies) { 
    if (cookies.length) {
      result.resolve(cookies[0].value);
    } else {
      result.reject('');
    }
  });
  return result.promise();
}

function failHandler(data, msg) {
  console.log('fail ', arguments);
  var message = (msg instanceof Object) ? msg : {message: msg};

  $.growl(message, {
    type: 'danger',
    delay: 0,
    onclose: function () {
      window.close();
    }
  });

  //$('#alert').addClass('alert-danger').fadeIn(500);
  //$('[data-dismiss="alert"]').click(function () {
  //  window.close();
  //});
}

function getSessionInfo(options) {
  var result = $.Deferred();
  var session_id = options.session_id;
  //{"username": null, "user_context": {}, "db": null, "uid": null, "session_id": "3e0519cabe0f29d03d05ff07f91f5e1206ba88a8"}}
  var user_context;
  //var cached_context = window.localStorage.getItem('user_context');
  //if (cached_context != null) {
  //  user_context = JSON.parse(cached_context);
  //  // cached the user_context, and the session_id is matched
  //  if (user_context.session_id === session_id) {
  //    result.resolve(user_context);
  //  } else {
  //    user_context = null;
  //  }
  //} else {
  //  user_context = null;
  //}

  // can't find a matched user_context from cache, so we fetch it from server
  if (user_context == null) {
    var host = window.localStorage.getItem('host');

    $.ajax({
      url: host + '/web/session/get_session_info',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Cookie': 'session_id=' + session_id,
        'X-Requested-With': 'XMLHttpRequest'
      },
      data:JSON.stringify({
          "jsonrpc":"2.0",
          "method":"call",
          "params":{},
          "id": parseInt(Math.random()* 100000000000, 10)
      })
    }).done(function (data, textStatus, jqXHR) {
      if (data.error) {
        failHandler(jqXHR, {message:'Please Login to your website', url: host});
      } else if (!data.result.uid) {
        failHandler(jqXHR, {message:'Please Login to your website', url: host});
      } else {
        window.localStorage.setItem('user_context', JSON.stringify(data.result));
        result.resolve(data.result);
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        failHandler(jqXHR, {title:'Network Error: ', message: 'Can not connect to your host server!'});
    });
    
  }

  return result.promise();
}


$(document).ready(function () {

  // set growl(notification-alert) default setting
  $.growl(false, {position: 'inherit', element: '#alert', width: '100%'});

  chrome.tabs.executeScript(null, {file: "js/contentpage.js"}, function () {
    console.log('callback', arguments);
  });

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      console.log('request: ', request);
      //sendResponse({farewell: "goodbye"});
      //TODO add route to handle different messages
      $('#content').val(request.content);
  });

  $('#ideas').click(function (ev) {
    console.log('clicked!!!');
    $(this).attr('disabled', 'disabled');
    var sessionDfd = getOdooSessionId({});

    // check domain / host 
    if (!window.localStorage.getItem('domain') ) {
      var url = chrome.extension.getURL('html/config.html');
      failHandler({}, {message:'Please config the domain in <a href="#">[Option page]</a> first.', url: url});
    }

    sessionDfd.fail(function (jqXHR, textStatus, errorThrown) {
      console.log('fail can not get cookie');
      failHandler(jqXHR, {message:'Please Login to your website', url: host});
    });

    sessionDfd.done(function (data, textStatus, jqXHR) {
      //get session info
      var session_id = data;
      var contextDfd = getSessionInfo({'session_id': data});

      contextDfd.fail(function (jqXHR, textStatus, errorThrown) {
        console.log(' getSessionInfo failed!!!');
        failHandler(jqXHR, {message:'Please Login to your website', url: host});
      });

      contextDfd.done(function (data, textStatus, jqXHR) {
        console.log('context dfd done!!');
        var host = window.localStorage.getItem('host');
        var context = data;
        var text = $('#content').val();

        if (data.error) {
          failHandler(jqXHR, {message:'Please Login to your website', url: host});
        }

        var postData = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "sale.sns.record",
                "method": "create",
                "args": [{
                    "message": text,
                    "image": false,
                    "nodes": [
                        [6, false, []]
                    ]
                }],
                "kwargs": {
                    "context": {
                        "lang": context.lang,
                        "tz": context.tz,
                        "uid": context.uid,
                        "active_model": "sale.sns.record"
                    }
                }
            },
            "id": parseInt(Math.random()* 100000000000, 10)
        };

        $.ajax({
          type: 'POST',
          url: host + '/web/dataset/call_kw/sale.sns.record/create',
          contentType: 'application/json',
          headers: {
            'Cookie': 'session_id=' + session_id,
            'X-Requested-With': 'XMLHttpRequest'
          },
          data:JSON.stringify(postData)
        
        }).done(function (data, textStatus, jqXHR) {
          console.log('success', data);
          if (data.error) {
            console.log('fail', data);
            failHandler(jqXHR, {message: 'error happened, please try again'});
          } else {
            $.growl({message: 'Saved Successfully!'}, {type: 'success', onclose: function () {
              window.close();
            }});
          }
        }).fail(function (jqXHR, textStatus, errorThrown) {
          failHandler(jqXHR, {title:'Network Error: ', message: 'Can not connect to your host server!'});
        });

      });


    });

  });

});
