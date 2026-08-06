// Detects API base URL: Lambda in production, localhost in local dev.
(function () {
  var isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  window.API_BASE = isLocal
    ? window.location.protocol + '//' + window.location.host
    : 'https://idljw8bb01.execute-api.us-east-1.amazonaws.com/prod';
})();
