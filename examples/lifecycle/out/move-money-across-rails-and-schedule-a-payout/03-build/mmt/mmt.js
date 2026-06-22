/* MoneyMovementTracker — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: paymentId: string, status: initiated|hold|clearing|settled|returned, rail: string, returnCode: string?, reversibleUntil: number?
   Data shape: { status, rail, returnCode, reversibleUntil } */
(function () {
  var root = document.getElementById('mmt-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mmt-action]'); if (!t) return;
    // handle t.getAttribute('data-mmt-action'); then render();
  });
  render();
})();