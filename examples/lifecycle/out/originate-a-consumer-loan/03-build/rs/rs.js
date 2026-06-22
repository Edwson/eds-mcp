/* RepaymentSchedule — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: schedule: array, currency: string, highlightRow: number?
   Data shape: { rows:[{ n, principal, interest, balance }] } */
(function () {
  var root = document.getElementById('rs-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-rs-action]'); if (!t) return;
    // handle t.getAttribute('data-rs-action'); then render();
  });
  render();
})();