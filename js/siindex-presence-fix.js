/** Remove false "live avatar" navigation to Planned shell */
(function () {
  function fix() {
    var ring = document.querySelector('.portrait-ring[onclick], .portrait-ring');
    if (!ring) return;
    ring.removeAttribute('onclick');
    ring.style.cursor = 'default';
    ring.title = 'SIINDEX presence portrait — avatar layer planned, not live';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix, { once: true });
  else fix();
})();
