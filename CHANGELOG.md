# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.14.0] — 2026-06-17
### Added
- **Decoupled pure engine `core.js`** — `createCore({tokens, components, manifest})` returns the whole
  capability surface. The MCP server, a library import, and the test suite all run the same logic, so the
  MCP tools and the library API can never drift.
- **Code generation:** `scaffold_component` returns a paste-ready, method-compliant skeleton
  (`ds-section` HTML + scoped tokens-only CSS + delegated, reduced-motion-safe JS + the four-cell register).
- **Linting:** `lint_usage` flags unknown tokens, non-canonical states, hardcoded colours, and inline styles.
- **Discovery:** `find_by_regulation`, `recommend_component`, ranked `search_components`, `bundle_components`
  (transitive `requires`, deps-first), `get_decision_register`.
- **Theme export:** `export_theme` (css / json / scss / tailwind), dual-theme, self-consistent with scaffold.
- **Meta:** `get_method` (the nine non-negotiables + verification gates), `get_stats`.
- **Resources** `eds://method` and `eds://regulatory`; **MCP prompts** `build-regulated-component`,
  `compliance-review`, `accessibility-audit`.
- **Library packaging:** `main` + `exports` so `import { createCore } from 'eds-mcp-server'` works; TypeScript
  declarations (`core.d.ts`).
- **End-to-end integration test** (`test-mcp.js`) that boots the real server over stdio and exercises
  tools/resources/prompts via the SDK client.
- CLI flags (`--version`, `--help`), CI (Node 18/20/22), ESLint, and the standard OSS files.

### Changed
- `server.js` is now a thin adapter over `core.js`. Tool count 9 → 18; resources 3 → 5; prompts 0 → 3.

## [1.13.0] — 2026-06-16
### Added
- `payments` domain (7 contracts: rail selector, money-movement tracker, FX quote, reconciliation, dunning,
  debit mandate, payout schedule). Components 48 → 55; domains 10 → 11.

## [1.12.0] — 2026-06-16
### Added
- Component contracts expanded 14 → 48 across 10 domains; `props` normalised to objects; `structuredContent`
  on every tool; `get_token` / `list_components` tools; `eds://` resources; dependency-free smoke test.
