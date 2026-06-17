/**
 * Use eds-mcp as a plain library (no MCP, no agent). Run: node examples/library-usage.mjs
 */
import { readFileSync } from 'node:fs';
import { createCore } from '../core.js';

const j = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url)));
const eds = createCore({ tokens: j('../tokens.json'), components: j('../components.json'), manifest: j('../manifest.json') });

console.log('version:', eds.version);
console.log('stats:', eds.getStats());

// Export the theme for your stack:
console.log('\n— tailwind theme.extend —\n', JSON.stringify(eds.exportTheme('tailwind').output, null, 2).slice(0, 280), '…');

// Find what serves a regulation:
console.log('\n— components for "NACHA" —\n', eds.findByRegulation('NACHA').results.map((r) => r.id));

// Scaffold a component:
const id = Object.keys(j('../components.json').components)[0];
const s = eds.scaffoldComponent(id);
console.log(`\n— scaffold ${id} (prefix .${s.prefix}-) —\n`, s.files.css);

// Lint a proposed usage before you ship it:
console.log('\n— lint —\n', eds.lintUsage({ tokens: ['accent2', 'made-up'], css: '.x{color:#ff0000}' }));
