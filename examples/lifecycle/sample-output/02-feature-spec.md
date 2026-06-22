# 02 · Feature spec (PRD)

**Requirement:** Build a KYC onboarding step for an Australian retail broker — Enhanced Due Diligence with source of funds and the legal basis shown inline.

**Resolved flow (5 components, dependency-ordered):** RegCitation → KycStepper → SanctionsScreen → SuitabilityGate → AuditTrail

**Tokens used:** 13 of 51 — `accent2`, `border`, `gold`, `green`, `radius.md`, `red`, `space.4`, `surface`, `text1`, `text2`, `text3`, `type.mono`, `type.xs`

**Regulatory anchors honoured:** 11
- FinCEN CDD
- FATF Rec 10/12
- FinCEN CDD 31 CFR 1010.230
- FATF Rec 10
- ASIC AML/CTF
- OFAC 31 CFR Part 501
- FATF Rec 6 (targeted financial sanctions)
- FINRA Rule 2111 (suitability)
- SEC Reg BI
- SEC Rule 17a-4(f) (append-only retention)
- SR 11-7

## Per-component contract

### RegCitation
- **When to use:** EDD / source-of-funds / suitability questions.
- **When NOT / instead:** Decorative copy. Must reference a real rule.
- **Behaviour & a11y:** Readable, not fine-print; expandable detail.
- **Data shape:** `{ rule, summary }` · states: —
- **Regulatory anchor:** FinCEN CDD; FATF Rec 10/12

### KycStepper
- **When to use:** Account onboarding, EDD, periodic re-verification.
- **When NOT / instead:** Single-field edits — use a standard form.
- **Behaviour & a11y:** One section at a time; clear progress; plain-language labels.
- **Data shape:** `{ steps[], current, savedAt }` · states: empty / error
- **Regulatory anchor:** FinCEN CDD 31 CFR 1010.230; FATF Rec 10; ASIC AML/CTF

### SanctionsScreen
- **When to use:** During onboarding or transaction monitoring wherever a counterparty must be sanctions-screened.
- **When NOT / instead:** Not a substitute for full KYC identity capture — use KycStepper for that.
- **Behaviour & a11y:** Each match exposes its score and list source as text; clear/hit states announced via live region.
- **Data shape:** `{ matches[], score, listSource, cleared }` · states: loading / empty / error / stale
- **Regulatory anchor:** OFAC 31 CFR Part 501; FATF Rec 6 (targeted financial sanctions)

### SuitabilityGate
- **When to use:** Before exposing any product whose suitability depends on the customer's profile.
- **When NOT / instead:** Not for products with no suitability obligation — render the product directly.
- **Behaviour & a11y:** Gate outcome is announced; the blocking reason is text and focusable, not a colour state.
- **Data shape:** `{ profile, suitable, reason }` · states: loading / error
- **Regulatory anchor:** FINRA Rule 2111 (suitability); SEC Reg BI

### AuditTrail
- **When to use:** Any action that must be defensible later: human sign-off, AI override, KYC step, disclosure acknowledgement.
- **When NOT / instead:** Never allow edit or delete of past entries; never omit the actor or the timestamp.
- **Behaviour & a11y:** The log is a labelled list; new entries are announced politely; timestamps are machine-readable.
- **Data shape:** `{ entries[], sealed }` · states: loading / empty / error / stale
- **Regulatory anchor:** SEC Rule 17a-4(f) (append-only retention); SR 11-7

