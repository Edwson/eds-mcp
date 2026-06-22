/* PaymentRailSelector — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: rails: string[], amount: number, currency: string, selected: string, urgency: standard|same-day|instant
   Data shape: { rail, etaSeconds, feeBps, cutoffTs, reversible } */
(function () {
  var root = document.getElementById('prs-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-prs-action]'); if (!t) return;
    // handle t.getAttribute('data-prs-action'); then render();
  });
  render();
})();