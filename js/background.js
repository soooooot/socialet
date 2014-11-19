var socialet = {};

//socialet 
(function ($) {


  var me = {};
  
  me.init = function (options) {
    me.session_id = null;
    me.rpc_data = null;
    me.context = null;
    me.host = window.localStorage.getItem('host');
  };

  me.checkLogined = function (options) {
    var dfd = $.Deferred(),
        contextDfd = $.Deferred(),
        sessionDfd = me.getOdooSessionId();

    // check domain / host 
    if (!window.localStorage.getItem('domain') ) {
      var url = chrome.extension.getURL('html/config.html');
      dfd.reject({message:'Please config the domain in <a href="' + url + '">[Option page]</a> first.', url: url});
    }

    sessionDfd.fail(function (jqXHR, textStatus, errorThrown) {
      console.log('fail can not get cookie');
      dfd.reject({message:'Please Login to your website', url: me.host});
    });

    sessionDfd.done(function (data, textStatus, jqXHR) {
      //get session info
      var session_id = data;
      me.getSessionInfo({"session_id": data, "dfd": contextDfd });
    });

    contextDfd.fail(function (jqXHR, textStatus, errorThrown) {
      console.log('fail to get context');
      dfd.reject({message:'Website is not accessible. Please try it later.', url: me.host});
    });
    
    contextDfd.done(function (data, textStatus, jqXHR) {
      if (data.error) {
        dfd.reject({message:'Please Login to your website', url: me.host});
      }
      dfd.resolve({});
    });

    return dfd.promise();
  };

  me.getOdooSessionId = function (options) {
    var result = $.Deferred(),
        domain = window.localStorage.getItem('domain');

    chrome.cookies.getAll({
      domain: domain,
      name: 'session_id'
    }, function (cookies) { 
      if (cookies.length) {
        var session_id = cookies[0].value;
        me.session_id = session_id;
        result.resolve(cookies[0].value);
      } else {
        result.reject('');
      }
    });
    return result.promise();
  };

  me.getSessionInfo = function (options) {
    var result = options.dfd || $.Deferred(),
        session_id = me.session_id,
        host = me.host;

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
        result.reject({message:'Please Login to your website', url: host});
      } else if (!data.result.uid) {
        result.reject({message:'Please Login to your website', url: host});
      } else {
        me.context = data.result;
        result.resolve(data.result);
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        result.reject({title:'Network Error: ', message: 'Can not connect to your host server!'});
    });

    return result.promise();

  };

  me.searchRead = function (options) {
    var post;
    post = me.getRPCData({
      "model": options.model,
      "fields": [],
      "domain": [],
      //"context": {lang ,uid, tz.}
      "offset": 0,
      "limit": false,
      "sort": ""
    });

    post.params.context = post.params.kwargs.context;
    $.extend(post.params, options);
    delete post.params.kwargs;
    console.log('search read post : ', post);

    return me.rpcCall(post, {
      "url": me.host + '/web/dataset/search_read'
    });

  };
  
  me.getRPCData = function (options, kwargs) {
    var context = me.context,
        rpc_data = {
          "jsonrpc": "2.0",
          "method": "call",
          "params": {
              "kwargs": {
                  "context": {
                      "lang": context.lang,
                      "tz": context.tz,
                      "uid": context.uid,
                  }
              }
          },
          "id": parseInt(Math.random()* 100000000000, 10)
        };

    $.extend(rpc_data.params, options);
    $.extend(rpc_data.params.kwargs, kwargs);
    return rpc_data;

  };

  me.createRecord = function (params, kwargs) {
    var data = me.getRPCData(params, kwargs);
    data.params.method = 'create';
    return me.rpcCall(data);
  };

  me.rpcCall = function (rpc_data, options) {
    var dfd = $.Deferred(),
        url;
    options = options || {};
    url = options.url || me.host + '/web/dataset/call_kw/' + rpc_data.params.model + '/' + rpc_data.params.method;
    $.ajax({
      type: 'POST',
      url: url,
      contentType: 'application/json',
      headers: {
        'Cookie': 'session_id=' + me.session_id,
        'X-Requested-With': 'XMLHttpRequest'
      },
      data:JSON.stringify(rpc_data)
    }).done(function (data, textStatus, jqXHR) {
      if (data.error) {
        dfd.reject(data);
      } else {
        dfd.resolve(data.result);
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        dfd.reject({"error": textStatus});
    });

    return dfd.promise();
  };

  me.init();
  socialet.connect = me;

})(jQuery);


// socialet message -- register and handle context messages
(function ($) {
  var me = {};

  me.init = function () {
    me.selectionText = '';
    me.selectionHtml = '';
    me.func = {};

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        var func;
        console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
        console.log('request: ', request);
        if (request.method == null) {
          return false;
        } else if (request.method === 'close') {
          chrome.tabs.executeScript(null, {code: "(function () {var socialet_iframe=document.getElementById('socialet');socialet_iframe.parentNode.removeChild(socialet_iframe);})()"});
          return false;
        } else if (request.method === 'closealert') {
          chrome.tabs.executeScript(null, {code: "(function () {var soclaialert=document.getElementById('socialetalert');soclaialert.parentNode.removeChild(soclaialert);})()"});
          return false;
        }
        
        // search for proper function to handle
        func = me[request.method];
        if (func) {
          func(request).done(function (data) {
            console.log(request.method, ' send response : ', data);
            sendResponse(data);
          }).fail(function (data) {
            if (data instanceof Object && data.error == null) {
              data.error = true;
            }
            sendResponse(data);
          });
          
        }
        return true;
    });

  };

  me.getSelectionText = function (options) {
    var dfd = $.Deferred();
    dfd.resolve({"selectionText": me.selectionText});
    return dfd.promise();
  };

  me.getLinkInfo = function (options) {
    var dfd = $.Deferred();
    dfd.resolve(me.linkinfo);
    return dfd.promise();
  };

  me.setLinkInfo = function (request) {
    var dfd = $.Deferred();
    me.linkinfo = request.linkinfo;
    dfd.resolve({});
    return dfd.promise();
  };

  me.getBlogInfo = function (options) {
    var dfd = $.Deferred();
    dfd.resolve(me.bloginfo);
    return dfd.promise();
  };

  me.setBlogInfo = function (request) {
    var dfd = $.Deferred();
    me.bloginfo = request.bloginfo;
    dfd.resolve({});
    return dfd.promise();
  };

  me.getIframeSrc = function (options) {
    var dfd = $.Deferred();
    dfd.resolve({"name": me.iframeSrc});
    return dfd.promise();
  };

  me.createNoteTag = function (request) {
    var dfd = $.Deferred(),
        post = socialet.connect.getRPCData({
          "model": "note.tag",
          "method": "name_create",
          "args": [request.name]
        });
    return socialet.connect.rpcCall(post);
  };

  me.searchForTags = function (request) {
    var dfd = $.Deferred(),
        post = socialet.connect.getRPCData({
      "model": "note.tag",
      "method": "name_search",
      "args": []
    }, {
      "name": request.term,
      "args": [],
      "operator": "ilike",
      "limit": 8
    });

    socialet.connect.rpcCall(post)
    .done(function (data) {
      dfd.resolve(data);
    }).fail(function (data) {
      //failed, return empty result
      dfd.resolve({"length": 0, "result": []});
    });

    return dfd.promise();
  };

  me.getInitialStage = function (options) {
    var result = $.Deferred();

    return socialet.connect.searchRead({
      "model": 'sale.sns.stage',
      "domain": [
        ['is_sent', '=', false],
        ['is_confirmed', '=', false],
        ['is_deleted', '=', false]
      ],
      "fields": ['name']
    });
  };

  me.createRecord = function (request) {
    console.log('message handle create record');
    return socialet.connect.createRecord(request.params, request.kwargs);
  };

  me.getErrorInfo = function (request) {
    var dfd = $.Deferred();
    dfd.resolve(me.errorinfo);
    return dfd.promise();
  };


  me.createSocialRecord = function (info ,tab) {
    var options, text;
    text = info.selectionText || '';
    options = {
      "model": 'sale.sns.record',
      "args": [{
        "message": text,
        "image": false,
        "nodes": [
          [6, false, []]
        ]
      }],
    };
    socialet.connect.createRecord();
  };

  me.createBlog = function (request) {
    console.log('create blog');
    var dfd, 
        data  = socialet.connect.getRPCData({'blog_id':1, 'html': socialet.message.bloginfo.html});
    dfd = socialet.connect.rpcCall(data, {url: socialet.connect.host + '/blogpost/socialet/new'});

    dfd.done(function (data) {
      //close the iframe
      chrome.tabs.executeScript(null, {code: "(function () {var socialet_iframe=document.getElementById('socialet');socialet_iframe.parentNode.removeChild(socialet_iframe);})()"});
      // open new blog page to edit
      chrome.tabs.create({ url: socialet.connect.host + data.url });
    });

    return dfd;
  };


  me.getBlogCategory = function (options) {
    var result = $.Deferred();

    return socialet.connect.searchRead({
      "model": 'blog.blog',
      "domain": [
      ],
      "fields": ['name']
    });
  };

  me.init();
  socialet.message = me;


})(jQuery);


// socialet menu -- register and handle context menus
(function ($) {
  var me = {};

  me.addHandlers = function () {
    chrome.contextMenus.onClicked.addListener(me.onHandles);

    // entrance to create social record
    me.func.socialrecord = function (info, tab) {
      // restore selectionText
      socialet.message.selectionText = info.selectionText || '';
      socialet.message.iframeSrc = 'html/socialrecord.html';
      // execute contect script
      chrome.tabs.insertCSS(null, {file: "css/iframe.css"}, function () {
        console.log('callback iframe css ', arguments);
      });
      chrome.tabs.executeScript(null, {file: "js/contentpage.js"}, function () {
        console.log('callback executed content page', arguments);
      });
    };

    me.func.socialetnote = function (info, tab) {
      // restore selectionText
      socialet.message.selectionText = info.selectionText || '';
      socialet.message.iframeSrc = 'html/note.html';
      // execute contect script
      chrome.tabs.insertCSS(null, {file: "css/iframe.css"}, function () {
        console.log('callback iframe css ', arguments);
      });
      chrome.tabs.executeScript(null, {file: "js/contentpage.js"}, function () {
        console.log('callback executed content page', arguments);
      });
    };

    me.func.socialetlink = function (info, tab) {
      // restore selectionText
      socialet.message.selectionText = info.selectionText || '';
      socialet.message.iframeSrc = 'html/link.html';
      // execute contect script
      chrome.tabs.executeScript(null, {file: "js/linkinfo.js"}, function () {
        console.log('callback executed linkinfo', arguments);

        //import iframe
        chrome.tabs.insertCSS(null, {file: "css/iframe.css"}, function () {
          console.log('callback iframe css ', arguments);
        });
        chrome.tabs.executeScript(null, {file: "js/contentpage.js"}, function () {
          console.log('callback executed content page', arguments);
        });

      });
    };

    me.func.blog = function (info, tab, options) {
      // restore selectionText
      var options = options || {},
          jsfile;
      jsfile = options.jsfile || 'js/bloginfo.js';
      socialet.message.selectionText = info.selectionText || '';
      socialet.message.iframeSrc = 'html/blog.html';
      // execute contect script
      
      chrome.tabs.executeScript(null, {file: jsfile}, function () {
        console.log('callback executed linkinfo', arguments);

        //import iframe
        chrome.tabs.insertCSS(null, {file: "css/iframe.css"}, function () {
          console.log('callback iframe css ', arguments);
        });
        chrome.tabs.executeScript(null, {file: "js/contentpage.js"}, function () {
          console.log('callback executed content page', arguments);
        });

      });
    };

    me.func.blogselect = function (info ,tab) {
      me.func.blog(info, tab, {
        'jsfile': 'js/blogselectinfo.js'
      });
    };


  };

  // handle the context menu click events 
  me.onHandles = function (info, tab) {
    var func = me.func[info.menuItemId];
    if (func) {
      socialet.connect.checkLogined({
      }).done(function (data) {
        func(info, tab);
      }).fail(function (data) {
        console.log(' render error msg : ', data);
        socialet.message.errorinfo = data;
        chrome.tabs.insertCSS(null, {file: "css/bootstrap.min.css"}, function () {
          chrome.tabs.executeScript(null, {file: "js/libs/jquery.min.js"}, function () {
            chrome.tabs.executeScript(null, {file: "js/libs/bootstrap-growl.min.js"}, function () {
              chrome.tabs.executeScript(null, {file: "js/alert.js"}, function () {
                console.log('error show');
              });

            });

          });
        });

      });
    }
  };

  

  me.addMenus = function () {
    chrome.runtime.onInstalled.addListener(function() {
      // Create one test item for each context type.
      // var contexts = ["page","selection","link","editable","image","video", "audio"];
      chrome.contextMenus.create({
        "title": 'Add to Socializing',
        "contexts":['selection'],
        "id": "socialrecord"
      });
      chrome.contextMenus.create({
        "title": 'Add to Notes',
        "contexts":['selection'],
        "id": "socialetnote"
      });
      chrome.contextMenus.create({
        "title": 'Add to Links',
        "contexts":['page'],
        "id": "socialetlink"
      });
      chrome.contextMenus.create({
        "title": 'Add to Blogs',
        "contexts":['page'],
        "id": "blog"
      });
      chrome.contextMenus.create({
        "title": 'Add to Blogs',
        "contexts":['selection'],
        "id": "blogselect"
      });
      //me.menu_ids.push(menu_id);
    });
  };

  me.init = function () {
    me.menu_ids = [];
    me.func = {};
    me.addMenus();
    me.addHandlers();
  };

  me.init();
  socialet.menu = me;
})(jQuery);




(function () {
  console.log('socialet background start');

  //check install
  (function () {
      if (localStorage.getItem('install_time'))
          return;

      var now = new Date().getTime();
      localStorage.setItem('install_time', now);
      chrome.tabs.create({url: chrome.extension.getURL('html/config.html') });
  })();



})();
