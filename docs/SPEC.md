# 1811 Prep: Product Specification

Owner: aras. This file is the current truth for WHAT the product is and WHY. Decisions with rationale live in [decisions/](decisions/). Interview files in [interviews/](interviews/) are the historical record; where they differ from this file, this file wins.

## 1. Overview
- Working title: 1811 Prep (final name open). Repo: `1811-prep`.
- Purpose: help US candidates prepare for the physical fitness and body-composition requirements of US military branches and federal GS-1811 criminal investigator agencies. State trooper agencies come in a later phase.
- Not affiliated with any government agency or military service.

## 2. Users and problem
- Users: US military candidates (17+) and applicants to federal 1811 roles.
- Problem: standards are scattered across services and agencies, change often, and candidates cannot see how far they are from the minimums.

## 3. Success (3 months after launch; targets accepted as defaults 2026-11-24)
- 500 newsletter signups; 100 weekly active users; 40% of tool starts reach the results step; Lighthouse >= 90 in every category.

## 4. Scope
### MVP
- Organizations: Army, Navy, Marine Corps, Air Force, Space Force, Coast Guard; FBI, DEA, ATF, USSS, ICE/HSI.
- Organization pages, compare page, readiness tool, newsletter signup, methodology page, legal pages.
### Later
- Remaining federal 1811 agencies (in batches), special-operations selection standards, state trooper agencies, saved progress/accounts.
### Non-goals
- No seals, logos, insignia, or look-alike imagery; no implied affiliation.
- No reproduced official test questions; no medical, legal, or financial advice.
- No job board, forum, accounts, paid features, ads, or analytics in MVP.
- No server-side storage of tool inputs.

## 5. Readiness tool (hybrid model)
1. Body composition: each organization's current official method with its as-of date (waist-to-height ratio where adopted, so the tool asks for waist circumference; legacy methods only where still in force). BMI is shown as information only.
2. Event comparison: user enters self-test results; the tool compares each event to that organization's official minimum and shows pass/below and the margin. No overall "ready" verdict.
3. Time-to-ready: a range in weeks labeled "estimate", based on gap size and self-reported activity; shown only after the safety screen.
4. Safety screen: 5-6 ACSM-style questions plus a PAR-Q+ link before any training guidance. No injury-risk flag.
5. Scoring scope at launch: calculators only for standards read on an official page or document. Verified and entered as data as of 2026-11-26: Army AFT and Air Force PFRA with their full point scales (points per event and in total), Navy PRT, Marine Corps PFT minimums with the combat arms option, Air Force and Space Force walk, waist-to-height rules of the Army, Navy, Marine Corps, Air Force and Space Force, FBI, DEA, ATF, USSS, ICE/HSI, US Marshals (Postal Inspectors are verified but not entered yet). The Army alternate aerobic events (walk, bike, swim, row; pass or fail) are not included. Marine Corps and Space Force are shown in part and the tool lists what is still missing; the Coast Guard has no verified numbers yet (see [live-page-checklist](verification/live-page-checklist.md)).
6. Methodology page documents every rule, source, and limitation.

## 6. Content model
- Content collections (schema: `src/lib/standards/schema.ts`, data: `src/content/`): `organizations` (`kind: military | federal | state`), `standards` (events with minimums per age and sex), `bodyComposition` (waist-to-height rules). `pointStandards` (tests scored in points with a total and a minimum per event: FBI, DEA, Secret Service). Planned: `HiringStage`, `Guide` (MDX), `GlossaryTerm`.
- Every standard value carries `source` (URL), `verifiedAt` (date), and `evidence` (`read` | `excerpt`).

## 7. Routes
`/`, `/organizations`, `/organizations/[slug]`, `/compare`, `/readiness`, `/guides/[slug]`, `/methodology`, `/newsletter`, `/privacy`, `/terms`, `/accessibility`.

## 8. Non-functional requirements
- Accessibility: WCAG 2.2 AA. Baseline target: Baseline Widely available.
- Performance: Lighthouse >= 90 in all categories; Core Web Vitals "good" at p75.
- Privacy: tool inputs stay in browser memory; never logged, in URLs, or sent to third parties. Newsletter 18+.
- Security: ASVS 5.0 L1; hash-based CSP; security headers; supply-chain controls.
- Units: US customary input, metric optional. Language: US English only.

## 9. Constraints
- Solo owner; 6-8 weeks to MVP; $0 hosting; no paid APIs.
- Legal review (US attorney + Turkish KVKK check) before public launch.

## 10. Open questions
- Final product name and domain.
- AI token budget.
