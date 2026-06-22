# 02 · Feature spec (PRD)

**Requirement:** originate a consumer loan

**Resolved flow (4 components, dependency-ordered):** APRDisclosure → AffordabilityCheck → LoanOriginationStepper → RepaymentSchedule

**Tokens used:** 13 of 51 — `accent2`, `border`, `border2`, `gold`, `green`, `radius.md`, `red`, `space.3`, `space.4`, `surface`, `surface2`, `text1`, `text2`

**Regulatory anchors honoured:** 8
- TILA / Reg Z 12 CFR 1026.18 (APR + finance charge disclosure)
- UK FCA CONC 4.2 (APR prominence)
- UK FCA CONC 5 (creditworthiness & affordability)
- ECOA / Reg B (consistent, non-discriminatory assessment)
- TILA / Reg Z 12 CFR 1026 (cost-of-credit disclosure)
- ECOA / Reg B 12 CFR 1002 (fair lending, no prohibited-basis fields)
- UK FCA CONC 4 (pre-contract disclosure)
- TILA / Reg Z 12 CFR 1026.18(g) (payment schedule)

## Per-component contract

### APRDisclosure
- **When to use:** Beside any credit offer, before the borrower commits.
- **When NOT / instead:** Marketing teasers without a firm offer — those need representative-APR framing, not this box.
- **Behaviour & a11y:** APR labelled as the most prominent figure; the four federal boxes are a table with headers, not colour-coded cells.
- **Data shape:** `{ apr, financeCharge, amountFinanced, totalOfPayments }` · states: loading / error
- **Regulatory anchor:** TILA / Reg Z 12 CFR 1026.18 (APR + finance charge disclosure); UK FCA CONC 4.2 (APR prominence)

### AffordabilityCheck
- **When to use:** Before approval on any consumer-credit origination.
- **When NOT / instead:** Hard credit-bureau scoring — that is a backend decision, not this surface.
- **Behaviour & a11y:** Verdict stated in words (sustainable / caution / not affordable) with the ratio shown; failure blocks progression with a clear reason.
- **Data shape:** `{ dti, residualIncome, verdict, reasons }` · states: loading / empty / error / stale
- **Regulatory anchor:** UK FCA CONC 5 (creditworthiness & affordability); ECOA / Reg B (consistent, non-discriminatory assessment)

### LoanOriginationStepper
- **When to use:** Any flow that takes a borrower from quote to signed loan agreement.
- **When NOT / instead:** Servicing an existing loan — use RepaymentSchedule; collections — use CollectionsNotice.
- **Behaviour & a11y:** One decision per step; APR and total cost shown in words and figures before SIGN; SIGN is the only irreversible control and is gated behind explicit consent.
- **Data shape:** `{ amount, apr, totalRepayable, schedule, decision }` · states: loading / empty / error / stale
- **Regulatory anchor:** TILA / Reg Z 12 CFR 1026 (cost-of-credit disclosure); ECOA / Reg B 12 CFR 1002 (fair lending, no prohibited-basis fields); UK FCA CONC 4 (pre-contract disclosure)

### RepaymentSchedule
- **When to use:** Loan agreement review and ongoing servicing.
- **When NOT / instead:** A single next-payment reminder — that is a lighter notice, not the full table.
- **Behaviour & a11y:** Scrollable data table with row/column headers; running balance announced; current period marked in text, not colour alone.
- **Data shape:** `{ rows:[{ n, principal, interest, balance }] }` · states: loading / empty / error
- **Regulatory anchor:** TILA / Reg Z 12 CFR 1026.18(g) (payment schedule)

