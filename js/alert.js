(function ($) {

  chrome.runtime.sendMessage({
    "method": 'getErrorInfo'
  }, function (data) {
    var message = (data instanceof Object) ? data : {message: data};
    console.log('error!!!');
    $.growl(message, {
      type: 'danger',
      mouse_over: 'pause',
      z_index: 999,
      delay: 5000
    });
  });

})(jQuery);

