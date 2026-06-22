# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.16.0] — 2026-06-22
### Added
- **Five new capability tools** (MCP 18 → 23; HTTP 19 → 24 endpoints), each over the same pure `core.js`:
  - `audit_accessibility {id}` — static accessibility audit against the contract (a11y text present, error
    state declared, every colour token defined for both themes in lock-step, reduced-motion guard,
    regulatory anchor) **plus** a per-token WCAG contrast read in both themes. The error-state check is required
    only for **async (loading) components** — a static or value-bound component (no loading state) legitimately
    needs no error state, so it is not penalised; a component that declares `loading` but no `error` still fails.
  - `contrast_report {theme?}` — the WCAG 2.1 contrast ladder for the whole token set, both themes, with
    AA / AA-large / AAA classification and a failures list.
  - `compliance_check {jurisdiction?, feature?}` — maps a market (`us·eu·uk·au·sg·jp·global`) to the
    regulatory anchors and guardrail components present in the system. A design coverage map, not legal advice.
  - `compose_flow {ids[], name?}` — a dependency-resolved multi-component flow with a per-step decision
    register and the union of tokens + anchors (build a KYC / order / onboarding surface end to end).
  - `scaffold_test {id}` — a dependency-free, runnable contract-conformance test (tokens resolve, states
    canonical, anchors intact, a11y contract passes, scaffold CSS tokens-only). Ships the test with the component.
- **Ten new component contracts (55 → 65) across three new domains (11 → 14):** `lending`
  (LoanOriginationStepper, APRDisclosure, AffordabilityCheck, RepaymentSchedule, CollectionsNotice —
  TILA/Reg Z, ECOA/Reg B, FCA CONC, FDCPA), `wealth` (SuitabilityProfile, FeeAndConflictDisclosure,
  PortfolioRebalanceProposal — FINRA 2111, SEC Reg BI, Form CRS, SR 11-7), and `identity` (StepUpAuth,
  ConsentReceipt — PSD2 SCA, FFIEC, GDPR Art. 7, APPI, ISO/IEC 29184).
- **The Agency (agency-agents) integration** — `integrations/agency-agents/`: a drop-in
  `Regulated-Finance Design-System Engineer` specialist authored in
  [The Agency](https://github.com/msitarzewski/agency-agents)'s open persona format and wired to eds-mcp's
  tools, plus an example MCP config. Interoperability with attribution — no upstream files copied. (MIT,
  by Matt Sitarzewski.)
- Type declarations (`core.d.ts`) for all five new methods + `blocksAutonomousExecution`.
### Changed
- Version 1.15.0 → 1.16.0 across `tokens.json` / `components.json` / `package.json`; manifest regenerated
  (deterministic; 48 tokens · 65 components · 14 domains). Tests extended for every new tool across
  `test.js`, `test-mcp.js` (23 tools asserted), and `test-http.js`; `npm run validate` green.

## [1.15.0] — 2026-06-17
### Added
- **Zero-dependency HTTP REST API (`http.js`)** — the same `core.js` engine over plain HTTP + JSON, so
  anyone can use it without an MCP client: 19 endpoints covering every capability (tokens, theme export,
  component discovery, `find_by_regulation`, `recommend`, `bundle`, `scaffold`, `lint`), open CORS, a
  self-describing index at `/`, and a full **OpenAPI 3.1** spec at `/openapi.json`. Uses only Node
  built-ins — runs straight from a clone with no `npm install`.
- **Instant install with no npm publish** — `npx -y github:Edwson/eds-mcp` runs the MCP server directly
  from the repo; `npx -y --package=github:Edwson/eds-mcp eds-mcp-http` runs the HTTP API.
- **`loadCore.js`** — one shared loader builds the core from the bundled JSON, so the MCP server, the HTTP
  API, and the tests construct the engine identically (no drift).
- **`Dockerfile`** — a zero-dependency image for the HTTP API (`docker run -p 8787:8787 eds-mcp`).
- **`test-http.js`** — end-to-end HTTP integration test (boots the real server, hits every endpoint);
  wired into `test:all`, `validate`, and CI.
- New `bin` `eds-mcp-http`, the `npm run serve` script, and the `./http` package export.

### Notes
- No component-contract content changed; this bump is the new HTTP surface. The version stays in lockstep
  across `tokens.json` / `components.json` / `manifest.json` / `package.json` (1.15.0).

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
