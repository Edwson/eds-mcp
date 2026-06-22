/* test-repayment-schedule.mjs — contract-conformance smoke test for RepaymentSchedule.
   Dependency-free: run with `node test-repayment-schedule.mjs` (adjust the import paths to your project). */
import assert from 'node:assert';
import { createCore } from 'eds-mcp/core.js';
import tokens from 'eds-mcp/tokens.json' assert { type: 'json' };
import components from 'eds-mcp/components.json' assert { type: 'json' };
import manifest from 'eds-mcp/manifest.json' assert { type: 'json' };

const core = createCore({ tokens, components, manifest });
const id = "RepaymentSchedule";
const c = core.getComponent(id);
assert.ok(!c.error, 'component resolves');

// 1. every declared token resolves in the system
for (const t of ["text1","text2","border2","surface2","radius.md","space.3"]) assert.ok(core.tokenKnown(t), 'token resolves: ' + t);
// 2. declared states are a subset of the canonical states
for (const s of ["loading","empty","error"]) assert.ok(core.CANON_STATES.includes(s), 'canonical state: ' + s);
// 3. regulated component carries its anchor(s)
assert.deepStrictEqual(c.regulatory || [], ["TILA / Reg Z 12 CFR 1026.18(g) (payment schedule)"], 'regulatory anchors intact');
// 4. static accessibility contract passes
const a = core.auditAccessibility(id);
assert.strictEqual(a.score.passed, a.score.of, 'a11y contract: ' + a.summary);
// 5. scaffold emits tokens-only CSS (no hardcoded hex outside var())
const css = core.scaffoldComponent(id).files.css.replace(/var\([^)]*\)/g, '');
assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), 'scaffold CSS is tokens-only');

console.log('PASS ' + id + ' — contract conformance');
