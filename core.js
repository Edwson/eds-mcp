/**
 * core.js — the Edwson Design System engine.
 *
 * Pure, dependency-free, and transport-agnostic. `createCore({tokens, components,
 * manifest})` returns the whole capability surface as plain functions over injected
 * data — so the SAME logic powers the MCP server (server.js), a Node library import,
 * a CLI, or the test suite (test.js) with zero SDK dependency.
 *
 * Every method returns a plain, JSON-serialisable object. Methods that can fail
 * return an object with an `error` string (never throw across the boundary), so the
 * MCP adapter can map `.error` to `isError: true` and a library caller can branch on it.
 *
 * Canonical CSS custom-property naming (used by exportTheme AND scaffold, so the two
 * are always self-consistent):
 *   color    <name>      -> --<name>          (e.g. accent2 -> --accent2)
 *   space    <n>         -> --space-<n>
 *   radius   <k>         -> --radius-<k>
 *   type     mono|font   -> --type-mono | --type-font
 *   type.scale <k>       -> --text-<k>
 *   density  <k>         -> --density-<k>
 */

const CANON_STATES = ['loading', 'empty', 'error', 'stale'];

const NON_NEGOTIABLES = [
  'Tokens-first, dual-theme — every colour/space/radius/font from a CSS variable defined for light and dark in lock-step; no hardcoded hex outside a self-contained SVG.',
  'Scoped prefix per component group; reuse a sibling group’s classes when the components are one visual family.',
  'Delegated vanilla JS — one document listener routed by closest(); render once on load; never bind per element at parse time; never measure hidden nodes.',
  'Reduced-motion safe — render the final state instantly under prefers-reduced-motion; no information in motion alone.',
  'Screen-reader safe — real text kept programmatic, animated copies aria-hidden; status in words, not colour alone.',
  'A specific, accurate, jurisdiction-correct regulatory anchor on every regulated component.',
  'The four-cell decision register on every component (when to use / when not & instead / behaviour & a11y contract / regulatory anchor).',
  'Honest framing — label estimates/illustrative values; never describe your own work in a competitor product’s brand terms.',
  'No inline styles except dynamically-rendered CSS custom properties.'
];

const VERIFICATION_GATES = [
  'node --check every inline script.',
  'Tokens only: zero hardcoded colours outside SVG.',
  'Both themes defined in lock-step.',
  'Tag balance for div/section/script/style.',
  'Any JSON-LD / JSON contract parses; the contract test passes.',
  'a11y: status in words, focus visible, reduced-motion path renders final state.',
  'Single-file count sync: update every visible count + changelog, but never rewrite historical numbers.'
];

function kebab(s) {
  return String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[_\s]+/g, '-').toLowerCase();
}
function shortPrefix(id) {
  const caps = String(id).replace(/[^A-Z]/g, '').toLowerCase();
  if (caps.length >= 2) return caps.slice(0, 4);
  return kebab(id).replace(/-/g, '').slice(0, 3) || 'cmp';
}
function escHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9+]+/).filter((w) => w.length > 2);
}

export function createCore(data) {
  const TOKENS = data.tokens || {};
  const COMPONENTS = (data.components && data.components.components) || data.components || {};
  const MANIFEST = data.manifest || {};
  const VERSION = TOKENS.version || (data.manifest && data.manifest.version) || '0.0.0';

  const TOKEN_GROUPS = {
    color: TOKENS.color, space: TOKENS.space, radius: TOKENS.radius, type: TOKENS.type, density: TOKENS.density
  };

  /* ---------- token resolution ---------- */
  function stripName(name) {
    return String(name || '').replace(/^--/, '');
  }
  // Resolve a token (bare or dotted) to { group, value (theme-aware for color) } or null.
  function resolveToken(name, theme) {
    let key = stripName(name);
    let group = null;
    if (key.includes('.')) { const [g, k] = key.split('.'); group = g; key = k; }
    const color = TOKENS.color || {};
    if ((!group || group === 'color') && color.light && key in color.light) {
      return { group: 'color', name: key, value: theme ? { [theme]: (color[theme] || {})[key] } : { light: color.light[key], dark: (color.dark || {})[key] } };
    }
    if ((!group || group === 'space') && (TOKENS.space || {})[key] !== undefined) return { group: 'space', name: key, value: TOKENS.space[key] };
    if ((!group || group === 'radius') && (TOKENS.radius || {})[key] !== undefined) return { group: 'radius', name: key, value: TOKENS.radius[key] };
    if ((!group || group === 'density') && (TOKENS.density || {})[key] !== undefined) return { group: 'density', name: key, value: TOKENS.density[key] };
    if (!group || group === 'type') {
      if (key === 'mono' || key === 'font') return { group: 'type', name: key, value: (TOKENS.type || {})[key] };
      if (((TOKENS.type || {}).scale || {})[key] !== undefined) return { group: 'type', name: key, value: TOKENS.type.scale[key] };
    }
    return null;
  }
  function tokenKnown(name) { return resolveToken(name) !== null; }
  // Canonical CSS var name for a token (bare or dotted).
  function cssVarFor(name) {
    const r = resolveToken(name);
    if (!r) return null;
    if (r.group === 'color') return `--${r.name}`;
    if (r.group === 'space') return `--space-${r.name}`;
    if (r.group === 'radius') return `--radius-${r.name}`;
    if (r.group === 'density') return `--density-${r.name}`;
    if (r.group === 'type') return (r.name === 'mono' || r.name === 'font') ? `--type-${r.name}` : `--text-${r.name}`;
    return `--${r.name}`;
  }

  /* ---------- token reads ---------- */
  function listTokenGroups() { return { groups: Object.keys(TOKEN_GROUPS), version: VERSION }; }
  function getTokens(group, theme) {
    const g = TOKEN_GROUPS[group];
    if (!g) return { error: `unknown group: ${group}`, groups: Object.keys(TOKEN_GROUPS) };
    if (group === 'color' && theme) return { group, theme, tokens: g[theme] };
    return { group, tokens: g };
  }
  function getToken(name, theme) {
    const r = resolveToken(name, theme);
    if (!r) return { error: `unknown token: ${name}`, hint: 'call list_token_groups / get_tokens for valid names' };
    return { name: r.name, group: r.group, cssVar: cssVarFor(name), value: r.value };
  }

  /* ---------- theme export ---------- */
  function exportTheme(format) {
    const fmt = (format || 'css').toLowerCase();
    const color = TOKENS.color || {}; const light = color.light || {}; const dark = color.dark || {};
    const flatVars = (theme) => {
      const out = {};
      const c = theme === 'light' ? light : dark;
      for (const k in c) out[`--${k}`] = c[k];
      return out;
    };
    const structural = () => {
      const out = {};
      for (const k in (TOKENS.space || {})) out[`--space-${k}`] = TOKENS.space[k];
      for (const k in (TOKENS.radius || {})) out[`--radius-${k}`] = TOKENS.radius[k];
      for (const k in (TOKENS.density || {})) out[`--density-${k}`] = TOKENS.density[k];
      if ((TOKENS.type || {}).mono) out['--type-mono'] = TOKENS.type.mono;
      if ((TOKENS.type || {}).font) out['--type-font'] = TOKENS.type.font;
      for (const k in ((TOKENS.type || {}).scale || {})) out[`--text-${k}`] = TOKENS.type.scale[k];
      return out;
    };
    if (fmt === 'json') {
      return { format: 'json', output: { dark: { ...flatVars('dark'), ...structural() }, light: flatVars('light') } };
    }
    if (fmt === 'css') {
      const root = { ...flatVars('dark'), ...structural() };
      const body = (o) => Object.entries(o).map(([k, v]) => `  ${k}: ${v};`).join('\n');
      const out = `:root {\n${body(root)}\n}\n[data-theme="light"] {\n${body(flatVars('light'))}\n}\n`;
      return { format: 'css', output: out };
    }
    if (fmt === 'scss') {
      const sass = (o) => Object.entries(o).map(([k, v]) => `$${k.replace(/^--/, '')}: ${v};`).join('\n');
      const out = `// dark (default)\n${sass({ ...flatVars('dark'), ...structural() })}\n\n// light\n${sass(flatVars('light'))}`;
      return { format: 'scss', output: out };
    }
    if (fmt === 'tailwind') {
      const colorObj = {}; for (const k in dark) colorObj[k] = `var(--${k})`;
      const spacing = {}; for (const k in (TOKENS.space || {})) spacing[k] = `var(--space-${k})`;
      const radius = {}; for (const k in (TOKENS.radius || {})) radius[k] = `var(--radius-${k})`;
      const fontSize = {}; for (const k in ((TOKENS.type || {}).scale || {})) fontSize[k] = `var(--text-${k})`;
      const cfg = { theme: { extend: { colors: colorObj, spacing, borderRadius: radius, fontSize } } };
      return { format: 'tailwind', output: cfg };
    }
    return { error: `unknown format: ${format}`, formats: ['css', 'json', 'scss', 'tailwind'] };
  }

  /* ---------- components ---------- */
  function summarize(id, c) {
    return { id, domain: c.domain || null, purpose: c.purpose, regulatory: c.regulatory || [], nonRemovable: !!c.nonRemovable, requires: c.requires || [] };
  }
  function domainCounts() {
    const out = {};
    for (const c of Object.values(COMPONENTS)) { const d = c.domain || 'unknown'; out[d] = (out[d] || 0) + 1; }
    return out;
  }
  function listComponents(domain) {
    const d = domain ? String(domain).toLowerCase() : null;
    const list = Object.entries(COMPONENTS).filter(([, c]) => !d || (c.domain || '').toLowerCase() === d).map(([id, c]) => summarize(id, c));
    return { domain: d, count: list.length, domains: Object.keys(domainCounts()).sort(), components: list };
  }
  function getComponent(id) {
    const c = COMPONENTS[id];
    if (!c) return { error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) };
    return { id, ...c };
  }
  function getDataContract(id) {
    const c = COMPONENTS[id];
    if (!c) return { error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) };
    return { id, dataContract: c.dataContract || null };
  }
  function getDecisionRegister(id) {
    const c = COMPONENTS[id];
    if (!c) return { error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) };
    return { id, register: { whenToUse: c.whenToUse || null, whenNot: c.whenNot || null, behaviourAndA11y: c.a11y || null, regulatory: c.regulatory || [] } };
  }
  // Ranked search: id match > domain/regulatory > purpose.
  function searchComponents(query) {
    const q = String(query || '').toLowerCase().trim();
    const entries = Object.entries(COMPONENTS);
    if (q === '') return { query: q, count: entries.length, results: entries.map(([id, c]) => ({ id, domain: c.domain || null, purpose: c.purpose, score: 0 })) };
    const scored = [];
    for (const [id, c] of entries) {
      let s = 0;
      if (id.toLowerCase().includes(q)) s += 5;
      if ((c.domain || '').toLowerCase().includes(q)) s += 3;
      if ((c.regulatory || []).join(' ').toLowerCase().includes(q)) s += 3;
      if ((c.purpose || '').toLowerCase().includes(q)) s += 2;
      if ((c.whenToUse || '').toLowerCase().includes(q)) s += 1;
      if (s > 0) scored.push({ id, domain: c.domain || null, purpose: c.purpose, score: s });
    }
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return { query: q, count: scored.length, results: scored };
  }
  function findByRegulation(rule) {
    const r = String(rule || '').toLowerCase().trim();
    if (!r) return { error: 'provide a regulation, e.g. "FINRA 2111" or "NACHA"' };
    const hits = Object.entries(COMPONENTS)
      .filter(([, c]) => (c.regulatory || []).some((x) => x.toLowerCase().includes(r)))
      .map(([id, c]) => ({ id, domain: c.domain || null, purpose: c.purpose, regulatory: (c.regulatory || []).filter((x) => x.toLowerCase().includes(r)) }));
    return { rule, count: hits.length, results: hits };
  }
  function recommend(useCase, limit) {
    const words = tokenize(useCase);
    if (!words.length) return { error: 'describe a use case, e.g. "let a user place an order with a suitability check"' };
    const scored = [];
    for (const [id, c] of Object.entries(COMPONENTS)) {
      const hay = (id + ' ' + (c.purpose || '') + ' ' + (c.domain || '') + ' ' + (c.whenToUse || '') + ' ' + (c.regulatory || []).join(' ')).toLowerCase();
      let s = 0; for (const w of words) if (hay.includes(w)) s += 1;
      if (s > 0) scored.push({ id, domain: c.domain || null, purpose: c.purpose, whenToUse: c.whenToUse || null, whenNot: c.whenNot || null, regulatory: c.regulatory || [], match: s });
    }
    scored.sort((a, b) => b.match - a.match || a.id.localeCompare(b.id));
    return { useCase, count: scored.length, recommendations: scored.slice(0, limit || 5) };
  }

  /* ---------- bundle: resolve requires transitively, deps first ---------- */
  function bundle(ids) {
    const want = Array.isArray(ids) ? ids : [ids];
    const missing = []; const order = []; const seen = new Set(); const visiting = new Set();
    function visit(id) {
      if (seen.has(id)) return;
      if (!COMPONENTS[id]) { if (!missing.includes(id)) missing.push(id); return; }
      if (visiting.has(id)) return; // cycle guard
      visiting.add(id);
      for (const dep of (COMPONENTS[id].requires || [])) visit(dep);
      visiting.delete(id); seen.add(id); order.push(id);
    }
    for (const id of want) visit(id);
    const tokens = [...new Set(order.flatMap((id) => COMPONENTS[id].tokens || []))].sort();
    const regulatory = [...new Set(order.flatMap((id) => COMPONENTS[id].regulatory || []))];
    return { requested: want, order, missing, tokens, regulatory, count: order.length };
  }

  /* ---------- lint a proposed usage against the contract ---------- */
  function lintUsage(input) {
    const issues = [];
    const add = (severity, code, message) => issues.push({ severity, code, message });
    const inTokens = (input && input.tokens) || [];
    for (const t of inTokens) if (!tokenKnown(t)) add('error', 'unknown-token', `token "${t}" does not resolve in the system`);
    const inStates = (input && input.states) || [];
    for (const s of inStates) if (!CANON_STATES.includes(s)) add('error', 'bad-state', `state "${s}" is not one of ${CANON_STATES.join(', ')}`);
    const css = (input && input.css) || '';
    if (css) {
      const noVars = css.replace(/var\([^)]*\)/g, '');
      const hex = (noVars.match(/#[0-9a-fA-F]{3,8}\b/g) || []);
      const rgb = (noVars.match(/\b(rgb|rgba|hsl|hsla)\(/g) || []);
      for (const h of hex) add('warn', 'hardcoded-color', `hardcoded colour ${h} — use a token via var(--…) instead`);
      if (rgb.length) add('warn', 'hardcoded-color', `${rgb.length} hardcoded ${rgb[0]}… colour(s) — prefer a token`);
      if (/\sstyle\s*=\s*"/.test(css)) add('warn', 'inline-style', 'inline style attribute found — move to a scoped class');
    }
    return { ok: issues.filter((i) => i.severity === 'error').length === 0, issues };
  }

  /* ---------- scaffold: a method-compliant skeleton from the contract ---------- */
  function scaffoldComponent(id) {
    const c = COMPONENTS[id];
    if (!c) return { error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) };
    const px = shortPrefix(id);
    const sid = kebab(id);
    const title = (c.purpose || id).replace(/\.$/, '').replace(/^[a-z]/, (m) => m.toUpperCase());
    const usedTokens = (c.tokens || []).filter(tokenKnown);
    const v = (t) => `var(${cssVarFor(t)})`;
    const colTokens = usedTokens.filter((t) => resolveToken(t).group === 'color');
    const text1 = colTokens.includes('text1') ? 'text1' : (colTokens[0] || 'text1');
    const surface = colTokens.includes('surface2') ? 'surface2' : (colTokens.includes('surface') ? 'surface' : 'surface2');
    const border = colTokens.includes('border') ? 'border' : 'border';
    const radius = (c.tokens || []).find((t) => t.startsWith('radius.')) || 'radius.md';
    const space = (c.tokens || []).find((t) => t.startsWith('space.')) || 'space.4';
    const states = ((c.dataContract || {}).states) || [];
    const props = c.props || {};

    const html =
`<section class="ds-section" id="sec-${sid}">
  <h2 class="ds-section-title">${escHtml(title)}</h2>
  <p class="ds-section-subtitle">${escHtml(c.purpose || '')}</p>
  <!-- Decision register (the line between a kit and a system) -->
  <div class="ds-logic">
    <div class="ds-logic-cell"><span class="ds-logic-k">When to use</span><p>${escHtml(c.whenToUse || '')}</p></div>
    <div class="ds-logic-cell"><span class="ds-logic-k">When not to / use instead</span><p>${escHtml(c.whenNot || '')}</p></div>
    <div class="ds-logic-cell"><span class="ds-logic-k">Behaviour &amp; accessibility contract</span><p>${escHtml(c.a11y || '')}</p></div>
    <div class="ds-logic-cell"><span class="ds-logic-k">Regulatory anchor</span><p>${escHtml((c.regulatory || []).join(' · '))}</p></div>
  </div>
  <div class="ds-preview"><div class="ds-preview-header">Live · ${escHtml(id)}</div>
    <div class="ds-preview-body" style="padding:20px;display:block;">
      <div class="${px}-wrap" id="${px}-root" aria-live="polite"><!-- rendered by ${px}Init() --></div>
    </div>
  </div>
</section>`;

    const css =
`/* scoped to .${px}- · tokens only · dual-theme via the system variables */
.${px}-wrap{font-family:${v('font')};color:${v(text1)}}
.${px}-panel{background:${v(surface)};border:1px solid ${v(border)};border-radius:${v(radius)};padding:${v(space)}}
.${px}-status{font-family:${v('mono')};font-size:12px}
@media (prefers-reduced-motion: reduce){.${px}-wrap *{animation:none !important;transition:none !important}}`;

    const propList = Object.keys(props).map((k) => `${k}: ${props[k]}`).join(', ');
    const stateBranches = (states.length ? states : CANON_STATES).map((s) => `      if (state === '${s}') { /* render ${s} */ return; }`).join('\n');
    const js =
`/* ${id} — delegated, render-once-on-load, reduced-motion + screen-reader safe.
   Props: ${propList || '(none declared)'}
   Data shape: ${(c.dataContract || {}).shape || '(none)'} */
(function () {
  var root = document.getElementById('${px}-root'); if (!root) return;
  var state = 'loading'; // ${(states.length ? states : CANON_STATES).join(' | ')}
  function render() {
${stateBranches}
    // default / ready render here — status in words, never colour alone
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-${px}-action]'); if (!t) return;
    // handle t.getAttribute('data-${px}-action'); then render();
  });
  render();
})();`;

    return {
      id, prefix: px, sectionId: `sec-${sid}`, tokensUsed: usedTokens, states,
      regulatory: c.regulatory || [], requires: c.requires || [],
      files: { html, css, js },
      notes: 'Skeleton follows the Edwson method: tokens-only dual-theme, scoped prefix, delegated JS, reduced-motion + SR safe, four-cell register. Fill the render branches and wire the declared props; keep every colour as a token (var).'
    };
  }

  /* ---------- meta ---------- */
  function getManifest() { return MANIFEST; }
  function diffSince(version) {
    const current = MANIFEST.version || VERSION;
    return { consumerVersion: version, currentVersion: current, upToDate: version === current, changedFiles: version === current ? [] : Object.keys(MANIFEST.files || {}), checksums: MANIFEST.files || {} };
  }
  function getMethod() {
    return { version: VERSION, nonNegotiables: NON_NEGOTIABLES, verificationGates: VERIFICATION_GATES, canonicalStates: CANON_STATES,
      note: 'The operating contract behind every component. scaffold_component emits skeletons that already satisfy these; lint_usage checks a proposed usage against them.' };
  }
  function getStats() {
    const reg = [...new Set(Object.values(COMPONENTS).flatMap((c) => c.regulatory || []))];
    const tokenCount = Object.keys(TOKENS.color ? TOKENS.color.light || {} : {}).length * 2
      + Object.keys(TOKENS.space || {}).length + Object.keys(TOKENS.radius || {}).length
      + Object.keys((TOKENS.type || {}).scale || {}).length + Object.keys(TOKENS.density || {}).length;
    return { version: VERSION, components: Object.keys(COMPONENTS).length, domains: domainCounts(),
      regulatoryFrameworks: reg.length, tokens: tokenCount, canonicalStates: CANON_STATES };
  }

  return {
    version: VERSION, CANON_STATES,
    // tokens
    listTokenGroups, getTokens, getToken, resolveToken, tokenKnown, cssVarFor, exportTheme,
    // components
    listComponents, getComponent, getDataContract, getDecisionRegister, searchComponents, findByRegulation, recommend, bundle, summarize, domainCounts,
    // generation + checks
    scaffoldComponent, lintUsage,
    // meta
    getManifest, diffSince, getMethod, getStats
  };
}

export { CANON_STATES, NON_NEGOTIABLES, VERIFICATION_GATES };
