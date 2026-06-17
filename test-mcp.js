#!/usr/bin/env node
/**
 * test-mcp.js — end-to-end MCP integration test.
 *
 * Boots the REAL server over stdio with the actual SDK client, performs the
 * initialize handshake, and exercises tools + resources + prompts the way a real
 * agent (Claude Code, Cursor, …) would. This is the proof the server speaks MCP —
 * not just that the core logic is correct (that is test.js, which needs no SDK).
 *
 * Requires `npm install` first.   Usage: node test-mcp.js   (exit 0 = pass, 1 = fail)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { console.error('  ✗ ' + msg); fails++; } };
const sc = (r) => r.structuredContent || JSON.parse(r.content[0].text);
const firstId = Object.keys(JSON.parse(readFileSync(join(here, 'components.json'), 'utf8')).components)[0];

const transport = new StdioClientTransport({ command: process.execPath, args: [join(here, 'server.js')], cwd: here });
const client = new Client({ name: 'eds-mcp-itest', version: '1.0.0' });

try {
  console.log('handshake');
  await client.connect(transport);
  ok(true, 'initialize handshake completed');

  console.log('discovery');
  const tools = (await client.listTools()).tools;
  ok(tools.length === 18, `lists 18 tools (got ${tools.length})`);
  ok(tools.every((t) => t.inputSchema && typeof t.description === 'string'), 'every tool advertises a description + input schema');
  const resources = (await client.listResources()).resources;
  ok(resources.length === 5, `lists 5 resources (got ${resources.length})`);
  const prompts = (await client.listPrompts()).prompts;
  ok(prompts.length === 3, `lists 3 prompts (got ${prompts.length})`);

  console.log('tool calls');
  const scaf = sc(await client.callTool({ name: 'scaffold_component', arguments: { id: firstId } }));
  ok(scaf.files && scaf.files.html && scaf.files.css && scaf.files.js, 'scaffold_component returns html + css + js over the wire');
  ok((scaf.files.css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length === 0, 'scaffolded CSS is tokens-only (no hardcoded hex)');
  ok((scaf.files.html.match(/ds-logic-cell/g) || []).length === 4, 'scaffolded HTML carries the four-cell register');

  const lint = sc(await client.callTool({ name: 'lint_usage', arguments: { tokens: ['accent2', 'totally-fake'] } }));
  ok(lint.ok === false && lint.issues.some((i) => i.code === 'unknown-token'), 'lint_usage flags an unknown token');

  const reg = sc(await client.callTool({ name: 'find_by_regulation', arguments: { rule: 'FINRA 2111' } }));
  ok(reg.count >= 1, 'find_by_regulation "FINRA 2111" returns a component');

  const tw = sc(await client.callTool({ name: 'export_theme', arguments: { format: 'tailwind' } }));
  ok(tw.output && tw.output.theme && tw.output.theme.extend, 'export_theme tailwind returns a config');

  const badResult = await client.callTool({ name: 'get_component', arguments: { id: 'NoSuchComponent' } });
  ok(badResult.isError === true, 'a bad request sets isError on the response');

  console.log('resources + prompts');
  const method = JSON.parse((await client.readResource({ uri: 'eds://method' })).contents[0].text);
  ok(Array.isArray(method.nonNegotiables) && method.nonNegotiables.length === 9, 'eds://method resource serves the nine non-negotiables');
  const promptRes = await client.getPrompt({ name: 'build-regulated-component', arguments: { id: firstId } });
  ok(promptRes.messages && promptRes.messages.length >= 1, 'build-regulated-component prompt returns messages');

  await client.close();
} catch (e) {
  console.error('  ✗ integration error:', e && e.message);
  fails++;
  try { await client.close(); } catch { /* already closing */ }
}

console.log(fails === 0 ? '\nPASS — the live MCP server speaks the protocol end-to-end.' : `\nFAIL — ${fails} check(s) failed.`);
process.exit(fails === 0 ? 0 : 1);
