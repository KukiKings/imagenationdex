/* IN$DEX shared phone normalizer. One rule for every caller of get_citizen_by_phone
 * and the citizen-exists edge function: strip non-digits, reject under ten digits.
 * Browser: window.IndxPhone.  Node: require('./phone-normalize.js').
 * Never log a phone number; log() takes only a page name and an outcome. */
(function (root) {
  var MIN_DIGITS = 10;
  function normalize(raw) {
    var d = String(raw == null ? '' : raw).replace(/\D/g, '');
    return d.length >= MIN_DIGITS ? d : null;
  }
  function forRpc(raw) { var d = normalize(raw); return d ? '+' + d : null; }
  function isNotAuthenticated(err) {
    return !!(err && typeof err.message === 'string' && err.message.indexOf('not authenticated') !== -1);
  }
  function log(page, outcome) {
    try { console.info('[indx]', page, 'get_citizen_by_phone', outcome); } catch (e) {}
  }
  var api = { MIN_DIGITS: MIN_DIGITS, normalize: normalize, forRpc: forRpc, isNotAuthenticated: isNotAuthenticated, log: log };
  root.IndxPhone = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
