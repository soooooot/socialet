(function () {
  var selection = window.getSelection();
  var range = selection.getRangeAt(0);
  var container = range.commonAncestorContainer;

  chrome.runtime.sendMessage({
    "method": 'setBlogInfo',
    "bloginfo": {
      "html": container.innerHTML
    }
  });

})();

