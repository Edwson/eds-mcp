/* SanctionsScreen — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: subject: party to screen, matches: scored hit list, threshold: number match score cutoff, onEscalate: fn
   Data shape: { matches[], score, listSource, cleared } */
(function () {
  var root = document.getElementById('ss-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ss-action]'); if (!t) return;
    // handle t.getAttribute('data-ss-action'); then render();
  });
  render();
})();