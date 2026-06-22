/* FxQuoteTicket — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: sendAmount: number, fromCcy: string, toCcy: string, rate: number, feeFixed: number, markupBps: number, quoteExpiresTs: number
   Data shape: { rate, markupBps, feeFixed, quoteExpiresTs } */
(function () {
  var root = document.getElementById('fqt-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-fqt-action]'); if (!t) return;
    // handle t.getAttribute('data-fqt-action'); then render();
  });
  render();
})();