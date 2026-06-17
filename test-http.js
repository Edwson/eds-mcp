#!/usr/bin/env node
/**
 * test-http.js — end-to-end test of the HTTP API.
 *
 * Boots the real server on an ephemeral port and exercises it the way any client
 * would (fetch over HTTP), proving the REST surface speaks the same engine as MCP.
 * Dependency-free: Node 18+ has global fetch. Run: node test-http.js
 */
import { createApiServer } from './http.js';

let fails = 0;
const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { console.error('  ✗ ' + m); fails++; } };

const server = createApiServer();
await new Promise((res) => server.listen(0, res));
const base = 'http://localhost:' + server.address().port;
const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }));

try {
  console.log('discovery');
  let r = await get('/health');
  ok(r.status === 200 && r.body.ok === true && typeof r.body.components === 'number' && r.body.components > 0, `GET /health → ok, ${r.body.components} components`);
  r = await get('/');
  ok(r.status === 200 && Array.isArray(r.body.endpoints) && r.body.endpoints.length >= 18, `GET / index lists ${r.body.endpoints?.length} endpoints`);
  r = await get('/openapi.json');
  ok(r.status === 200 && r.body.openapi === '3.1.0' && Object.keys(r.body.paths).length >= 18, 'GET /openapi.json is a valid 3.1.0 spec');

  console.log('tokens + theme');
  r = await get('/v1/tokens');
  ok(r.status === 200 && Array.isArray(r.body.groups) && r.body.groups.includes('color'), 'GET /v1/tokens lists groups');
  r = await get('/v1/token/accent?theme=dark');
  ok(r.status === 200 && /^--/.test(r.body.cssVar || ''), 'GET /v1/token/{name} resolves a CSS var');
  for (const fmt of ['css', 'json', 'scss', 'tailwind']) {
    r = await get('/v1/theme/' + fmt);
    ok(r.status === 200 && r.body.format === fmt && r.body.output, `GET /v1/theme/${fmt} exports`);
  }

  console.log('components + discovery');
  r = await get('/v1/components');
  ok(r.status === 200 && r.body.count > 0, `GET /v1/components → ${r.body.count}`);
  const id = r.body.components[0].id;
  r = await get('/v1/components/' + id);
  ok(r.status === 200 && r.body.id === id && r.body.purpose, `GET /v1/components/${id} returns the contract`);
  r = await get('/v1/components/' + id + '/register');
  ok(r.status === 200 && r.body.register, 'GET …/register returns the four-cell register');
  r = await get('/v1/search?q=order');
  ok(r.status === 200 && typeof r.body.count === 'number', 'GET /v1/search?q= works');
  r = await get('/v1/regulation/' + encodeURIComponent('FINRA 2111'));
  ok(r.status === 200 && typeof r.body.count === 'number', 'GET /v1/regulation/{rule} works');

  console.log('generation + checks');
  r = await post('/v1/recommend', { useCase: 'let a user place an order with a suitability check', limit: 3 });
  ok(r.status === 200 && Array.isArray(r.body.recommendations), 'POST /v1/recommend ranks components');
  r = await post('/v1/scaffold', { component: id });
  ok(r.status === 200 && r.body.files && /var\(--/.test(r.body.files.css || '') && !/#[0-9a-fA-F]{3,6}\b/.test((r.body.files.css || '').replace(/var\([^)]*\)/g, '')), 'POST /v1/scaffold emits tokens-only CSS (0 hardcoded hex)');
  r = await post('/v1/lint', { tokens: ['accent', 'definitely-not-a-token'], states: ['nope'], css: 'a{color:#abcdef} b{background:rgb(1,2,3)}' });
  ok(r.status === 200 && r.body.ok === false && r.body.issues.some((i) => i.code === 'unknown-token') && r.body.issues.some((i) => i.code === 'bad-state') && r.body.issues.some((i) => i.code === 'hardcoded-color'), 'POST /v1/lint catches token + state + colour issues');

  console.log('error handling');
  r = await get('/v1/components/__nope__');
  ok(r.status === 400 && r.body.error, 'unknown component → 400 with { error }');
  r = await get('/v1/nope');
  ok(r.status === 404 && r.body.error, 'unknown endpoint → 404 with { error }');
  r = await post('/v1/scaffold', {});
  ok(r.status === 400 && r.body.error, 'scaffold without a component → 400 with { error }');
} catch (e) {
  console.error('  ✗ harness error:', e && e.message); fails++;
} finally {
  server.close();
}

console.log(fails === 0 ? '\nPASS — the HTTP API speaks the same engine as MCP, end-to-end.' : `\nFAIL — ${fails} check(s) failed.`);
process.exit(fails === 0 ? 0 : 1);
