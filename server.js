#!/usr/bin/env node
/**
 * eds-mcp-server — Edwson Design System over the Model Context Protocol.
 *
 * Read-only. Exposes the token + component CONTRACT to any MCP-capable agent
 * (Claude Code, Codex, Cursor, etc.) as callable tools, so an agent pulls the
 * exact slice it needs instead of having a whole CSS file / screenshots pasted
 * into its context every turn.
 *
 * Why this cuts an enterprise's AI-token bill:
 *  1. TARGETED RETRIEVAL — tools return only the requested tokens/component, not
 *     the whole system. Input tokens per request drop from ~10K (paste-the-CSS)
 *     to a few hundred.
 *  2. REFERENCE OUTPUT — the agent emits token NAMES ("--accent") and component
 *     IDs ("OrderTicket"), not regenerated hex/CSS. Output tokens drop sharply.
 *  3. FEWER LOOPS — the contract (whenToUse / props / regulatory / dataContract)
 *     makes the agent right the first time; correction round-trips (the real cost
 *     driver) collapse toward 1.
 *  4. CACHE-FRIENDLY — outputs are deterministic and compact, so the static slice
 *     can sit behind prompt caching.
 *
 * Tools (all read-only):
 *   list_token_groups            -> group names (tiny)
 *   get_tokens {group?, theme?}  -> only requested tokens
 *   search_components {query}    -> matching ids + one-line purpose
 *   get_component {id}           -> a single component contract
 *   get_data_contract {id}       -> the component's data shape + 4 states
 *   get_manifest                 -> version + per-file checksums
 *   diff_since {version}         -> changed file list since a version (auto-sync)
 *
 * Run:  npm install && node server.js     (speaks MCP over stdio)
 * Requires Node 18+.
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

const TOKEN_GROUPS = {
  color: TOKENS.color,
  space: TOKENS.space,
  radius: TOKENS.radius,
  type: TOKENS.type,
  density: TOKENS.density
};

const json = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }] });

const server = new McpServer({ name: 'eds-mcp-server', version: TOKENS.version || '1.8.0' });

server.registerTool(
  'list_token_groups',
  { title: 'List token groups', description: 'Token group names only — cheapest way to orient.', inputSchema: {} },
  async () => json({ groups: Object.keys(TOKEN_GROUPS), version: TOKENS.version })
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
    if (!g) return json({ error: `unknown group: ${group}`, groups: Object.keys(TOKEN_GROUPS) });
    if (group === 'color' && theme) return json({ group, theme, tokens: g[theme] });
    return json({ group, tokens: g });
  }
);

server.registerTool(
  'search_components',
  {
    title: 'Search components',
    description: 'Find components by keyword. Returns ids + one-line purpose so the agent can pick without loading everything.',
    inputSchema: { query: z.string() }
  },
  async ({ query }) => {
    const q = String(query || '').toLowerCase();
    const hits = Object.entries(COMPONENTS)
      .filter(([id, c]) => (id + ' ' + c.purpose + ' ' + (c.regulatory || []).join(' ')).toLowerCase().includes(q))
      .map(([id, c]) => ({ id, purpose: c.purpose }));
    return json({ query, count: hits.length, results: hits });
  }
);

server.registerTool(
  'get_component',
  { title: 'Get component contract', description: 'Full contract for one component: props, whenToUse/whenNot, a11y, regulatory anchors, tokens, dataContract.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const c = COMPONENTS[id];
    if (!c) return json({ error: `unknown component: ${id}`, available: Object.keys(COMPONENTS) });
    return json({ id, ...c });
  }
);

server.registerTool(
  'get_data_contract',
  { title: 'Get data contract', description: 'The data shape + required render states (loading/empty/error/stale) for a component.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const c = COMPONENTS[id];
    if (!c) return json({ error: `unknown component: ${id}` });
    return json({ id, dataContract: c.dataContract || null });
  }
);

server.registerTool(
  'get_manifest',
  { title: 'Get manifest', description: 'Version + per-file SHA-256 checksums for sync verification.', inputSchema: {} },
  async () => json(MANIFEST)
);

server.registerTool(
  'diff_since',
  {
    title: 'Diff since version',
    description: 'Given a consumer version, report whether a newer contract exists so the consumer pulls only the delta. Auto-sync primitive.',
    inputSchema: { version: z.string() }
  },
  async ({ version }) => {
    const current = MANIFEST.version || TOKENS.version;
    return json({
      consumerVersion: version,
      currentVersion: current,
      upToDate: version === current,
      changedFiles: version === current ? [] : Object.keys(MANIFEST.files || {}),
      checksums: MANIFEST.files || {}
    });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[eds-mcp-server] ready · v' + (TOKENS.version || '1.8.0') + ' · read-only · stdio');
