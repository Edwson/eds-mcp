#!/usr/bin/env node
/**
 * build-manifest.js — the auto-sync engine.
 *
 * Run this after any token or component change (CI step or pre-commit hook).
 * It hashes each contract file and writes manifest.json with a version + per-file
 * SHA-256. Consumers (apps, Storybook, AI agents) compare their cached manifest
 * against this one and pull ONLY the files whose checksum changed — that delta
 * is the "fully-automatic update/deployment" mechanism, and it's why a sync costs
 * a few hundred tokens instead of re-ingesting the whole system every time.
 *
 * Usage:  node build-manifest.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const FILES = ['tokens.json', 'components.json'];

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const tokens = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
const version = tokens.version || '0.0.0';

const files = {};
let tokenCount = 0;
for (const f of FILES) {
  const buf = readFileSync(join(here, f));
  files[f] = { sha256: sha256(buf), bytes: buf.length };
}

// count tokens for the manifest summary (color light+dark + space + radius + type.scale)
const c = tokens.color || {};
tokenCount =
  Object.keys(c.light || {}).length +
  Object.keys(c.dark || {}).length +
  Object.keys(tokens.space || {}).length +
  Object.keys(tokens.radius || {}).length +
  Object.keys((tokens.type || {}).scale || {}).length;

const components = JSON.parse(readFileSync(join(here, 'components.json'), 'utf8'));
const componentCount = Object.keys(components.components || {}).length;
const componentIds = Object.keys(components.components || {});
const domains = [...new Set(Object.values(components.components || {}).map((c) => c.domain).filter(Boolean))].sort();

const manifest = {
  name: 'edwson-design-system',
  version,
  generatedAt: new Date().toISOString(),
  summary: { tokens: tokenCount, components: componentCount, domains, componentIds },
  files,
  sync: {
    strategy: 'checksum-diff',
    note: 'Consumers fetch only files whose sha256 differs from their cached copy.'
  }
};

writeFileSync(join(here, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json written · v${version} · ${tokenCount} tokens · ${componentCount} components`);
