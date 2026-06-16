#!/usr/bin/env node
/**
 * eds-mcp-server — Edwson Design System over the Model Context Protocol.
 *
 * Read-only. Exposes the token + component CONTRACT to any MCP-capable agent
 * (Claude Code, Codex, Cursor, …) as callable tools + resources, so an agent
 * pulls the exact slice it needs instead of having a whole CSS file / screenshots
 * pasted into its context every turn.
 *
 * Why this cuts an enterprise's AI-token bill:
 *  1. TARGETED RETRIEVAL — tools return only the requested tokens/component, not
 *     the whole system. Input tokens per request drop from ~10K (paste-the-CSS)
 *     to a few hundred.
 *  2. REFERENCE OUTPUT — the agent emits token NAMES ("--accent2") and component
 *     IDs ("OrderTicket"), not regenerated hex/CSS. Output tokens drop sharply.
 *  3. FEWER LOOPS — the contract (whenToUse / props / regulatory / dataContract)
 *     makes the agent right the first time; correction round-trips (the real cost
 *     driver) collapse toward 1.
 *  4. CACHE-FRIENDLY — outputs are deterministic and compact, so the static slice
 *     can sit behind prompt caching.
 *
 * Every tool returns BOTH a text block and `structuredContent` (the same object,
 * machine-parseable). Errors set `isError: true` rather than masquerading as data.
 *
 * Tools (all read-only):
 *   list_token_groups               -> group names (tiny)
 *   get_tokens {group, theme?}      -> only the requested token group
 *   get_token {name, theme?}        -> resolve one token by name across groups
 *   search_components {query}       -> matching ids + one-line purpose
 *   list_components {domain?}       -> every component id + purpose + domain
 *   get_component {id}              -> a single component contract
 *   get_data_contract {id}          -> the component's data shape + 4 states
 *   get_manifest                    -> version + per-file checksums
 *   diff_since {version}            -> changed file list since a version (auto-sync)
 *
 * Resources (read-only, whole-file): eds://tokens, eds://components, eds://manifest
 *
 * Run:  npm install && node server.js     (speaks MCP over stdio). Requires Node 18+.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));
const TOKENS = load('tokens.json');
const COMPONENTS = load('components.json').components;
let MANIFEST = {};
try { MANIFEST = load('manifest.json'); } catch { /* run build-manifest.js first */ }

const VERSION = TOKENS.version || '0.0.0';

const TOKEN_GROUPS = {
  color: TOKENS.color,
  space: TOKENS.space,
  radius: TOKENS.radius,
  type: TOKENS.type,
  density: TOKENS.density
};

// Every result carries text (for humans/legacy) AND structuredContent (for agents).
const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], structuredContent: obj });
const err = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], structuredContent: obj, isError: true });

// Compact, list-friendly view of one component contract.
const summarize = (id, c) => ({
  id,
  domain: c.domain || null,
  purpose: c.purpose,
  regulatory: c.regulatory || [],
  nonRemovable: !!c.nonRemovable,
  blocksAutonomousExecution: !!c.blocksAutonomousExecution,
  requires: c.requires || []
});

const server = new McpServer({ name: 'eds-mcp-server', version: VERSION });

/* ─────────────────────────── TOOLS ─────────────────────────── */

server.registerTool(
  'list_token_groups',
  { title: 'List token groups', description: 'Token group names only — the cheapest way to orient before fetching values.', inputSchema: {} },
  async () => ok({ groups: Object.keys(TOKEN_GROUPS), version: VERSION })
);

server.registerTool(
  'get_tokens',
  {
    title: 'Get tokens',
    description: 'Return only the requested token group (and theme for color). Avoids shipping the whole system.',
    inputSchema: { group: z.string().describe('color | space | radius | type | density'), theme: z.enum(['light', 'dark']).optional() }
  },
  async ({ group, theme }) => {
    const g = TOKEN_GROUPS[group];
    if (!g) return err({ error: `unknown group: ${group}`, groups: Object.keys(TOKEN_GROUPS) });
    if (group === 'color' && theme) return ok({ group, theme, tokens: g[theme] });
    return ok({ group, tokens: g });
  }
);

server.registerTool(
  'get_token',
  {
    title: 'Get one token',
    description: 'Resolve a single token by name (e.g. "accent2", "space.4", "radius.md") across every group. Returns its value(s), theme-aware for color.',
    inputSchema: { name: z.string().describe('token name, e.g. accent2 / surface / 4 / md / xl'), theme: z.enum(['light', 'dark']).optional() }
  },
  async ({ name, theme }) => {
    const key = String(name || '').replace(/^--/, '').replace(/^(color|space|radius|type|density)\./, '');
    const hits = {};
    const c = TOKENS.color || {};
    if (c.light && key in c.light) hits.color = theme ? { [theme]: (c[theme] || {})[key] } : { light: c.light[key], dark: (c.dark || {})[key] };
    if ((TOKENS.space || {})[key] !== undefined) hits.space = TOKENS.space[key];
    if ((TOKENS.radius || {})[key] !== undefined) hits.radius = TOKENS.radius[key];
    if (((TOKENS.type || {}).scale || {})[key] !== undefined) hits.type = TOKENS.type.scale[key];
    if ((TOKENS.density || {})[key] !== undefined) hits.density = TOKENS.density[key];
    if (Object.keys(hits).length === 0) return err({ error: `unknown token: ${name}`, hint: 'call list_token_groups / get_tokens to see valid names' });
    return ok({ name: key, cssVar: `--${key}`, found: hits });
  }
);

server.registerTool(
  'search_components',
  {
    title: 'Search components',
    description: 'Find components by keyword (matches id, purpose, domain, regulatory). Returns ids + one-line purpose so the agent picks without loading everything.',
    inputSchema: { query: z.string() }
  },
  async ({ query }) => {
    const q = String(query || '').toLowerCase().trim();
    const entries = Object.entries(COMPONENTS);
    const hits = (q === '' ? entries : entries.filter(([id, c]) =>
      (id + ' ' + c.purpose + ' ' + (c.domain || '') + ' ' + (c.regulatory || []).join(' ')).toLowerCase().includes(q)))
      .map(([id, c]) => ({ id, domain: c.domain || null, purpose: c.purpose }));
    return ok({ query: q, count: hits.length, results: hits });
  }
);

server.registerTool(
  'list_components',
  {
    title: 'List components',
    description: 'Every component id + purpose + domain + regulatory flags, optionally filtered by domain. Orientation without loading full contracts.',
    inputSchema: { domain: z.string().optional().describe('trading | compliance | ai | ai-cost | data-eng | ai-infra') }
  },
  async ({ domain }) => {
    const d = domain ? String(domain).toLowerCase() : null;
    const list = Object.entries(COMPONENTS)
      .filter(([, c]) => !d || (c.domain || '').toLowerCase() === d)
      .map(([id, c]) => summarize(id, c));
    const domains = [...new Set(Object.values(COMPONENTS).map((c) => c.domain).filter(Boolean))].sort();
    return ok({ domain: d, count: list.length, domains, components: list });
  }
);

server.registerTool(
  'get_component',
  { title: 'Get component contract', description: 'Full contract for one component: purpose, props, whenToUse/whenNot, a11y, regulatory anchors, tokens, dataContract.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const c = COMPONENTS[id];
    if (!c) return err({ error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) });
    return ok({ id, ...c });
  }
);

server.registerTool(
  'get_data_contract',
  { title: 'Get data contract', description: 'The data shape + required render states (loading / empty / error / stale) for a component.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const c = COMPONENTS[id];
    if (!c) return err({ error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) });
    return ok({ id, dataContract: c.dataContract || null });
  }
);

server.registerTool(
  'get_manifest',
  { title: 'Get manifest', description: 'Version + per-file SHA-256 checksums for sync verification.', inputSchema: {} },
  async () => ok(MANIFEST)
);

server.registerTool(
  'diff_since',
  {
    title: 'Diff since version',
    description: 'Given a consumer version, report whether a newer contract exists so the consumer pulls only the delta. Auto-sync primitive.',
    inputSchema: { version: z.string() }
  },
  async ({ version }) => {
    const current = MANIFEST.version || VERSION;
    return ok({
      consumerVersion: version,
      currentVersion: current,
      upToDate: version === current,
      changedFiles: version === current ? [] : Object.keys(MANIFEST.files || {}),
      checksums: MANIFEST.files || {}
    });
  }
);

/* ─────────────────────── RESOURCES (whole-file, read-only) ─────────────────────── */
// Added only if the installed SDK exposes registerResource, so tools work on any 1.x.
if (typeof server.registerResource === 'function') {
  const res = (uri, obj) => ({ contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }] });
  try {
    server.registerResource('tokens', 'eds://tokens', { title: 'Design tokens', description: 'Full token contract (color light/dark, space, radius, type, density).', mimeType: 'application/json' }, async (uri) => res(uri.href, TOKENS));
    server.registerResource('components', 'eds://components', { title: 'Component index', description: 'Every component id + purpose + domain + regulatory flags.', mimeType: 'application/json' }, async (uri) => res(uri.href, { version: VERSION, count: Object.keys(COMPONENTS).length, components: Object.entries(COMPONENTS).map(([id, c]) => summarize(id, c)) }));
    server.registerResource('manifest', 'eds://manifest', { title: 'Sync manifest', description: 'Version + per-file SHA-256 checksums.', mimeType: 'application/json' }, async (uri) => res(uri.href, MANIFEST));
  } catch (e) {
    console.error('[eds-mcp-server] resources unavailable on this SDK build — tools still active:', e && e.message);
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[eds-mcp-server] ready · v${VERSION} · ${Object.keys(COMPONENTS).length} components · read-only · stdio`);
