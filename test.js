#!/usr/bin/env node
/**
 * test.js — dependency-free smoke test for the eds-mcp contract.
 *
 * Validates the data the server serves (no MCP SDK needed, so it runs in CI):
 *  - tokens are well-formed and light/dark stay in lock-step
 *  - every component is a complete CONTRACT (the metadata is the product)
 *  - every dataContract declares render states drawn from the canonical set
 *  - manifest.json is in sync with the actual file checksums  ← catches "forgot to rebuild"
 *  - the pure tool logic (search / single-token resolve / domain filter) behaves
 *
 * Usage:  node test.js   (exit 0 = pass, 1 = fail)
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));

let fails = 0;
const ok = (cond, msg) => { if (cond) { console.log('  ✓ ' + msg); } else { console.error('  ✗ ' + msg); fails++; } };

const TOKENS = load('tokens.json');
const COMPONENTS = load('components.json').components;
const MANIFEST = load('manifest.json');

console.log('tokens');
ok(typeof TOKENS.version === 'string', 'has a version');
const L = Object.keys(TOKENS.color.light), D = Object.keys(TOKENS.color.dark);
ok(L.length > 0 && L.length === D.length && L.every((k) => k in TOKENS.color.dark), 'color light/dark in lock-step (' + L.length + ' each)');
for (const g of ['space', 'radius', 'density']) ok(TOKENS[g] && Object.keys(TOKENS[g]).length > 0, g + ' group present');
ok(TOKENS.type && TOKENS.type.scale && TOKENS.type.font, 'type group has font + scale');

console.log('components');
const REQUIRED = ['purpose', 'whenToUse', 'whenNot', 'props', 'a11y', 'regulatory', 'tokens', 'dataContract', 'domain'];
const CANON = ['loading', 'empty', 'error', 'stale'];
const tokenKnown = (t) => {
  if (t.includes('.')) {
    const [g, k] = t.split('.');
    if (g === 'radius') return k in (TOKENS.radius || {});
    if (g === 'space') return k in (TOKENS.space || {});
    if (g === 'density') return k in (TOKENS.density || {});
    if (g === 'type') return k === 'mono' || k === 'font' || k in ((TOKENS.type || {}).scale || {});
    if (g === 'color') return k in TOKENS.color.light;
    return false;
  }
  return (t in TOKENS.color.light) || (t in (TOKENS.space || {})) || (t in (TOKENS.radius || {})) || ['mono', 'font'].includes(t);
};
const ids = Object.keys(COMPONENTS);
ok(ids.length >= 8, ids.length + ' components defined');
for (const [id, c] of Object.entries(COMPONENTS)) {
  const missing = REQUIRED.filter((f) => !(f in c));
  ok(missing.length === 0, id + ' has full contract' + (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));
  ok(Array.isArray(c.regulatory) && Array.isArray(c.tokens), id + ' regulatory + tokens are arrays');
  const st = (c.dataContract && c.dataContract.states) || [];
  ok(Array.isArray(st) && st.every((s) => CANON.includes(s)), id + ' dataContract states are valid (' + (st.join(', ') || 'none') + ')');
  ok((c.tokens || []).every(tokenKnown), id + ' references only known tokens (' + c.tokens.join(', ') + ')');
}
const domains = [...new Set(Object.values(COMPONENTS).map((c) => c.domain))];
ok(domains.length >= 3, 'spans ' + domains.length + ' domains: ' + domains.sort().join(', '));

console.log('manifest sync');
ok(MANIFEST.version === TOKENS.version, 'manifest version matches tokens (' + MANIFEST.version + ')');
for (const f of ['tokens.json', 'components.json']) {
  const real = createHash('sha256').update(readFileSync(join(here, f))).digest('hex');
  ok(MANIFEST.files[f] && MANIFEST.files[f].sha256 === real, f + ' checksum matches (run build:manifest if this fails)');
}
ok(MANIFEST.summary && MANIFEST.summary.components === ids.length, 'manifest component count matches (' + ids.length + ')');

console.log('tool logic');
const search = (q) => Object.entries(COMPONENTS).filter(([id, c]) => (id + ' ' + c.purpose + ' ' + (c.domain || '') + ' ' + c.regulatory.join(' ')).toLowerCase().includes(q.toLowerCase())).map(([id]) => id);
ok(search('kyc').length >= 1, 'search "kyc" finds a component');
ok(search('autonomy').includes('AutonomyTier'), 'search "autonomy" finds AutonomyTier');
ok('accent2' in TOKENS.color.light && 'accent2' in TOKENS.color.dark, 'get_token "accent2" resolves in both themes');
ok(Object.values(COMPONENTS).filter((c) => c.domain === 'data-eng').length >= 2, 'list_components domain=data-eng returns ≥2');

console.log(fails === 0 ? '\nPASS — contract is valid and in sync.' : `\nFAIL — ${fails} check(s) failed.`);
process.exit(fails === 0 ? 0 : 1);
