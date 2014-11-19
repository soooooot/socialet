(function () {
  chrome.runtime.sendMessage({
    "method": 'setBlogInfo',
    "bloginfo": {
      "html": document.getElementsByTagName('html')[0].outerHTML
    }
  });

})();

