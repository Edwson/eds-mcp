/* RegCitation — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: rule: string (citation id), summary: string
   Data shape: { rule, summary } */
(function () {
  var root = document.getElementById('rc-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-rc-action]'); if (!t) return;
    // handle t.getAttribute('data-rc-action'); then render();
  });
  render();
})();