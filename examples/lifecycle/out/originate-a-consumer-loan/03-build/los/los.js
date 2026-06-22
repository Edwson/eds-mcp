/* LoanOriginationStepper — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: amount: number, termMonths: number, purpose: string, step: number, consentGiven: boolean
   Data shape: { amount, apr, totalRepayable, schedule, decision } */
(function () {
  var root = document.getElementById('los-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-los-action]'); if (!t) return;
    // handle t.getAttribute('data-los-action'); then render();
  });
  render();
})();