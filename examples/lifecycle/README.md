# One requirement → a shipped feature, in one command

> The fastest way to understand what eds-mcp is *for*: don't read the tool list — run this.

```bash
node build-feature.mjs "Build a KYC onboarding step for an AU broker — EDD with source of funds"
```

In ~70 ms, eds-mcp takes that one sentence and drives the **design-system spine of the entire
delivery lifecycle** on the real engine — writing real artifacts to disk at every stage:

| Stage | What eds-mcp does | Tools | Artifact |
|---|---|---|---|
| **Intake** | reads the requirement, detects jurisdiction + domain | — | — |
| **Planning** | maps the requirement to the regulation that governs it | `compliance_check` · `find_by_regulation` · `recommend_component` | `01-regulatory-map.md` |
| **PRD** | resolves the component flow (deps-first) + the full contract for each | `compose_flow` · `get_decision_register` · `get_data_contract` | `02-feature-spec.md` |
| **R&D** | scaffolds compliant, tokens-only code for every component | `scaffold_component` · `export_theme` | `03-build/<prefix>/*` + `theme.css` |
| **QA** | lints, audits accessibility, checks contrast | `lint_usage` · `audit_accessibility` · `contrast_report` | `04-qa-report.md` |
| **Test** | scaffolds a runnable conformance test per component | `scaffold_test` | `05-tests/*.mjs` |
| **Launch** | ship checklist + an honest line on what stays human | — | `06-launch-checklist.md` |

Everything written is **real engine output**, not a mockup. Browse a committed run in
[`sample-output/`](./sample-output/) — the regulation map, the PRD, the scaffolded
HTML/CSS/JS, the QA report, the conformance tests.

## What you see when you run it

```
━━━ eds-mcp v1.16.0 · Feature Lifecycle ━━━
Requirement:  "Build a KYC onboarding step for an AU broker — EDD with source of funds"
Detected:     jurisdiction=AU · domain=KYC / onboarding

[1/6] PLANNING — map the requirement to regulation
   compliance_check{au, 'kyc'} → 1 guardrail component · 1 anchor
   find_by_regulation{FATF}     → 4 components: KycStepper, RegCitation, SanctionsScreen, UboGraph
   → wrote 01-regulatory-map.md
[2/6] PRD — resolve the component flow + the contract for each
   compose_flow{5 selected} → 5 steps, deps resolved, 0 missing
   order: RegCitation → KycStepper → SanctionsScreen → SuitabilityGate → AuditTrail
   → wrote 02-feature-spec.md (5 contracts)
[3/6] R&D — scaffold compliant, tokens-only code for each component
   scaffold_component ×5 → 03-build/<prefix>/ (HTML + scoped CSS + delegated JS)
[4/6] QA — lint, accessibility audit, contrast
   lint_usage ×5          → 0 errors across the flow
   audit_accessibility ×5 → 5/5 pass the contract
[5/6] TEST — scaffold a runnable conformance test per component
[6/6] LAUNCH — ship checklist + what stays human

━━━ Done in 68ms ━━━
One requirement → 5 components · 13 tokens · 11 regulatory anchors · 5/5 a11y · 5 tests
```

## Try your own — it routes by domain

```bash
node build-feature.mjs "Let a user move money across rails, show the FX, and schedule a payout"
node build-feature.mjs "Originate a consumer loan with affordability and APR disclosure"
node build-feature.mjs "Propose an advisory portfolio rebalance the client must approve"
node build-feature.mjs "Step up authentication and record what the user consented to"
node build-feature.mjs "Screen a counterparty for sanctions and keep the audit trail" --jurisdiction global
```

Each routes to a different jurisdiction + component set and produces its own artifacts. The
wealth example is worth a look: `compose_flow` **auto-resolves a dependency** (`AiSuggestion`
pulls in `ConfidenceMeter`), so the build catches a component you'd have forgotten.

## The honest division of labour

This is the part that makes it credible rather than hype:

- **Automated by eds-mcp, correct by contract:** the regulation map, the spec, the compliant
  code, the QA reports, the tests. The work that used to take a designer + a compliance
  reviewer + a developer several days — collapsed to seconds.
- **Stays human:** approving the PRD, completing the render branches, the compliance sign-off
  for the jurisdiction, and the decision to ship. **eds-mcp builds the feature; the human owns
  the decision.**

That's the leverage: one engineer with eds-mcp ships a compliant, tested, accessible feature
from a one-line requirement — and keeps judgment and sign-off where they belong.

---

Part of [eds-mcp](../../README.md) — the Edwson Design System over MCP + HTTP. Run the same
engine as an MCP server (`node ../../server.js`), an HTTP API (`node ../../http.js`), or this
library example.
