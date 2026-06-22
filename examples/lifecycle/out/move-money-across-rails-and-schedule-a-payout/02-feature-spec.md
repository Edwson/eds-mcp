# 02 · Feature spec (PRD)

**Requirement:** move money across rails and schedule a payout

**Resolved flow (5 components, dependency-ordered):** MoneyMovementTracker → PaymentRailSelector → FxQuoteTicket → ReconciliationMatch → MandateConsent

**Tokens used:** 15 of 51 — `accent`, `accent2`, `border`, `border2`, `gold`, `green`, `radius.md`, `radius.sm`, `red`, `space.3`, `space.4`, `surface2`, `text1`, `text2`, `text3`

**Regulatory anchors honoured:** 15
- NACHA return codes (R01–R85)
- Reg E error resolution (12 CFR 1005.11)
- ISO 20022 pacs.002 (payment status report)
- NACHA Operating Rules (ACH)
- ISO 20022 (wire / RTP messaging)
- Reg E 12 CFR 1005 (consumer EFT)
- Reg E remittance rule (12 CFR 1005 Subpart B)
- Consumer FX transparency (mid-market disclosure)
- PSD2 (EEA payment transparency)
- SOC 1 / ICFR (reconciliation control)
- ISO 20022 camt.053 (bank statement)
- SEC 17a-4 (audit-trail retention where applicable)
- NACHA authorization rules (WEB / PPD / CCD)
- SEPA Direct Debit Mandate (Rulebook)
- Reg E preauthorized transfers (12 CFR 1005.10)

## Per-component contract

### MoneyMovementTracker
- **When to use:** After a payment is submitted, on any status surface the payer or ops team sees.
- **When NOT / instead:** Instant irreversible rails with no intermediate states — a single settled badge is honest; don't fake stages.
- **Behaviour & a11y:** Status is a live region; the stage list is an ordered list with aria-current; return codes link to plain-language explanations.
- **Data shape:** `{ status, rail, returnCode, reversibleUntil }` · states: loading / empty / error / stale
- **Regulatory anchor:** NACHA return codes (R01–R85); Reg E error resolution (12 CFR 1005.11); ISO 20022 pacs.002 (payment status report)

### PaymentRailSelector
- **When to use:** Any send-money flow where the rail materially changes speed, cost, or finality.
- **When NOT / instead:** Single-rail products — show a static rail badge, not a chooser of one.
- **Behaviour & a11y:** Radiogroup semantics; each rail announces speed + cost + finality; the cutoff countdown is text, never color-only.
- **Data shape:** `{ rail, etaSeconds, feeBps, cutoffTs, reversible }` · states: loading / empty / error / stale
- **Regulatory anchor:** NACHA Operating Rules (ACH); ISO 20022 (wire / RTP messaging); Reg E 12 CFR 1005 (consumer EFT)

### FxQuoteTicket
- **When to use:** Any multi-currency send where rate and fee must be disclosed before commit.
- **When NOT / instead:** Same-currency transfers — no FX surface, and never invent a rate.
- **Behaviour & a11y:** Rate-expiry is counted-down text with aria-live; the markup over mid-market is stated explicitly, never hidden inside the rate.
- **Data shape:** `{ rate, markupBps, feeFixed, quoteExpiresTs }` · states: loading / empty / error / stale
- **Regulatory anchor:** Reg E remittance rule (12 CFR 1005 Subpart B); Consumer FX transparency (mid-market disclosure); PSD2 (EEA payment transparency)

### ReconciliationMatch
- **When to use:** Treasury, ops, or finance surfaces reconciling money movement to the ledger.
- **When NOT / instead:** Real-time pre-trade checks — this is post-settlement reconciliation, not an execution gate.
- **Behaviour & a11y:** Match state carries a text label plus icon, never color alone; manual-match is keyboard-operable and reversible with an audit note.
- **Data shape:** `{ state, confidence, delta }` · states: loading / empty / error / stale
- **Regulatory anchor:** SOC 1 / ICFR (reconciliation control); ISO 20022 camt.053 (bank statement); SEC 17a-4 (audit-trail retention where applicable)

### MandateConsent
- **When to use:** Setting up any pull-based recurring debit where the payer must authorize in advance.
- **When NOT / instead:** Push payments the user initiates each time — there is no standing mandate to capture.
- **Behaviour & a11y:** The authorization text is readable before consent; revoke is as easy to find as grant; consent state is announced.
- **Data shape:** `{ mandateId, frequency, amountCap, revocable }` · states: loading / empty / error / stale
- **Regulatory anchor:** NACHA authorization rules (WEB / PPD / CCD); SEPA Direct Debit Mandate (Rulebook); Reg E preauthorized transfers (12 CFR 1005.10)

