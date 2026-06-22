# eds-mcp — the Edwson Design System over MCP + HTTP

[![CI](https://github.com/Edwson/eds-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Edwson/eds-mcp/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%E2%89%A518-3c873a)
![MCP](https://img.shields.io/badge/MCP-server-6e56cf)
![HTTP API](https://img.shields.io/badge/HTTP-REST%20%2B%20OpenAPI-22d3ee)
![Library](https://img.shields.io/badge/library-zero%20deps-3c873a)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Your design-system **token + component contract**, served three ways from one engine — to **AI agents**
(Model Context Protocol), to **any app** (a zero-dependency HTTP REST API with an OpenAPI spec), and to
**Node code** (import the pure library). Not just to *read*, but to **scaffold correct code, lint a
proposed usage, discover components by the regulation they serve, and export the theme** — one source of
truth, auto-synced across the org, with your **AI-token bill going down instead of up**.

This is the runnable backbone behind the "AI-Native Development" section of the
[design system showcase](https://edwson.com/design-system-showcase.html).

```
MCP: 23 tools · 5 resources · 3 prompts     HTTP: 24 REST endpoints · OpenAPI 3.1     Library: createCore()
65 component contracts across 14 domains · reads + code-generation + linting + accessibility & compliance audits + flow composition + theme export
```

> **👉 Fastest way to see what this is _for_: `npm run example`.** One plain-English requirement
> → a shipped, compliant, tested feature, in one command — eds-mcp drives the design-system spine
> of the whole intake → planning → PRD → R&D → QA → launch lifecycle and writes real artifacts at
> every stage. Walkthrough + a committed sample run: [`examples/lifecycle/`](./examples/lifecycle/).

---

## Use it in one line

**① As an MCP server — for AI agents (Claude Desktop / Code, Cursor, Codex).** No install, no clone:

```json
{ "mcpServers": { "eds": { "command": "npx", "args": ["-y", "github:Edwson/eds-mcp"] } } }
```

Drop that into your MCP client config and the agent gains all 23 tools. (Once it's on npm:
`"args": ["-y", "eds-mcp-server"]`.)

**② As an HTTP REST API — for any language, any tool, curl, a browser.** Runs with **zero dependencies**:

```bash
npx -y --package=github:Edwson/eds-mcp eds-mcp-http     # or: git clone … && node http.js   (no npm install needed)
curl localhost:8787/v1/theme/css                        # the dual-theme token CSS
curl localhost:8787/v1/regulation/FINRA%202111          # components that satisfy a rule
curl -X POST localhost:8787/v1/scaffold -d '{"component":"OrderTicket"}'   # a method-compliant skeleton
```

`GET /` lists every endpoint; `GET /openapi.json` is a full OpenAPI 3.1 spec you can load into Swagger or
Postman. Deploy it anywhere — or `docker build -t eds-mcp . && docker run -p 8787:8787 eds-mcp`.

**③ As a library — in Node code.** The pure engine, importable directly:

```js
import { createCore } from 'eds-mcp-server';   // server, http, library: all the same core.js
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

## Tools (23)

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
| `scaffold_test {id}` | a dependency-free, runnable **conformance test** (tokens resolve · states canonical · anchors intact · a11y passes · CSS tokens-only) |

**Accessibility, compliance & composition**

| Tool | Returns |
|---|---|
| `audit_accessibility {id}` | static a11y audit against the contract (a11y text, error state, dual-theme lock-step, reduced-motion, anchor) + per-token contrast in both themes |
| `contrast_report {theme?}` | the WCAG 2.1 contrast ladder for the token set, both themes, with AA / AA-large / AAA + a failures list |
| `compliance_check {jurisdiction?, feature?}` | a jurisdiction (`us·eu·uk·au·sg·jp·global`) → the regulatory anchors + guardrail components present here (a coverage map, not legal advice) |
| `compose_flow {ids[], name?}` | a dependency-resolved multi-component flow with a per-step decision register + the union of tokens + anchors |

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

## Integrations · The Agency (agency-agents)

eds-mcp ships a **drop-in specialist** for
[The Agency](https://github.com/msitarzewski/agency-agents) — Matt Sitarzewski's open-source
(MIT) collection of AI agent personas. The Agency gives an agent a personality and a workflow;
eds-mcp gives it the design-system backend to build regulated UI **and prove it**. See
[`integrations/agency-agents/`](./integrations/agency-agents/) for the
`Regulated-Finance Design-System Engineer` persona (authored in The Agency's open format) plus an
example MCP config. This is interoperability with attribution — no upstream files are copied or
redistributed; please support the upstream project.

---

## HTTP REST API (for everyone who isn't an MCP client)

The same engine, over plain HTTP + JSON, **zero dependencies** (Node built-ins only — runs straight from
a clone with no `npm install`). CORS is open; every bad input returns `{ error }` with a `4xx`.

| Method & path | Equivalent of |
|---|---|
| `GET /health` · `GET /v1/stats` · `GET /v1/method` | liveness · counts · the operating contract |
| `GET /v1/tokens` · `GET /v1/tokens/{group}?theme=` · `GET /v1/token/{name}` | token groups · a group · one token |
| `GET /v1/theme/{css\|json\|scss\|tailwind}` | `export_theme` |
| `GET /v1/components?domain=` · `GET /v1/components/{id}` | `list_components` · `get_component` |
| `GET /v1/components/{id}/contract` · `/register` | `get_data_contract` · `get_decision_register` |
| `GET /v1/search?q=` · `GET /v1/regulation/{rule}` | `search_components` · `find_by_regulation` |
| `POST /v1/recommend` · `POST /v1/bundle` | `recommend_component` · `bundle_components` |
| `POST /v1/scaffold` · `POST /v1/lint` | `scaffold_component` · `lint_usage` |
| `GET /` · `GET /openapi.json` | self-describing index · OpenAPI 3.1 spec |

```bash
node http.js                       # serve on $PORT (default 8787) — no install required
npm run serve                      # same, via the package script
curl localhost:8787/v1/components?domain=payments
curl -s -X POST localhost:8787/v1/lint -d '{"tokens":["accent","nope"],"css":"a{color:#fff}"}'
```

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

## Run from source

```bash
git clone https://github.com/Edwson/eds-mcp && cd eds-mcp

node http.js             # HTTP REST API on :8787 — runs with NO npm install (zero deps)

npm install              # only the MCP server (the SDK/zod) + the test suites need this
npm start                # MCP server over stdio
npm run serve            # HTTP API (same as node http.js)
npm run build:manifest   # regenerate manifest.json after any token/component change
```

Register the local MCP server with a client (`mcp.json`):

```json
{ "mcpServers": { "eds": { "command": "node", "args": ["server.js"], "cwd": "./eds-mcp" } } }
```

Requires Node 18+. The contract lives in `tokens.json` + `components.json`; edit those, re-run
`build:manifest`, and every consumer picks up the delta.

65 component contracts span fourteen domains — `trading`, `compliance`, `payments`, `lending`, `wealth`, `identity`, `ai`, `ml`,
`ai-cost`, `data-eng`, `ai-infra`, `b2b`, `a11y`, `platform`.

## Quality & CI

Every push runs CI on **Node 18 / 20 / 22**: syntax check, ESLint, a **manifest-drift check**
(`build-manifest` must produce no diff), and **three test suites** — the dependency-free contract test
(`npm test`), the **end-to-end MCP integration test** that boots the real server over stdio and exercises
tools / resources / prompts through the SDK client (`npm run test:mcp`), and the **HTTP API integration
test** that boots the real REST server and hits every endpoint (`npm run test:http`).

```bash
npm run validate     # everything CI runs, locally: build:manifest + lint + test + test:mcp + test:http
```

Typed (`core.d.ts`), MIT-licensed, SemVer-versioned ([CHANGELOG](./CHANGELOG.md)). See
[CONTRIBUTING](./CONTRIBUTING.md), [SECURITY](./SECURITY.md), and runnable [`examples/`](./examples).

## Files

```
core.js            pure engine — all logic, dependency-free, importable as a library + test-covered
core.d.ts          TypeScript declarations for the library API
loadCore.js        builds a ready core from the bundled JSON (shared by server, http, tests)
server.js          thin MCP adapter — 23 tools + 5 resources + 3 prompts over stdio
http.js            zero-dependency HTTP REST API — 19 endpoints + OpenAPI 3.1 (node http.js)
build-manifest.js  auto-sync engine — hashes contracts -> manifest.json
tokens.json        token contract (color light/dark, space, radius, type, density)
components.json    component contracts (purpose, when-to-use/not, props, a11y, regulatory, dataContract)
test.js            dependency-free test — contract shape + manifest sync + full engine behaviour
test-mcp.js        end-to-end integration test — boots the real MCP server, exercises it via the SDK client
test-http.js       end-to-end integration test — boots the real HTTP API, hits every endpoint
manifest.json      generated — version + SHA-256 per file
Dockerfile         zero-dependency image for the HTTP API
.github/           CI workflow (Node 18/20/22), issue + PR templates, dependabot
examples/          library usage + an MCP client config
```
