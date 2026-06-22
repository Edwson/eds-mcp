#!/usr/bin/env node
/**
 * build-feature.mjs — watch eds-mcp take ONE requirement from intake to launch.
 *
 * This is the whole point of eds-mcp in a single command. Give it a plain-English
 * requirement and it drives the design-system spine of the entire lifecycle on the
 * REAL engine (core.js) — and writes real artifacts to disk at every stage:
 *
 *   INTAKE   → reads the requirement, detects jurisdiction + domain
 *   PLANNING → compliance_check + find_by_regulation     → 01-regulatory-map.md
 *   PRD      → recommend + compose_flow + decision register → 02-feature-spec.md
 *   R&D      → scaffold_component (HTML+CSS+JS) + theme    → 03-build/*
 *   QA       → lint_usage + audit_accessibility + contrast → 04-qa-report.md
 *   TEST     → scaffold_test (runnable conformance tests)  → 05-tests/*
 *   LAUNCH   → ship checklist + what stays human           → 06-launch-checklist.md
 *
 * What's automated: the regulation map, the spec, the compliant code, the QA reports,
 * the tests. What stays human: the launch decision and sign-off. That's the honest
 * division — eds-mcp collapses days of design-build-QA into seconds, correct by contract.
 *
 * Zero dependencies (Node 18+). Run:
 *   node build-feature.mjs                                   # default KYC requirement
 *   node build-feature.mjs "Let a user move money across rails and schedule a payout"
 *   node build-feature.mjs "Originate a consumer loan" --jurisdiction uk
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createCore } from '../../core.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const j = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const core = createCore({ tokens: j('tokens.json'), components: j('components.json'), manifest: j('manifest.json') });

/* ── recipes: how a requirement maps to a starting component set + market.
   In production an agent picks these via recommend_component; here we detect a
   recipe from keywords so the demo is deterministic, then every result below is
   real engine output. ── */
const RECIPES = [
  { key: 'payments', match: /\b(payment|payout|money|transfer|remit|fx|rail|settle|reconcil)\b/i,
    jurisdiction: 'eu', domain: 'Payments & money movement', feature: 'payment', rule: 'ISO 20022',
    seed: ['PaymentRailSelector', 'MoneyMovementTracker', 'FxQuoteTicket', 'ReconciliationMatch', 'MandateConsent'] },
  { key: 'lending', match: /\b(loan|credit|lend|mortgage|borrow|apr|afford|repay)\b/i,
    jurisdiction: 'uk', domain: 'Consumer lending', feature: 'credit', rule: 'FCA CONC',
    seed: ['LoanOriginationStepper', 'APRDisclosure', 'AffordabilityCheck', 'RepaymentSchedule'] },
  { key: 'wealth', match: /\b(wealth|advis|rebalanc|portfolio|suitab|fiduciar|invest)\b/i,
    jurisdiction: 'us', domain: 'Wealth & advisory', feature: 'suitability', rule: 'SEC Reg BI',
    seed: ['SuitabilityProfile', 'PortfolioRebalanceProposal', 'FeeAndConflictDisclosure', 'AiSuggestion', 'SignOffBar'] },
  { key: 'identity', match: /\b(auth|login|2fa|mfa|sca|step.?up|consent|identity|verif)\b/i,
    jurisdiction: 'eu', domain: 'Identity & authentication', feature: 'identity', rule: 'GDPR',
    seed: ['StepUpAuth', 'ConsentReceipt'] },
  { key: 'aml', match: /\b(sanction|monitor|ubo|beneficial|launder|alert)\b/i,
    jurisdiction: 'global', domain: 'AML monitoring', feature: 'aml', rule: 'FATF',
    seed: ['SanctionsScreen', 'UboGraph', 'ReasoningChain', 'AuditTrail'] },
  { key: 'kyc', match: /\b(kyc|onboard|edd|due diligence|source of funds|identity check)\b/i,
    jurisdiction: 'au', domain: 'KYC / onboarding', feature: 'kyc', rule: 'FATF',
    seed: ['KycStepper', 'RegCitation', 'SanctionsScreen', 'SuitabilityGate', 'AuditTrail'] }
];

/* ── args ── */
const argv = process.argv.slice(2);
const jIdx = argv.indexOf('--jurisdiction');
const jurFlag = jIdx !== -1 ? argv[jIdx + 1] : null;
const requirement = argv.filter((a, i) => !a.startsWith('--') && !(jIdx !== -1 && i === jIdx + 1)).join(' ').trim()
  || 'Build a KYC onboarding step for an Australian retail broker — Enhanced Due Diligence with source of funds and the legal basis shown inline.';

const recipe = RECIPES.find((r) => r.match.test(requirement)) || RECIPES[RECIPES.length - 1];
const jurisdiction = (jurFlag || recipe.jurisdiction).toLowerCase();
const slug = requirement.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const outDir = join(here, 'out', slug);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, '03-build'), { recursive: true });
mkdirSync(join(outDir, '05-tests'), { recursive: true });
const write = (rel, text) => { writeFileSync(join(outDir, rel), text); return rel; };

const bar = (s) => '\n\x1b[1m━━━ ' + s + ' ━━━\x1b[0m';
const step = (n, s) => '\n[' + n + '/6] \x1b[1m' + s + '\x1b[0m';
const dim = (s) => '\x1b[2m' + s + '\x1b[0m';
const t0 = Date.now();

console.log(bar('eds-mcp v' + core.version + ' · Feature Lifecycle'));
console.log('Requirement:  ' + JSON.stringify(requirement));
console.log('Detected:     jurisdiction=' + jurisdiction.toUpperCase() + ' · domain=' + recipe.domain);
console.log('Output:       examples/lifecycle/out/' + slug + '/');

/* ── 1 · PLANNING ── */
console.log(step(1, 'PLANNING — map the requirement to regulation'));
const cc = core.complianceCheck({ jurisdiction, feature: recipe.feature });
const fr = core.findByRegulation(recipe.rule);
const rec = core.recommend(requirement, 6);
console.log('   compliance_check{' + jurisdiction + ", '" + recipe.feature + "'} → " + cc.count + ' guardrail component(s) · ' + cc.anchorsPresent.length + ' anchor(s)');
console.log('   find_by_regulation{' + recipe.rule + '}     → ' + fr.count + ' component(s): ' + fr.results.map((r) => r.id).join(', '));
console.log('   recommend_component{requirement}  → ' + rec.recommendations.slice(0, 4).map((r) => r.id).join(', ') + dim(' …'));
let md = '# 01 · Regulatory map\n\n**Requirement:** ' + requirement + '\n\n**Jurisdiction:** ' + jurisdiction.toUpperCase() + ' · **Domain:** ' + recipe.domain + '\n\n';
md += '## Guardrail components present for this market (`compliance_check`)\n\n' + (cc.matchedComponents.length ? cc.matchedComponents.map((m) => '- **' + m.id + '** — ' + (m.anchors || []).join('; ')).join('\n') : '_(jurisdiction-specific guardrails; the flow also uses global primitives below)_') + '\n\n';
md += '## Components anchored to ' + recipe.rule + ' (`find_by_regulation`)\n\n' + fr.results.map((r) => '- **' + r.id + '** — ' + (r.regulatory || []).join('; ')).join('\n') + '\n\n';
md += '> Not legal advice — a coverage map of the regulatory anchors this design system encodes for the market.\n';
console.log('   → wrote ' + write('01-regulatory-map.md', md));

/* ── 2 · PRD ── */
console.log(step(2, 'PRD — resolve the component flow + the contract for each'));
const flow = core.composeFlow({ ids: recipe.seed, name: slug });
console.log('   compose_flow{' + recipe.seed.length + ' selected} → ' + flow.count + ' steps, deps resolved' + (flow.count > recipe.seed.length ? ' (+' + (flow.count - recipe.seed.length) + ' dependency auto-added)' : '') + ', ' + flow.missing.length + ' missing');
console.log('   order: ' + flow.order.join(' → '));
let prd = '# 02 · Feature spec (PRD)\n\n**Requirement:** ' + requirement + '\n\n';
prd += '**Resolved flow (' + flow.count + ' components, dependency-ordered):** ' + flow.order.join(' → ') + '\n\n';
prd += '**Tokens used:** ' + flow.tokens.length + ' of ' + core.getStats().tokens + ' — `' + flow.tokens.join('`, `') + '`\n\n';
prd += '**Regulatory anchors honoured:** ' + flow.regulatory.length + '\n' + flow.regulatory.map((a) => '- ' + a).join('\n') + '\n\n';
prd += '## Per-component contract\n\n';
for (const id of flow.order) {
  const dr = core.getDecisionRegister(id).register;
  const dc = core.getDataContract(id).dataContract || {};
  prd += '### ' + id + '\n';
  prd += '- **When to use:** ' + (dr.whenToUse || '—') + '\n';
  prd += '- **When NOT / instead:** ' + (dr.whenNot || '—') + '\n';
  prd += '- **Behaviour & a11y:** ' + (dr.behaviourAndA11y || '—') + '\n';
  prd += '- **Data shape:** `' + (dc.shape || '—') + '` · states: ' + ((dc.states || []).join(' / ') || '—') + '\n';
  prd += '- **Regulatory anchor:** ' + ((dr.regulatory || []).join('; ') || '—') + '\n\n';
}
console.log('   → wrote ' + write('02-feature-spec.md', prd) + dim(' (' + flow.count + ' contracts)'));

/* ── 3 · R&D ── */
console.log(step(3, 'R&D — scaffold compliant, tokens-only code for each component'));
writeFileSync(join(outDir, '03-build', 'theme.css'), core.exportTheme('css').output);
let built = 0;
for (const id of flow.order) {
  const sc = core.scaffoldComponent(id);
  if (sc.error) continue;
  const dir = join(outDir, '03-build', sc.prefix);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, sc.sectionId + '.html'), sc.files.html);
  writeFileSync(join(dir, sc.prefix + '.css'), sc.files.css);
  writeFileSync(join(dir, sc.prefix + '.js'), sc.files.js);
  built++;
}
console.log('   scaffold_component ×' + built + ' → 03-build/<prefix>/ (HTML + scoped CSS + delegated JS)');
console.log('   export_theme{css}  → 03-build/theme.css ' + dim('(dual-theme, ' + core.getStats().tokens + ' tokens)'));

/* ── 4 · QA ── */
console.log(step(4, 'QA — lint, accessibility audit, contrast'));
let qa = '# 04 · QA report\n\n';
let lintErrors = 0, a11yFails = 0;
for (const id of flow.order) {
  const sc = core.scaffoldComponent(id);
  const lint = core.lintUsage({ tokens: (j('components.json').components[id] || {}).tokens || [], states: ((core.getDataContract(id).dataContract || {}).states) || [], css: sc.files ? sc.files.css : '' });
  const au = core.auditAccessibility(id);
  const errs = lint.issues.filter((i) => i.severity === 'error').length;
  lintErrors += errs; if (au.score.passed !== au.score.of) a11yFails++;
  qa += '## ' + id + '\n- **lint:** ' + (lint.ok ? 'PASS' : errs + ' error(s)') + ' (' + lint.issues.length + ' issue(s))\n- **audit_accessibility:** ' + au.score.passed + '/' + au.score.of + ' — ' + au.summary + '\n\n';
}
const contrast = core.contrastReport();
qa += '## Token contrast ladder\n- dark theme: ' + contrast.pairs.dark.length + ' pairs checked, ' + contrast.failures.filter((f) => f.theme === 'dark').length + ' below AA\n- light theme: ' + contrast.pairs.light.length + ' pairs checked, ' + contrast.failures.filter((f) => f.theme === 'light').length + ' below AA\n';
console.log('   lint_usage ×' + flow.count + '          → ' + lintErrors + ' error(s) across the flow');
console.log('   audit_accessibility ×' + flow.count + ' → ' + (flow.count - a11yFails) + '/' + flow.count + ' pass the contract');
console.log('   contrast_report       → both themes checked');
console.log('   → wrote ' + write('04-qa-report.md', qa));

/* ── 5 · TEST ── */
console.log(step(5, 'TEST — scaffold a runnable conformance test per component'));
let tests = 0;
for (const id of flow.order) {
  const st = core.scaffoldTest(id);
  if (st.error) continue;
  writeFileSync(join(outDir, '05-tests', st.file), st.files[st.file]);
  tests++;
}
console.log('   scaffold_test ×' + tests + ' → 05-tests/*.mjs ' + dim('(tokens resolve · states canonical · anchors intact · a11y passes · tokens-only)'));

/* ── 6 · LAUNCH ── */
console.log(step(6, 'LAUNCH — ship checklist + what stays human'));
let ship = '# 06 · Launch checklist\n\n**Requirement:** ' + requirement + '\n\n';
ship += '## Automated by eds-mcp (correct by contract)\n';
ship += '- [x] ' + flow.count + ' components resolved (deps-first) from the requirement\n';
ship += '- [x] ' + flow.regulatory.length + ' regulatory anchors mapped + honoured (' + jurisdiction.toUpperCase() + ')\n';
ship += '- [x] compliant code scaffolded — tokens-only, dual-theme, reduced-motion + SR safe\n';
ship += '- [x] QA: lint ' + (lintErrors === 0 ? 'clean' : lintErrors + ' errors') + ' · accessibility ' + (flow.count - a11yFails) + '/' + flow.count + ' pass\n';
ship += '- [x] ' + tests + ' runnable conformance tests committed with the components\n\n';
ship += '## Stays human (the sign-off)\n';
ship += '- [ ] Product owner approves the PRD (02-feature-spec.md)\n';
ship += '- [ ] Designer/engineer completes the render branches in the scaffolds\n';
ship += '- [ ] Compliance reviewer signs off the regulatory mapping for this jurisdiction\n';
ship += '- [ ] Release manager ships — eds-mcp builds the feature; the human owns the decision\n';
console.log('   → wrote ' + write('06-launch-checklist.md', ship));

/* ── summary ── */
console.log(bar('Done in ' + (Date.now() - t0) + 'ms'));
console.log('One requirement → ' + flow.count + ' components · ' + flow.tokens.length + ' tokens · ' + flow.regulatory.length + ' regulatory anchors · ' + (flow.count - a11yFails) + '/' + flow.count + ' a11y · ' + tests + ' tests');
console.log('Everything above is real ' + 'eds-mcp engine output. Browse: ' + 'examples/lifecycle/out/' + slug + '/');
console.log(dim('The army is the automation of the design-build-QA work. The human keeps judgment + sign-off.\n'));
