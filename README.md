# eds-mcp-server — the Edwson Design System over MCP

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server that hands your
design-system **token + component contract** to any AI agent (Claude Code, Codex, Cursor, …) as
callable tools — so the whole org builds UI from one source of truth, the system auto-syncs, and
your **AI-token bill goes down** instead of up.

This is the runnable backbone behind the "AI-Native Development" section of the
[design system showcase](https://edwson.com/design-system-showcase.html).

---

## Why an enterprise adopts this (and doesn't leave)

**1 · It cuts your AI-token spend.**
The expensive way teams use AI for UI today: paste a 6–15 KB CSS/theme file plus a screenshot or two
into the agent *every turn*, let it regenerate full hex/CSS, and correct it 2–3 times. That's ~10K+
input tokens × several loops per component.

This server instead serves **targeted, reference-based, cache-friendly slices**:

| Mechanism | Effect on tokens |
|---|---|
| **Targeted retrieval** — `get_tokens(color, dark)` returns only what's asked | a color slice is **78% smaller** than the full token file (measured) |
| **Reference output** — agent emits `--accent` / `OrderTicket`, not regenerated CSS | output tokens drop sharply |
| **Contract correctness** — `whenToUse` / `props` / `regulatory` / `dataContract` make it right the first time | correction loops (the real cost driver) collapse toward 1 |
| **Deterministic + compact** — same input → same small output | the static slice sits behind prompt caching |

**2 · It auto-syncs across the org.**
`build-manifest.js` hashes every contract file into `manifest.json` (version + per-file SHA-256).
Consumers compare their cached manifest and pull **only the changed files** (`diff_since`). A token
change propagates everywhere — apps (build), Storybook (docs), agents (MCP) — without a rebuild,
because everything references tokens, never literals.

**3 · It enforces consistency + compliance.**
One signed manifest = one source of truth; checksums prevent drift; SemVer gates breaking changes.
Regulated components (risk warnings, KYC gates, sign-off bars) carry their rule in the contract and
are marked non-removable, so neither a human in a hurry nor an agent can ship the surface without them.

---

## Tools (9, all read-only)

Every tool returns a text block **and** `structuredContent` (the same object, machine-parseable); errors set `isError: true` instead of masquerading as data.

| Tool | Returns |
|---|---|
| `list_token_groups` | group names only (cheapest orientation) |
| `get_tokens {group, theme?}` | only the requested token group |
| `get_token {name, theme?}` | resolve one token by name across groups (theme-aware) |
| `search_components {query}` | matching ids + one-line purpose |
| `list_components {domain?}` | every component id + purpose + domain, optionally filtered |
| `get_component {id}` | one component's full contract |
| `get_data_contract {id}` | data shape + required render states |
| `get_manifest` | version + per-file checksums |
| `diff_since {version}` | changed files since a version (auto-sync delta) |

### Resources (whole-file, read-only)

| URI | Contents |
|---|---|
| `eds://tokens` | full token contract |
| `eds://components` | component index (id + purpose + domain + regulatory flags) |
| `eds://manifest` | version + per-file checksums |

48 component contracts span ten domains — `trading`, `compliance`, `ai`, `ml`, `ai-cost`, `data-eng`, `ai-infra`, `b2b`, `a11y`, `platform`.

## Run

```bash
git clone https://github.com/Edwson/eds-mcp
cd eds-mcp
npm install
npm run build:manifest   # regenerate manifest.json after any token/component change
npm test                 # validate the contract + manifest sync (no SDK needed)
npm start                # speaks MCP over stdio
```

Register with an MCP client (example for Claude Code / Cursor `mcp.json`):

```json
{ "mcpServers": { "eds": { "command": "node", "args": ["server.js"], "cwd": "./eds-mcp" } } }
```

Requires Node 18+. The contract lives in `tokens.json` + `components.json`; edit those, re-run
`build:manifest`, and every consumer picks up the delta.

## Files

```
tokens.json        token contract (color light/dark, space, radius, type, density)
components.json    component contracts (purpose, when-to-use/not, props, a11y, regulatory, dataContract)
build-manifest.js  auto-sync engine — hashes contracts -> manifest.json
server.js          MCP server — 9 read-only tools + 3 resources over stdio
test.js            dependency-free smoke test (contract shape + manifest sync)
manifest.json      generated — version + SHA-256 per file
```
