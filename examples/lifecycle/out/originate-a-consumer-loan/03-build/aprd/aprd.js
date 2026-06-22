/* APRDisclosure — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: apr: number, financeCharge: number, amountFinanced: number, totalOfPayments: number
   Data shape: { apr, financeCharge, amountFinanced, totalOfPayments } */
(function () {
  var root = document.getElementById('aprd-root'); if (!root) return;
  var state = 'loading'; // loading | error
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'error') { /* render error */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-aprd-action]'); if (!t) return;
    // handle t.getAttribute('data-aprd-action'); then render();
  });
  render();
})();