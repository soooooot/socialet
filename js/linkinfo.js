(function () {
  chrome.runtime.sendMessage({
    "method": 'setLinkInfo',
    "linkinfo": {
      "url": window.location.href,
      "title": document.title
    }
  });

})();

