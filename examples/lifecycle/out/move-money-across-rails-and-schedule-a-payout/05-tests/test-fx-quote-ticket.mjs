/* test-fx-quote-ticket.mjs — contract-conformance smoke test for FxQuoteTicket.
   Dependency-free: run with `node test-fx-quote-ticket.mjs` (adjust the import paths to your project). */
import assert from 'node:assert';
import { createCore } from 'eds-mcp/core.js';
import tokens from 'eds-mcp/tokens.json' assert { type: 'json' };
import components from 'eds-mcp/components.json' assert { type: 'json' };
import manifest from 'eds-mcp/manifest.json' assert { type: 'json' };

const core = createCore({ tokens, components, manifest });
const id = "FxQuoteTicket";
const c = core.getComponent(id);
assert.ok(!c.error, 'component resolves');

// 1. every declared token resolves in the system
for (const t of ["accent","text1","text2","text3","border","radius.md","space.4"]) assert.ok(core.tokenKnown(t), 'token resolves: ' + t);
// 2. declared states are a subset of the canonical states
for (const s of ["loading","empty","error","stale"]) assert.ok(core.CANON_STATES.includes(s), 'canonical state: ' + s);
// 3. regulated component carries its anchor(s)
assert.deepStrictEqual(c.regulatory || [], ["Reg E remittance rule (12 CFR 1005 Subpart B)","Consumer FX transparency (mid-market disclosure)","PSD2 (EEA payment transparency)"], 'regulatory anchors intact');
// 4. static accessibility contract passes
const a = core.auditAccessibility(id);
assert.strictEqual(a.score.passed, a.score.of, 'a11y contract: ' + a.summary);
// 5. scaffold emits tokens-only CSS (no hardcoded hex outside var())
const css = core.scaffoldComponent(id).files.css.replace(/var\([^)]*\)/g, '');
assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), 'scaffold CSS is tokens-only');

console.log('PASS ' + id + ' — contract conformance');
