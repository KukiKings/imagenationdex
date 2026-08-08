/** Honest labels until a true speaking / lip-sync intro is published */
(function () {
  function run() {
    var copy = document.querySelector('.video-copy p');
    if (copy && /Introduction for IN\$DEX/i.test(copy.textContent)) {
      copy.textContent = 'Portrait motion + voice — full speaking intro in production';
    }
    var btn = document.getElementById('videoButton');
    if (btn && /Play introduction/i.test(btn.textContent)) {
      btn.setAttribute('aria-label', 'Play SIINDEX introduction (portrait motion; speaking film updating)');
    }
    var tr = document.querySelector('#introTranscript summary');
    if (tr) tr.textContent = 'Introduction transcript (spoken lines)';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
