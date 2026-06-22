/* KycStepper — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: steps: Step[], current: number, saveResume: bool
   Data shape: { steps[], current, savedAt } */
(function () {
  var root = document.getElementById('ks-root'); if (!root) return;
  var state = 'loading'; // empty | error
  function render() {
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ks-action]'); if (!t) return;
    // handle t.getAttribute('data-ks-action'); then render();
  });
  render();
})();