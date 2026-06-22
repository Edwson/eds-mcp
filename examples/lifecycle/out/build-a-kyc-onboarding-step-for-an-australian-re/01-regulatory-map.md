# 01 · Regulatory map

**Requirement:** Build a KYC onboarding step for an Australian retail broker — Enhanced Due Diligence with source of funds and the legal basis shown inline.

**Jurisdiction:** AU · **Domain:** KYC / onboarding

## Guardrail components present for this market (`compliance_check`)

- **KycStepper** — ASIC AML/CTF

## Components anchored to FATF (`find_by_regulation`)

- **KycStepper** — FATF Rec 10
- **RegCitation** — FATF Rec 10/12
- **SanctionsScreen** — FATF Rec 6 (targeted financial sanctions)
- **UboGraph** — FATF Rec 10 (CDD)

> Not legal advice — a coverage map of the regulatory anchors this design system encodes for the market.
