# eds-mcp-server — the Edwson Design System over MCP

A [Model Context Protocol](https://modelcontextprotocol.io) server **and** a pure JavaScript library
that hands your design-system **token + component contract** to any AI agent (Claude Code, Codex,
Cursor, …) — not just to *read*, but to **scaffold correct code, lint a proposed usage, discover
components by the regulation they serve, and export the theme**. One source of truth, auto-synced
across the org, with your **AI-token bill going down instead of up**.

This is the runnable backbone behind the "AI-Native Development" section of the
[design system showcase](https://edwson.com/design-system-showcase.html).

```
18 tools   ·   5 resources   ·   3 prompts   ·   55 component contracts across 11 domains
reads + code-generation + linting + regulation-aware discovery + theme export
```

---

## Why an enterprise adopts this (and doesn't leave)

**1 · It cuts your AI-token spend.** The expensive way teams use AI for UI today: paste a 6–15 KB
CSS/theme file plus a screenshot into the agent *every turn*, let it regenerate full hex/CSS, and
correct it 2–3 times. This server serves **targeted, reference-based, cache-friendly slices** — and
goes further by *generating* the structure so the agent never invents it:

| Mechanism | Effect on tokens |
|---|---|
| **Targeted retrieval** — `get_tokens(color, dark)` returns only what's asked | a colour slice is **~78% smaller** than the full token file |
| **Reference output** — agent emits `--accent2` / `OrderTicket`, not regenerated CSS | output tokens drop sharply |
| **Generation** — `scaffold_component` returns a method-compliant skeleton | the agent completes, it doesn't architect from scratch |
| **Contract correctness** — `whenToUse` / `whenNot` / `dataContract` / `regulatory` | correction loops (the real cost driver) collapse toward 1 |

**2 · It auto-syncs across the org.** `build-manifest.js` hashes every contract file into
`manifest.json` (version + per-file SHA-256). Consumers compare their cached manifest and pull **only
the changed files** (`diff_since`). A token change propagates everywhere — apps, Storybook, agents —
without a rebuild, because everything references tokens, never literals.

**3 · It enforces consistency + compliance.** One signed manifest = one source of truth; checksums
prevent drift; SemVer gates breaking changes. Regulated components carry their rule in the contract;
`lint_usage` rejects hardcoded colours and non-canonical states before they ship; `find_by_regulation`
makes "which component satisfies FINRA 2111?" a one-call question.

---

## Tools (18)

Every tool returns a text block **and** `structuredContent` (the same object, machine-parseable);
failures set `isError: true` instead of masquerading as data.

**Tokens & theme**

| Tool | Returns |
|---|---|
| `list_token_groups` | group names only (cheapest orientation) |
| `get_tokens {group, theme?}` | only the requested token group |
| `get_token {name, theme?}` | resolve one token by name + its canonical CSS var (theme-aware) |
| `export_theme {format}` | the whole token set as **css · json · scss · tailwind** (dual-theme) |

**Component discovery**

| Tool | Returns |
|---|---|
| `list_components {domain?}` | every id + purpose + domain + regulatory flags |
| `get_component {id}` | one component's full contract |
| `get_data_contract {id}` | data shape + required render states |
| `get_decision_register {id}` | the four-cell register (when / when-not / a11y / regulatory) |
| `search_components {query}` | **ranked** keyword search (id > domain/regulatory > purpose) |
| `find_by_regulation {rule}` | every component that serves a rule, e.g. `"FINRA 2111"`, `"NACHA"` |
| `recommend_component {useCase, limit?}` | NL use case → ranked picks, each with its `whenNot` warning |
| `bundle_components {ids[]}` | resolve `requires` transitively → dependency-ordered set + token union |

**Generation & checks**

| Tool | Returns |
|---|---|
| `scaffold_component {id}` | a paste-ready skeleton: `ds-section` HTML + scoped **tokens-only** CSS + delegated reduced-motion-safe JS + the four-cell register |
| `lint_usage {tokens?, states?, css?}` | issues by severity: unknown tokens, non-canonical states, hardcoded colours, inline styles |

**Meta**

| Tool | Returns |
|---|---|
| `get_manifest` | version + per-file checksums |
| `diff_since {version}` | changed files since a version (auto-sync delta) |
| `get_method` | the nine non-negotiables + verification gates — the Ed-agent operating contract |
| `get_stats` | version, component + domain counts, regulatory coverage, token count |

### Resources (5, whole-file)

`eds://tokens` · `eds://components` · `eds://manifest` · `eds://method` · `eds://regulatory`
(the last maps every regulation to the components that serve it).

### Prompts (3, contract-grounded)

`build-regulated-component {id}` · `compliance-review {regulation}` · `accessibility-audit {id}` —
reusable workflows that wire the tools together the right way.

---

## The killer move: `scaffold_component`

Ask for a component and get correct structure back, not a guess:

```jsonc
// scaffold_component { "id": "OrderTicket" } →
{
  "prefix": "ot", "sectionId": "sec-order-ticket",
  "tokensUsed": ["accent2","green","red","radius.md","space.4"],
  "files": {
    "html": "<section class=\"ds-section\" id=\"sec-order-ticket\">…four-cell register…</section>",
    "css":  ".ot-wrap{font-family:var(--type-font);color:var(--text1)} …tokens only, dual-theme…",
    "js":   "(function(){ var root=document.getElementById('ot-root'); … delegated, render-once … })();"
  }
}
```

The CSS it emits is **guaranteed tokens-only** (the test asserts zero hardcoded hex), the HTML carries
the four-cell decision register, and the JS is a delegated, render-once, reduced-motion-safe stub —
the [Edwson method](https://edwson.com/) baked into the output.

---

## Use it as a library (not only as an MCP server)

The logic lives in a pure, dependency-free `core.js`. Import it directly:

```js
import { createCore } from 'eds-mcp-server';            // or './core.js'
import tokens from './tokens.json' assert { type: 'json' };
import components from './components.json' assert { type: 'json' };

const eds = createCore({ tokens, components });
eds.exportTheme('tailwind');                 // → tailwind.config theme.extend
eds.scaffoldComponent('SuitabilityGate');    // → { files: { html, css, js } }
eds.lintUsage({ css: '.x{color:#f00}' });    // → { ok:false, issues:[{code:'hardcoded-color'…}] }
eds.findByRegulation('SEC 17a-4');           // → components with WORM-retention anchors
```

`server.js` is a thin MCP adapter over the same `core.js`, so the MCP tools and the library API can
never drift apart.

## Run

```bash
git clone https://github.com/Edwson/eds-mcp && cd eds-mcp
npm install
npm run build:manifest   # regenerate manifest.json after any token/component change
npm test                 # validate contracts + manifest sync + the engine (no SDK needed)
npm start                # speaks MCP over stdio
```

Register with an MCP client (`mcp.json`):

```json
{ "mcpServers": { "eds": { "command": "node", "args": ["server.js"], "cwd": "./eds-mcp" } } }
```

Requires Node 18+. The contract lives in `tokens.json` + `components.json`; edit those, re-run
`build:manifest`, and every consumer picks up the delta.

55 component contracts span eleven domains — `trading`, `compliance`, `payments`, `ai`, `ml`,
`ai-cost`, `data-eng`, `ai-infra`, `b2b`, `a11y`, `platform`.

## Files

```
core.js            pure engine — all logic, dependency-free, importable as a library + test-covered
server.js          thin MCP adapter — 18 tools + 5 resources + 3 prompts over stdio
build-manifest.js  auto-sync engine — hashes contracts -> manifest.json
tokens.json        token contract (color light/dark, space, radius, type, density)
components.json    component contracts (purpose, when-to-use/not, props, a11y, regulatory, dataContract)
test.js            dependency-free test — contract shape + manifest sync + full engine behaviour
manifest.json      generated — version + SHA-256 per file
```
