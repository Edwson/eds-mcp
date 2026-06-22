/* MandateConsent — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: payee: string, amountCap: number?, frequency: one-off|weekly|monthly|variable, mandateId: string?, revocable: boolean
   Data shape: { mandateId, frequency, amountCap, revocable } */
(function () {
  var root = document.getElementById('mc-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mc-action]'); if (!t) return;
    // handle t.getAttribute('data-mc-action'); then render();
  });
  render();
})();