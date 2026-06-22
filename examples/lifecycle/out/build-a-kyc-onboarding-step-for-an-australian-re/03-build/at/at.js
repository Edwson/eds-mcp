/* AuditTrail — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: entries: [{ ts, actor, action, hash }], append: fn
   Data shape: { entries[], sealed } */
(function () {
  var root = document.getElementById('at-root'); if (!root) return;
  var state = 'loading'; // loading | empty | error | stale
  function render() {
      if (state === 'loading') { /* render loading */ return; }
      if (state === 'empty') { /* render empty */ return; }
      if (state === 'error') { /* render error */ return; }
      if (state === 'stale') { /* render stale */ return; }
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-at-action]'); if (!t) return;
    // handle t.getAttribute('data-at-action'); then render();
  });
  render();
})();