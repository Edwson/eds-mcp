#!/usr/bin/env node
/**
 * eds-mcp HTTP API — the same engine (core.js) exposed over plain HTTP + JSON.
 *
 * Why this exists: the MCP server (server.js) is for AI agents that speak the
 * Model Context Protocol. This HTTP API is for *everyone else* — any language, any
 * tool, curl, Postman, a browser, a CI job, a serverless function. Same contracts,
 * same answers, no MCP client required.
 *
 * Zero runtime dependencies: it uses only Node built-ins + the bundled JSON, so it
 * runs straight from a clone with NO `npm install`:
 *     node http.js                 # serves on $PORT (default 8787)
 * CORS is open so web apps can call it directly, and /openapi.json is a full spec
 * you can load into Swagger / Postman / an API client.
 *
 * Requires Node 18+.
 */
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { loadCore } from './loadCore.js';

const core = loadCore();
const VERSION = core.version;

/* ------------------------------------------------------------------ *
 * Route table — single source of truth for routing, the index, and OpenAPI.
 * call: (core, { params, query, body }) => result   (result may carry { error })
 * ------------------------------------------------------------------ */
const ROUTES = [
  { method: 'GET',  path: '/health',                       summary: 'Liveness + a one-line system summary.',
    call: () => ({ ok: true, version: VERSION, ...core.getStats() }) },
  { method: 'GET',  path: '/v1/method',                    summary: 'The operating contract: non-negotiables, verification gates, canonical states.',
    call: () => core.getMethod() },
  { method: 'GET',  path: '/v1/stats',                     summary: 'Counts: components, domains, regulatory frameworks, tokens.',
    call: () => core.getStats() },
  { method: 'GET',  path: '/v1/manifest',                  summary: 'The build manifest (version + per-file checksums).',
    call: () => core.getManifest() },
  { method: 'GET',  path: '/v1/diff/{version}',            summary: 'What changed since a consumer’s pinned version.',
    call: (c, x) => core.diffSince(x.params.version) },

  { method: 'GET',  path: '/v1/tokens',                    summary: 'List token groups (color, space, radius, type, density).',
    call: () => core.listTokenGroups() },
  { method: 'GET',  path: '/v1/tokens/{group}',            summary: 'All tokens in a group. ?theme=light|dark for colour.',
    call: (c, x) => core.getTokens(x.params.group, x.query.get('theme') || undefined) },
  { method: 'GET',  path: '/v1/token/{name}',              summary: 'Resolve a single token to its CSS var + value. ?theme= optional.',
    call: (c, x) => core.getToken(x.params.name, x.query.get('theme') || undefined) },
  { method: 'GET',  path: '/v1/theme/{format}',            summary: 'Export the whole theme. format: css | json | scss | tailwind.',
    call: (c, x) => core.exportTheme(x.params.format) },

  { method: 'GET',  path: '/v1/components',                summary: 'List component contracts. ?domain= to filter.',
    call: (c, x) => core.listComponents(x.query.get('domain') || undefined) },
  { method: 'GET',  path: '/v1/components/{id}',           summary: 'A component’s full contract.',
    call: (c, x) => core.getComponent(x.params.id) },
  { method: 'GET',  path: '/v1/components/{id}/contract',  summary: 'The component’s data contract (states + shape).',
    call: (c, x) => core.getDataContract(x.params.id) },
  { method: 'GET',  path: '/v1/components/{id}/register',  summary: 'The four-cell decision register (whenToUse / whenNot / a11y / regulatory).',
    call: (c, x) => core.getDecisionRegister(x.params.id) },
  { method: 'GET',  path: '/v1/search',                    summary: 'Keyword search across components. ?q=order ticket',
    call: (c, x) => core.searchComponents(x.query.get('q') || '') },
  { method: 'GET',  path: '/v1/regulation/{rule}',         summary: 'Find components anchored to a regulation, e.g. FINRA%202111, NACHA.',
    call: (c, x) => core.findByRegulation(decodeURIComponent(x.params.rule)) },

  { method: 'POST', path: '/v1/recommend',                 summary: 'Rank components for a natural-language use case.',
    body: { useCase: 'string (required)', limit: 'number (optional)' },
    call: (c, x) => core.recommend(x.body.useCase || x.body.q || '', x.body.limit) },
  { method: 'POST', path: '/v1/bundle',                    summary: 'Resolve a set of components into a deps-first install order + token union.',
    body: { components: 'string[] (component ids)' },
    call: (c, x) => core.bundle(x.body.components || x.body.ids || []) },
  { method: 'POST', path: '/v1/scaffold',                  summary: 'Generate a method-compliant component skeleton (HTML + scoped CSS + delegated JS).',
    body: { component: 'string (component id)' },
    call: (c, x) => core.scaffoldComponent(x.body.component || x.body.id) },
  { method: 'POST', path: '/v1/lint',                      summary: 'Lint a proposed usage for unknown tokens, bad states, hardcoded colours, inline styles.',
    body: { tokens: 'string[]', states: 'string[]', css: 'string' },
    call: (c, x) => core.lintUsage(x.body) },

  { method: 'GET',  path: '/v1/components/{id}/a11y',      summary: 'Static accessibility audit of a component against its contract (+ per-token contrast, both themes).',
    call: (c, x) => core.auditAccessibility(x.params.id) },
  { method: 'GET',  path: '/v1/contrast',                  summary: 'WCAG contrast ladder for the token set. ?theme=light|dark for one theme.',
    call: (c, x) => core.contrastReport(x.query.get('theme') || undefined) },
  { method: 'GET',  path: '/v1/compliance',                summary: 'Regulatory anchors + guardrail components present for a jurisdiction. ?jurisdiction=us|eu|uk|au|sg|jp|global&feature=kyc',
    call: (c, x) => core.complianceCheck({ jurisdiction: x.query.get('jurisdiction') || undefined, feature: x.query.get('feature') || undefined }) },
  { method: 'POST', path: '/v1/compose',                   summary: 'Compose a dependency-resolved multi-component flow from a list of ids.',
    body: { components: 'string[] (component ids)', name: 'string (optional)' },
    call: (c, x) => core.composeFlow({ ids: x.body.components || x.body.ids || [], name: x.body.name }) },
  { method: 'POST', path: '/v1/scaffold-test',             summary: 'Generate a dependency-free contract-conformance smoke test for a component.',
    body: { component: 'string (component id)' },
    call: (c, x) => core.scaffoldTest(x.body.component || x.body.id) },
];

/* ------------------------------------------------------------------ *
 * tiny router (no framework)
 * ------------------------------------------------------------------ */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};
function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS });
  res.end(JSON.stringify(body, null, 2));
}
function out(res, result) {
  // core surfaces bad input as { error } rather than throwing; map that to 400.
  if (result && typeof result === 'object' && result.error) return send(res, 400, result);
  return send(res, 200, result);
}
function compile(p) { return new RegExp('^' + p.replace(/[.]/g, '\\.').replace(/\{(\w+)\}/g, '(?<$1>[^/]+)') + '$'); }
const TABLE = ROUTES.map((r) => ({ ...r, re: compile(r.path) }));

function readBody(req) {
  return new Promise((resolve) => {
    let data = '', size = 0;
    req.on('data', (c) => { size += c.length; if (size > 1_000_000) req.destroy(); else data += c; });
    req.on('end', () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch { resolve({ __badjson: true }); } });
    req.on('error', () => resolve({}));
  });
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

  if (req.method === 'GET' && (path === '/' || path === '')) return send(res, 200, indexDoc(url));
  if (req.method === 'GET' && path === '/openapi.json') return send(res, 200, openapi());

  for (const r of TABLE) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(path);
    if (!m) continue;
    const ctx = { params: m.groups || {}, query: url.searchParams, body: {} };
    if (req.method === 'POST') {
      ctx.body = await readBody(req);
      if (ctx.body.__badjson) return send(res, 400, { error: 'invalid JSON body' });
    }
    try { return out(res, r.call(core, ctx)); }
    catch (e) { return send(res, 500, { error: 'internal error', detail: String(e && e.message || e) }); }
  }
  // path matched but wrong method?
  if (TABLE.some((r) => r.re.test(path))) return send(res, 405, { error: 'method not allowed', path, method: req.method });
  return send(res, 404, { error: 'no such endpoint', path, index: '/', spec: '/openapi.json' });
}

/* ------------------------------------------------------------------ *
 * self-documentation
 * ------------------------------------------------------------------ */
function indexDoc(url) {
  const base = url.origin && url.origin !== 'null' ? url.origin : '';
  return {
    name: 'eds-mcp HTTP API',
    version: VERSION,
    description: 'The Edwson Design System (tokens + regulated-finance component contracts) over HTTP. Same engine as the MCP server.',
    docs: 'https://github.com/Edwson/eds-mcp',
    openapi: base + '/openapi.json',
    endpoints: ROUTES.map((r) => ({ method: r.method, path: r.path, summary: r.summary, ...(r.body ? { body: r.body } : {}) })),
    try: [`${base}/health`, `${base}/v1/components`, `${base}/v1/theme/css`, `${base}/v1/regulation/FINRA%202111`],
  };
}
function openapi() {
  const paths = {};
  for (const r of ROUTES) {
    const oapiPath = r.path.replace(/\{(\w+)\}/g, '{$1}');
    const params = [...r.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }));
    if (r.path === '/v1/search') params.push({ name: 'q', in: 'query', required: false, schema: { type: 'string' } });
    if (r.path === '/v1/components') params.push({ name: 'domain', in: 'query', required: false, schema: { type: 'string' } });
    if (r.path === '/v1/tokens/{group}' || r.path === '/v1/token/{name}' || r.path === '/v1/contrast') params.push({ name: 'theme', in: 'query', required: false, schema: { type: 'string', enum: ['light', 'dark'] } });
    if (r.path === '/v1/compliance') { params.push({ name: 'jurisdiction', in: 'query', required: false, schema: { type: 'string', enum: ['us', 'eu', 'uk', 'au', 'sg', 'jp', 'global'] } }); params.push({ name: 'feature', in: 'query', required: false, schema: { type: 'string' } }); }
    const op = {
      summary: r.summary,
      operationId: r.method.toLowerCase() + oapiPath.replace(/[/{}]/g, '_'),
      responses: { 200: { description: 'OK' }, 400: { description: 'Bad input (body carries { error })' }, 404: { description: 'Unknown id/endpoint' } },
    };
    if (params.length) op.parameters = params;
    if (r.body) op.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', description: Object.entries(r.body).map(([k, v]) => `${k}: ${v}`).join('; ') } } } };
    paths[oapiPath] = paths[oapiPath] || {};
    paths[oapiPath][r.method.toLowerCase()] = op;
  }
  return {
    openapi: '3.1.0',
    info: { title: 'eds-mcp HTTP API', version: VERSION, description: 'The Edwson Design System over HTTP. Tokens + regulated-finance component contracts, scaffolding, linting, theme export.', license: { name: 'MIT' } },
    externalDocs: { url: 'https://github.com/Edwson/eds-mcp' },
    paths,
  };
}

/* ------------------------------------------------------------------ *
 * server lifecycle
 * ------------------------------------------------------------------ */
export function createApiServer() { return createServer(handler); }
export { handler, ROUTES };

function start() {
  const argv = process.argv.slice(2);
  if (argv.includes('--version') || argv.includes('-v')) { process.stdout.write(VERSION + '\n'); return; }
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      `eds-mcp HTTP API v${VERSION}\n\n` +
      `Usage:\n  node http.js              serve on $PORT (default 8787)\n` +
      `  PORT=3000 node http.js    serve on a specific port\n\n` +
      `Open / for the endpoint index and /openapi.json for the spec. Zero dependencies.\n`);
    return;
  }
  const port = Number(process.env.PORT) || 8787;
  createApiServer().listen(port, () => {
    process.stdout.write(`eds-mcp HTTP API v${VERSION} → http://localhost:${port}  (GET / for the index, /openapi.json for the spec)\n`);
  });
}

// Run only when invoked directly (node http.js or the bin), not when imported by tests.
const invokedPath = process.argv[1] ? (() => { try { return realpathSync(process.argv[1]); } catch { return process.argv[1]; } })() : '';
if (invokedPath && pathToFileURL(invokedPath).href === import.meta.url) start();
