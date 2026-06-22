/* ReconciliationMatch — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: statementLine: object, ledgerEntry: object?, state: matched|unmatched|exception, confidence: number
   Data shape: { state, confidence, delta } */
(function () {
  var root = document.getElementById('rm-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-rm-action]'); if (!t) return;
    // handle t.getAttribute('data-rm-action'); then render();
  });
  render();
})();