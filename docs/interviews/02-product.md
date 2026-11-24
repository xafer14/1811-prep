---
topic: product interview (Round B)
owner: aras
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [owner interview 2026-11-24]
superseded_by:
---
# Round B: Product

Owner answers given directly are marked (owner). Items marked (default, accepted 2026-11-24) were proposed by the agent and accepted by the owner with "go".

## Scope (owner)
- Organizations: US military branches (Army, Navy, Marine Corps, Air Force, Space Force, Coast Guard) and all federal agencies hiring GS-1811 criminal investigators, with their fitness-test requirements.
- Later: special-operations selection fitness standards; fitness standards of all 50 state trooper agencies.

## Readiness tool: hybrid model (owner chose option b)
1. Body composition: each organization's CURRENT official method with its as-of date (waist-to-height ratio where adopted, so the tool asks for waist circumference; legacy methods only where still in force). BMI is shown as information, not as a verdict. (B9, default accepted 2026-11-24; replaces "height/weight tables")
2. Event gap: user enters self-test results per event (e.g., push-ups, run time); the tool compares them to that organization's official minimums.
3. Activity level: used only for a time-to-ready estimate, shown as a range and labeled "estimate".
- The algorithm is ours and documented on a methodology page. No medical claims; pre-exercise safety screening shown before training suggestions (details pending research).
- Rejected: (a) pass/fail verdict from BMI + activity alone (not valid, deceptive-claims risk); (c) band-only output.
- Results are per-event numeric comparisons with margins; no overall "ready" verdict. (B11, default accepted 2026-11-24)
- Safety: a 5-6 question ACSM-style screen plus a PAR-Q+ link is shown before any training guidance. Time-to-ready is a range in weeks labeled "estimate". No injury-risk flag. (B11, default accepted 2026-11-24)

## Scoring scope at launch (B10, default accepted 2026-11-24)
- Calculators only for tests whose standards were read on an official page: Army AFT, ICE/HSI PFT-P, USSS APAT.
- All other organizations: official minimums shown as "unverified, check source" with a link, until the owner verifies the live page in a browser (checklist item in [backlog](../backlog.md)).
- The 5-federal-agency MVP scope stays; FBI, DEA, ATF are link-out until verified.

## MVP cut line (default, accepted 2026-11-24)
- Timeline stays 6-8 weeks. MVP: 6 military branches + 5 federal agencies (FBI, DEA, ATF, USSS, HSI), compare page, readiness tool, newsletter signup, legal pages.
- Remaining federal 1811 agencies added in batches after MVP. Special operations: post-MVP. State troopers: later phase, no research or routes now.

## Minors (default, accepted 2026-11-24; final after legal research)
- 17-year-olds may use the tool; no tool data is stored; newsletter signup is 18+.

## Name (default, accepted 2026-11-24)
- "1811 Prep" stays the working title; final name decided later.

## User stories (default, accepted 2026-11-24)
- As a candidate, I see each organization's fitness and body-composition requirements side by side, each with source and verified date.
- As a candidate, I enter my measurements and self-test results and see where I stand against a chosen organization's minimums.
- As a candidate, I see an estimated time-to-ready range based on my activity level.
- As a candidate, I see the hiring/accession stages relevant to fitness.
- As a subscriber (18+), I get an email when a standard I follow changes.

## Non-goals (default, accepted 2026-11-24)
- No agency or military seals, logos, or look-alike imagery; no implied affiliation.
- No reproduced official test questions; no medical, legal, or financial advice.
- No job board, forum, user accounts, or paid features in MVP.
- No server-side storage of tool inputs; tool inputs never sent to analytics.

## Content model and routes (default, accepted 2026-11-24)
- `Organization` with `kind: military | federal | state`; each requirement field carries `source` and `verifiedAt`.
- `FitnessTest` (events, minimums per bracket), `BodyCompositionStandard`, `HiringStage`, `Guide` (MDX), `GlossaryTerm`.
- Routes: `/`, `/organizations`, `/organizations/[slug]`, `/compare`, `/readiness`, `/guides/[slug]`, `/methodology`, `/newsletter`, `/privacy`, `/terms`, `/accessibility`. No state routes until that phase.

## Monetization and AI content (default, accepted 2026-11-24)
- No ads or affiliate links at launch; clearly disclosed affiliates may come later.
- AI-assisted drafting allowed; owner reviews every text; every fact cites a source.

## Research triggered by this round
- [fitness-standards-military](../research/fitness-standards-military.md), [fitness-standards-federal](../research/fitness-standards-federal.md), [fitness-assessment-validity](../research/fitness-assessment-validity.md), addendum in [legal-privacy-us](../research/legal-privacy-us.md).
