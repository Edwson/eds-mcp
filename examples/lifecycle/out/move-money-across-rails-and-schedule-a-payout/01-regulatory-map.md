# 01 · Regulatory map

**Requirement:** move money across rails and schedule a payout

**Jurisdiction:** EU · **Domain:** Payments & money movement

## Guardrail components present for this market (`compliance_check`)

- **FxQuoteTicket** — PSD2 (EEA payment transparency)
- **MandateConsent** — SEPA Direct Debit Mandate (Rulebook)
- **MoneyMovementTracker** — ISO 20022 pacs.002 (payment status report)
- **PaymentRailSelector** — ISO 20022 (wire / RTP messaging)
- **PaymentRetryDunning** — PSD2 SCA (re-authentication on method update)
- **ReconciliationMatch** — ISO 20022 camt.053 (bank statement)
- **StepUpAuth** — PSD2 SCA (EU 2018/389 RTS — two-factor + dynamic linking)

## Components anchored to ISO 20022 (`find_by_regulation`)

- **PaymentRailSelector** — ISO 20022 (wire / RTP messaging)
- **MoneyMovementTracker** — ISO 20022 pacs.002 (payment status report)
- **ReconciliationMatch** — ISO 20022 camt.053 (bank statement)

> Not legal advice — a coverage map of the regulatory anchors this design system encodes for the market.
