#!/usr/bin/env node
/**
 * eds-mcp-server — the Edwson Design System over the Model Context Protocol.
 *
 * A thin MCP adapter over core.js (the pure engine). Same logic also imports as a
 * Node library and is exercised by the dependency-free test suite. The server turns
 * the design system into a set of callable TOOLS, readable RESOURCES, and reusable
 * PROMPTS so an agent pulls (and generates) exactly what it needs instead of having a
 * whole CSS file / screenshots pasted into context every turn.
 *
 * Why this cuts an enterprise's AI-token bill:
 *  1. TARGETED RETRIEVAL — tools return only the requested slice, not the whole system.
 *  2. REFERENCE OUTPUT — the agent emits token NAMES + component IDs, not regenerated CSS.
 *  3. GENERATION — scaffold_component returns a method-compliant skeleton, so the agent
 *     does not invent structure; lint_usage catches drift before it ships.
 *  4. FEWER LOOPS — the contract makes the agent right the first time; correction
 *     round-trips (the real cost driver) collapse toward 1.
 *
 * Every tool returns BOTH a text block and `structuredContent`. Failures set
 * `isError: true` rather than masquerading as data.
 *
 * TOOLS (23)
 *   reads:      list_token_groups · get_tokens · get_token · export_theme
 *               list_components · get_component · get_data_contract · get_decision_register
 *               search_components · find_by_regulation · recommend_component · bundle_components
 *   generate:   scaffold_component · lint_usage · scaffold_test
 *   a11y/comply: audit_accessibility · contrast_report · compliance_check · compose_flow
 *   meta:       get_manifest · diff_since · get_method · get_stats
 * RESOURCES (5) eds://tokens · eds://components · eds://manifest · eds://method · eds://regulatory
 * PROMPTS (3)   build-regulated-component · compliance-review · accessibility-audit
 *
 * Run:  npm install && node server.js   (speaks MCP over stdio). Requires Node 18+.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createCore } from './core.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));
let manifest = {};
try { manifest = load('manifest.json'); } catch { /* run build-manifest.js first */ }

const core = createCore({ tokens: load('tokens.json'), components: load('components.json'), manifest });
const VERSION = core.version;

// CLI: respond to --version / --help before opening the stdio transport.
const argv = process.argv.slice(2);
if (argv.includes('--version') || argv.includes('-v')) { process.stdout.write(VERSION + '\n'); process.exit(0); }
if (argv.includes('--help') || argv.includes('-h')) {
  process.stdout.write(
    `eds-mcp-server v${VERSION} — the Edwson Design System over MCP\n\n` +
    `Usage:\n  node server.js            speak MCP over stdio (default)\n` +
    `  node server.js --version  print version and exit\n  node server.js --help     show this help\n\n` +
    `23 tools · 5 resources · 3 prompts. Docs: https://github.com/Edwson/eds-mcp\n`);
  process.exit(0);
}
if (!manifest || !manifest.version) {
  console.error('[eds-mcp-server] warning: manifest.json missing or stale — run `npm run build:manifest`.');
}

const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], structuredContent: obj });
const err = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], structuredContent: obj, isError: true });
const respond = (obj) => (obj && obj.error ? err(obj) : ok(obj));

const server = new McpServer({ name: 'eds-mcp-server', version: VERSION });
const tool = (name, meta, fn) => server.registerTool(name, meta, async (args) => respond(fn(args || {})));

/* ───────────── TOOLS · token + theme reads ───────────── */
tool('list_token_groups',
  { title: 'List token groups', description: 'Token group names only — the cheapest way to orient before fetching values.', inputSchema: {} },
  () => core.listTokenGroups());

tool('get_tokens',
  { title: 'Get tokens', description: 'Return only the requested token group (and theme for color). Avoids shipping the whole system.', inputSchema: { group: z.string().describe('color | space | radius | type | density'), theme: z.enum(['light', 'dark']).optional() } },
  ({ group, theme }) => core.getTokens(group, theme));

tool('get_token',
  { title: 'Get one token', description: 'Resolve a single token by name (e.g. "accent2", "space.4", "radius.md") to its value(s) + canonical CSS var, theme-aware for color.', inputSchema: { name: z.string(), theme: z.enum(['light', 'dark']).optional() } },
  ({ name, theme }) => core.getToken(name, theme));

tool('export_theme',
  { title: 'Export theme', description: 'Emit the whole token set as ready-to-use css | json | scss | tailwind. Dual-theme, self-consistent with scaffold_component variable names.', inputSchema: { format: z.enum(['css', 'json', 'scss', 'tailwind']) } },
  ({ format }) => core.exportTheme(format));

/* ───────────── TOOLS · component discovery ───────────── */
tool('list_components',
  { title: 'List components', description: 'Every component id + purpose + domain + regulatory flags, optionally filtered by domain.', inputSchema: { domain: z.string().optional() } },
  ({ domain }) => core.listComponents(domain));

tool('get_component',
  { title: 'Get component contract', description: 'Full contract: purpose, props, whenToUse/whenNot, a11y, regulatory anchors, tokens, dataContract.', inputSchema: { id: z.string() } },
  ({ id }) => core.getComponent(id));

tool('get_data_contract',
  { title: 'Get data contract', description: 'The data shape + required render states (loading / empty / error / stale) for a component.', inputSchema: { id: z.string() } },
  ({ id }) => core.getDataContract(id));

tool('get_decision_register',
  { title: 'Get decision register', description: 'The four-cell register (when to use / when not & instead / behaviour & a11y / regulatory) — the line between a kit and a system.', inputSchema: { id: z.string() } },
  ({ id }) => core.getDecisionRegister(id));

tool('search_components',
  { title: 'Search components', description: 'Ranked keyword search across id, domain, regulatory, purpose, whenToUse. Returns ids + purpose + score.', inputSchema: { query: z.string() } },
  ({ query }) => core.searchComponents(query));

tool('find_by_regulation',
  { title: 'Find by regulation', description: 'Find every component that serves a given rule (e.g. "FINRA 2111", "NACHA", "SEC 17a-4"). Compliance-driven discovery.', inputSchema: { rule: z.string() } },
  ({ rule }) => core.findByRegulation(rule));

tool('recommend_component',
  { title: 'Recommend a component', description: 'Describe a use case in natural language; get ranked component recommendations, each with its whenNot warning so the agent avoids misuse.', inputSchema: { useCase: z.string(), limit: z.number().int().positive().optional() } },
  ({ useCase, limit }) => core.recommend(useCase, limit));

tool('bundle_components',
  { title: 'Bundle components', description: 'Resolve `requires` transitively and return a dependency-ordered set (deps first) plus the union of tokens + regulatory anchors. For composing a surface.', inputSchema: { ids: z.array(z.string()) } },
  ({ ids }) => core.bundle(ids));

/* ───────────── TOOLS · generation + checks ───────────── */
tool('scaffold_component',
  { title: 'Scaffold a component', description: 'Generate a paste-ready, method-compliant skeleton (ds-section HTML + scoped tokens-only CSS + delegated reduced-motion-safe JS + the four-cell register) from a component contract. The killer tool: the agent gets correct structure, not invented structure.', inputSchema: { id: z.string() } },
  ({ id }) => core.scaffoldComponent(id));

tool('lint_usage',
  { title: 'Lint a usage', description: 'Validate a proposed usage against the system: token names must resolve, render states must be canonical, and CSS must be tokens-only (no hardcoded hex/rgb, no inline styles). Returns issues by severity.', inputSchema: { tokens: z.array(z.string()).optional(), states: z.array(z.string()).optional(), css: z.string().optional() } },
  ({ tokens, states, css }) => core.lintUsage({ tokens, states, css }));

/* ───────────── TOOLS · accessibility · compliance · composition ───────────── */
tool('audit_accessibility',
  { title: 'Audit accessibility', description: 'Static accessibility audit of a component against its contract: a11y contract present, error state declared (status in words not colour alone), every colour token defined for both themes in lock-step, reduced-motion guard, regulatory anchor — plus a per-token contrast read in both themes. Verifies the contract, not a running DOM.', inputSchema: { id: z.string() } },
  ({ id }) => core.auditAccessibility(id));

tool('contrast_report',
  { title: 'Contrast report', description: 'The WCAG 2.1 contrast ladder for the token set in both themes (or one): foreground tokens over backgrounds with AA / AA-large / AAA classification and a failures list. The machine version of the Accessibility Lab contrast checker.', inputSchema: { theme: z.enum(['light', 'dark']).optional() } },
  ({ theme }) => core.contrastReport(theme));

tool('compliance_check',
  { title: 'Compliance coverage check', description: 'Map a jurisdiction (us | eu | uk | au | sg | jp | global) and optional feature keywords to the regulatory anchors and guardrail components PRESENT in this design system. A coverage map for design, not legal advice.', inputSchema: { jurisdiction: z.enum(['us', 'eu', 'uk', 'au', 'sg', 'jp', 'global']).optional(), feature: z.string().optional() } },
  ({ jurisdiction, feature }) => core.complianceCheck({ jurisdiction, feature }));

tool('compose_flow',
  { title: 'Compose a flow', description: 'Assemble a multi-component flow from a list of ids: dependency-resolved order (deps first), per-step decision register, and the union of tokens + regulatory anchors across the flow. For building a KYC / order / onboarding surface end to end.', inputSchema: { ids: z.array(z.string()), name: z.string().optional() } },
  ({ ids, name }) => core.composeFlow({ ids, name }));

tool('scaffold_test',
  { title: 'Scaffold a conformance test', description: 'Generate a dependency-free, runnable contract-conformance smoke test for a component (tokens resolve, states canonical, regulatory anchors intact, a11y contract passes, scaffold CSS tokens-only). Ships the test discipline with the component.', inputSchema: { id: z.string() } },
  ({ id }) => core.scaffoldTest(id));

/* ───────────── TOOLS · meta ───────────── */
tool('get_manifest', { title: 'Get manifest', description: 'Version + per-file SHA-256 checksums for sync verification.', inputSchema: {} }, () => core.getManifest());
tool('diff_since', { title: 'Diff since version', description: 'Given a consumer version, report whether a newer contract exists so it pulls only the delta. Auto-sync primitive.', inputSchema: { version: z.string() } }, ({ version }) => core.diffSince(version));
tool('get_method', { title: 'Get the method', description: 'The Edwson operating contract — the nine non-negotiables + verification gates that every component and scaffold satisfies. The Ed-agent in machine-readable form.', inputSchema: {} }, () => core.getMethod());
tool('get_stats', { title: 'Get system stats', description: 'System overview: version, component + domain counts, regulatory-framework coverage, token count.', inputSchema: {} }, () => core.getStats());

/* ───────────── RESOURCES (whole-file, read-only) ───────────── */
if (typeof server.registerResource === 'function') {
  const res = (uri, obj) => ({ contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }] });
  const regulatoryIndex = () => {
    const map = {};
    for (const c of core.listComponents().components) for (const r of (c.regulatory || [])) (map[r] = map[r] || []).push(c.id);
    return { version: VERSION, frameworks: Object.keys(map).sort().map((r) => ({ regulation: r, components: map[r] })) };
  };
  try {
    server.registerResource('tokens', 'eds://tokens', { title: 'Design tokens', description: 'Full token contract (color light/dark, space, radius, type, density).', mimeType: 'application/json' }, async (uri) => res(uri.href, load('tokens.json')));
    server.registerResource('components', 'eds://components', { title: 'Component index', description: 'Every component id + purpose + domain + regulatory flags.', mimeType: 'application/json' }, async (uri) => res(uri.href, core.listComponents()));
    server.registerResource('manifest', 'eds://manifest', { title: 'Sync manifest', description: 'Version + per-file SHA-256 checksums.', mimeType: 'application/json' }, async (uri) => res(uri.href, core.getManifest()));
    server.registerResource('method', 'eds://method', { title: 'The method', description: 'The nine non-negotiables + verification gates — the Ed-agent operating contract.', mimeType: 'application/json' }, async (uri) => res(uri.href, core.getMethod()));
    server.registerResource('regulatory', 'eds://regulatory', { title: 'Regulatory index', description: 'Every regulation mapped to the components that serve it.', mimeType: 'application/json' }, async (uri) => res(uri.href, regulatoryIndex()));
  } catch (e) {
    console.error('[eds-mcp-server] resources unavailable on this SDK build — tools still active:', e && e.message);
  }
}

/* ───────────── PROMPTS (reusable, contract-grounded) ───────────── */
if (typeof server.registerPrompt === 'function') {
  const msg = (text) => ({ messages: [{ role: 'user', content: { type: 'text', text } }] });
  try {
    server.registerPrompt('build-regulated-component',
      { title: 'Build a regulated component', description: 'Generate a method-compliant component from its contract.', argsSchema: { id: z.string() } },
      ({ id }) => msg(`Build the "${id}" component the Edwson way. First call get_component {id:"${id}"} and scaffold_component {id:"${id}"}, then complete the skeleton: keep every colour a token (var), one delegated listener, render once on load, status in words, reduced-motion path renders the final state. Honour the regulatory anchor in the decision register. Before finishing, call lint_usage on your tokens + CSS and fix every error.`));
    server.registerPrompt('compliance-review',
      { title: 'Compliance review', description: 'Review a surface against a regulation using the components that serve it.', argsSchema: { regulation: z.string() } },
      ({ regulation }) => msg(`Review the current design against "${regulation}". Call find_by_regulation {rule:"${regulation}"} to see which components encode it, then check the surface honours each one (the gate, the disclosure, the retention, the finality) and is jurisdiction-correct. Flag anything missing with the specific component that would close it.`));
    server.registerPrompt('accessibility-audit',
      { title: 'Accessibility audit', description: 'Audit a component against its behaviour & accessibility contract.', argsSchema: { id: z.string() } },
      ({ id }) => msg(`Audit "${id}" against its accessibility contract. Call get_decision_register {id:"${id}"} and get_method, then verify: status in words not colour alone, focus visible, keyboard-operable controls, real text kept programmatic, and the reduced-motion path renders the final state. Report each as pass/fail with the fix.`));
  } catch (e) {
    console.error('[eds-mcp-server] prompts unavailable on this SDK build — tools still active:', e && e.message);
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[eds-mcp-server] ready · v${VERSION} · 23 tools · 5 resources · 3 prompts · stdio`);
