/**
 * loadCore.js — build a ready-to-use core from the bundled JSON.
 *
 * One place that reads tokens.json / components.json / manifest.json and returns a
 * configured engine, so the MCP server (server.js), the HTTP API (http.js), and the
 * tests all construct the core identically — they can never drift apart.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createCore } from './core.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));

export function loadCore() {
  let manifest = {};
  try { manifest = load('manifest.json'); } catch { /* run `npm run build:manifest` first */ }
  return createCore({
    tokens: load('tokens.json'),
    components: load('components.json'),
    manifest,
  });
}
