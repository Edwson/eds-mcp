#!/usr/bin/env node
/**
 * test.js — dependency-free smoke + capability test for eds-mcp.
 *
 * Validates BOTH the served data (contracts/tokens/manifest in sync) AND the pure
 * engine in core.js (search, recommend, regulation lookup, bundle, theme export,
 * lint, and scaffold). No MCP SDK needed, so it runs in CI.
 *
 * Usage:  node test.js   (exit 0 = pass, 1 = fail)
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createCore } from './core.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));

let fails = 0;
const ok = (cond, msg) => { if (cond) { console.log('  ✓ ' + msg); } else { console.error('  ✗ ' + msg); fails++; } };

const TOKENS = load('tokens.json');
const COMPONENTS = load('components.json').components;
const MANIFEST = load('manifest.json');
const core = createCore({ tokens: TOKENS, components: { components: COMPONENTS }, manifest: MANIFEST });

console.log('tokens');
ok(typeof TOKENS.version === 'string', 'has a version');
const L = Object.keys(TOKENS.color.light), D = Object.keys(TOKENS.color.dark);
ok(L.length > 0 && L.length === D.length && L.every((k) => k in TOKENS.color.dark), 'color light/dark in lock-step (' + L.length + ' each)');
for (const g of ['space', 'radius', 'density']) ok(TOKENS[g] && Object.keys(TOKENS[g]).length > 0, g + ' group present');
ok(TOKENS.type && TOKENS.type.scale && TOKENS.type.font, 'type group has font + scale');

console.log('components');
const REQUIRED = ['purpose', 'whenToUse', 'whenNot', 'props', 'a11y', 'regulatory', 'tokens', 'dataContract', 'domain'];
const CANON = core.CANON_STATES;
const ids = Object.keys(COMPONENTS);
ok(ids.length >= 8, ids.length + ' components defined');
for (const [id, c] of Object.entries(COMPONENTS)) {
  const missing = REQUIRED.filter((f) => !(f in c));
  ok(missing.length === 0, id + ' has full contract' + (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));
  ok(c.props && typeof c.props === 'object' && !Array.isArray(c.props), id + ' props is an object');
  ok(Array.isArray(c.regulatory) && Array.isArray(c.tokens), id + ' regulatory + tokens are arrays');
  const st = (c.dataContract && c.dataContract.states) || [];
  ok(Array.isArray(st) && st.every((s) => CANON.includes(s)), id + ' states valid (' + (st.join(', ') || 'none') + ')');
  ok((c.tokens || []).every((t) => core.tokenKnown(t)), id + ' references only known tokens');
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

console.log('core · tokens + theme');
ok(core.resolveToken('accent2') && core.cssVarFor('accent2') === '--accent2', 'resolve bare color token -> --accent2');
ok(core.cssVarFor('radius.md') === '--radius-md' && core.cssVarFor('space.4') === '--space-4', 'dotted tokens map to canonical css vars');
ok(core.getToken('nope-xyz').error, 'unknown token reports an error');
for (const fmt of ['css', 'json', 'scss', 'tailwind']) {
  const e = core.exportTheme(fmt);
  ok(e && !e.error && e.output, 'export_theme ' + fmt + ' produces output');
}
ok(core.exportTheme('css').output.includes(':root') && core.exportTheme('css').output.includes('[data-theme="light"]'), 'css export has both themes');
ok(core.exportTheme('tailwind').output.theme.extend.colors.accent2 === 'var(--accent2)', 'tailwind export maps colors to vars');

console.log('core · discovery');
ok(core.searchComponents('kyc').count >= 1, 'search "kyc" finds a component');
ok(core.searchComponents('autonomy').results.some((r) => r.id === 'AutonomyTier'), 'search "autonomy" finds AutonomyTier');
const s = core.searchComponents('payment'); ok(s.results.length === 0 || s.results[0].score >= s.results[s.results.length - 1].score, 'search results are ranked');
const reg = core.findByRegulation('FINRA 2111'); ok(reg.count >= 1, 'find_by_regulation "FINRA 2111" returns a component');
ok(core.recommend('place a trade order with a suitability check').count >= 1, 'recommend returns ranked candidates');
ok(core.recommend('place a trade order').recommendations.every((r) => 'whenNot' in r), 'recommendations carry whenNot warnings');

console.log('core · bundle + lint');
const someWithReq = Object.entries(COMPONENTS).find(([, c]) => (c.requires || []).some((d) => COMPONENTS[d]));
if (someWithReq) {
  const b = core.bundle([someWithReq[0]]);
  const dep = (someWithReq[1].requires || []).find((d) => COMPONENTS[d]);
  ok(b.order.indexOf(dep) < b.order.indexOf(someWithReq[0]), 'bundle orders dependencies before dependents');
} else { ok(true, 'bundle ordering (no in-set requires to test) — structure check only'); }
ok(Array.isArray(core.bundle(ids.slice(0, 2)).tokens), 'bundle returns a token union');
ok(core.lintUsage({ tokens: ['accent2', 'nope'] }).issues.some((i) => i.code === 'unknown-token'), 'lint flags an unknown token');
ok(core.lintUsage({ states: ['loading', 'wat'] }).issues.some((i) => i.code === 'bad-state'), 'lint flags a non-canonical state');
ok(core.lintUsage({ css: '.x{color:#ff0000}' }).issues.some((i) => i.code === 'hardcoded-color'), 'lint flags a hardcoded colour');
ok(core.lintUsage({ tokens: ['accent2', 'green'], states: ['loading', 'error'] }).ok === true, 'lint passes a clean usage');

console.log('core · scaffold');
const sc = core.scaffoldComponent(ids[0]);
ok(sc && sc.files && sc.files.html && sc.files.css && sc.files.js, 'scaffold returns html + css + js');
ok((sc.files.css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length === 0, 'scaffold CSS is tokens-only (zero hardcoded hex)');
ok((sc.files.html.match(/ds-logic-cell/g) || []).length === 4, 'scaffold HTML carries the four-cell decision register');
ok(/addEventListener\('click'/.test(sc.files.js) && /getElementById/.test(sc.files.js), 'scaffold JS is delegated + render-once');
ok(core.scaffoldComponent('NoSuchComponent').error, 'scaffold reports an error for an unknown id');

console.log('core · meta');
ok(core.getMethod().nonNegotiables.length === 9, 'method exposes the nine non-negotiables');
ok(core.getStats().components === ids.length && core.getStats().regulatoryFrameworks > 0, 'stats count components + regulatory frameworks');

console.log(fails === 0 ? '\nPASS — contract valid, in sync, and the engine behaves.' : `\nFAIL — ${fails} check(s) failed.`);
process.exit(fails === 0 ? 0 : 1);
