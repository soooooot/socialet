$(document).ready(function () {

  
  (function () {
    var domain = window.localStorage.getItem('domain'),
        protocol = window.localStorage.getItem('protocol');
        hasport = window.localStorage.getItem('hasport') || false;
        port = window.localStorage.getItem('port') || '80';

    $('#domain').val(domain);
    $('#protocol').val(protocol || 'http');
    $('#hasport').prop('checked', hasport);
    $('#port').val(port);

  })();

  $('#hasport').change(function (ev) {
    var checked = $(this).prop('checked'),
        $port = $('#port-div');
    if (checked) {
      $port.show();
    } else {
      $port.hide();
    }
  }).trigger('change');


  $('#save').click(function () {

    var domain = $('#domain').val(),
        protocol = $('#protocol').val(),
        hasport =  $('#hasport').prop('checked') || false,
        port = $('#port').val(),
        host; 
    if (hasport) {
      host = protocol + '://' + domain + ':' + port;
    } else {
      host = protocol + '://' + domain;
    }

    //window.localStorage.removeItem('domain');
    //window.localStorage.removeItem('protocol');
    //window.localStorage.removeItem('hasport');
    //window.localStorage.removeItem('port');
    //window.localStorage.removeItem('host');

    window.localStorage.setItem('domain', domain);
    window.localStorage.setItem('protocol', protocol);
    if (hasport) {
      window.localStorage.setItem('hasport', true);
    } else {
      window.localStorage.removeItem('hasport');
    }
    window.localStorage.setItem('port', port || '80');
    window.localStorage.setItem('host', host);

    $('#modal').one('hidden.bs.modal', function (ev) {
      window.close();
    });
    $('#modal').modal('show');
    //$('#tip').show(1000, function () {
    //  $('#tip').hide();
    //});
    
  });


});
