/* AffordabilityCheck — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: income: number, obligations: number, proposedPayment: number, verdict: pass|caution|fail
   Data shape: { dti, residualIncome, verdict, reasons } */
(function () {
  var root = document.getElementById('ac-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ac-action]'); if (!t) return;
    // handle t.getAttribute('data-ac-action'); then render();
  });
  render();
})();