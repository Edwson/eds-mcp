/* SuitabilityGate — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: profile: customer suitability profile, product: product under evaluation, onPass: fn, onBlock: fn
   Data shape: { profile, suitable, reason } */
(function () {
  var root = document.getElementById('sg-root'); if (!root) return;
  var state = 'loading'; // loading | error
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'error') { /* render error */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-sg-action]'); if (!t) return;
    // handle t.getAttribute('data-sg-action'); then render();
  });
  render();
})();