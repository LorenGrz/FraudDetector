// Auto-detects the API base URL from the current page.
// Works for local dev (http://127.0.0.1:8000) and production (/prod stage on API Gateway).
(function () {
  var match = window.location.pathname.match(/^\/([^\/\.]+)\//);
  var stage = match ? '/' + match[1] : '';
  window.API_BASE = window.location.protocol + '//' + window.location.host + stage;
})();
