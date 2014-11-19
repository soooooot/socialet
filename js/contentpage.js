(function () {

  var iframe_id = 'socialet',
      old_iframe;

  console.log('content page');

  function addIframe() {
    chrome.runtime.sendMessage({method: "getIframeSrc"}, function(response) {
      console.log(response);
      var iframe = document.createElement("iframe");
      iframe.id = iframe_id;
      iframe.src = chrome.extension.getURL(response.name);
      document.body.appendChild(iframe);
    });

  }

  //delete old iframe, if exists
  old_iframe = document.getElementById(iframe_id);
  if (old_iframe) {
    old_iframe.parentNode.removeChild(old_iframe);
  }
  addIframe();


  return '233333';

})();

