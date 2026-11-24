---
topic: research-index
owner: ozan
status: current
last_verified: 2026-11-24
review_by: 2026-12-24
sources: [docs/research/domain-1811-hiring.md, docs/research/competitors.md, docs/research/stack-hosting-ci.md, docs/research/security-baseline.md, docs/research/a11y-perf-seo.md, docs/research/legal-privacy-us.md]
superseded_by:
---
# Research index (Phase 2, 2026-11-24)

Synthesis of the six notes below. Facts live in the notes; this file only indexes them and lists decisions, risks, and contradictions. Recommendations here are inputs to interview Rounds B-E, not decisions.

| Note | Scope | review_by |
|---|---|---|
| [domain-1811-hiring](domain-1811-hiring.md) | GS-1811 series, per-agency requirements, FLETC, hiring channels | 2027-02-22 |
| [competitors](competitors.md) | Paid/free prep products, gaps, name check, monetization patterns | 2026-12-24 |
| [stack-hosting-ci](stack-hosting-ci.md) | Framework, hosting free tiers, email provider, CI, tooling versions | 2026-12-24 |
| [security-baseline](security-baseline.md) | OWASP Top 10 2025, ASVS 5.0, headers/CSP, bot protection, supply chain, secrets | 2027-02-22 |
| [a11y-perf-seo](a11y-perf-seo.md) | WCAG 2.2 AA, US accessibility law, Core Web Vitals, Baseline, SEO | 2027-02-22 |
| [legal-privacy-us](legal-privacy-us.md) | US privacy, CAN-SPAM, affiliation/impersonation law, copyright, KVKK/GDPR; addendum: health data, minors, military marks (information only) | 2027-02-22 |
| [fitness-standards-military](fitness-standards-military.md) | SINGLE OWNER of military fitness-test and body-composition figures (6 branches, accession, special ops names) | 2027-02-22 |
| [fitness-standards-federal](fitness-standards-federal.md) | SINGLE OWNER of federal 1811 agency fitness-test figures and FLETC PEB | 2027-02-22 |
| [fitness-assessment-validity](fitness-assessment-validity.md) | BMI/WHtR/tape validity, predictors of test success, self-report limits, safety screening, uncertainty display | 2027-05-23 |

## Addendum 2026-11-24: scope change (Round B)
Owner widened scope to military branches + all federal 1811 agencies and chose a hybrid readiness tool ([02-product](../interviews/02-product.md)). Items 1-3 in "Round B: Product" below are superseded by that interview.

Status 2026-11-24: A1-A5 and A7 decided in [02-product](../interviews/02-product.md); A6 and A8 decided in [05-security-privacy](../interviews/05-security-privacy.md). Rounds C-F decisions: [docs/interviews](../interviews/).

Decisions this research raised:
- A1. Body composition: several services replaced height/weight tables with waist-to-height ratio (Army: WHtR < 0.55 is the only standard per Army Directive 2026-13, read; Marine Corps <= 0.52; Navy/Air Force 0.55; Coast Guard still waist-based under review). The tool needs a waist input and per-service method with an as-of date. Conflicts with step 1 of the hybrid model as written.
- A2. Scoring at launch: only Army AFT (military) and ICE/HSI PFT-P and USSS APAT (federal) were read from primary pages; the rest is excerpt-level. Options: calculators only for read-level tests, others link-out until a human verifies the live pages.
- A3. MVP federal scope: validity note recommends military only at launch; owner accepted 5 federal agencies. FBI and DEA figures are not primary-verified.
- A4. Safety screen before training guidance: custom ACSM-style questions + PAR-Q+ link (embedding terms unknown). Time-to-ready as a labeled range in weeks; no injury flag.
- A5. Result framing: numeric per-event comparison, no "readiness" verdict (legal + validity notes agree).
- A6. Privacy: tool inputs may be consumer health data under Washington MHMDA / Nevada / Connecticut (no size floor). Browser-only processing is strong but untested as an exemption; no analytics, logs, URLs or third-party scripts may carry inputs. Add MHMDA/HBNR to the attorney review.
- A7. Minors: tool open to 17+, newsletter 18+ with an unchecked age box.
- A8. Military names: plain-text factual use only; no logos or seals (permission not documented for logos).

## Decisions needed (by interview round)

### Round B: Product
1. First interactive tool: eligibility screener (domain note) vs fitness-test tracker (competitors note). The notes disagree; see Contradictions.
2. Agencies at launch: FBI only / top 5 (FBI, DEA, ATF, USSS, HSI) / all. Competitors note recommends top 5.
3. Fitness score tables: link only vs reproduce with attribution (domain note: link for FBI/DEA, reproduce ATF/FLETC only after reading live pages).
4. Monetization: none / disclosed affiliates later / ads. Competitors note recommends ad-free launch. Any monetization rules out Vercel Hobby (stack note).
5. AI-assisted drafting: allowed with named human review and disclosure (a11y-perf-seo note).
6. Name and domain: "1811 Prep" not found in use (web search only, not trademark clearance); "1811" is jargon, so a descriptive tagline helps.

### Round C: Technical
7. Framework: Astro (stack + security notes) vs SvelteKit vs Next.js.
8. Host: Cloudflare Workers static assets (stack note); Vercel Hobby is non-commercial; Netlify Free pauses sites at the credit cap.
9. TypeScript pin `^6` (7.x breaks typescript-eslint and @astrojs/check peers); npm over pnpm; lefthook vs no hooks at MVP.
10. Email provider: Kit Free (500 subscribers at $0; double opt-in unverified).
11. Baseline target: Widely available (a11y-perf-seo note). Structured data: Article/Breadcrumb/Organization only.

### Round D: Design/UX
12. Accessibility target: WCAG 2.2 AA.
13. Branding: no agency names in brand or domain, no seals or look-alike imagery, site-wide non-affiliation disclaimer (legal + domain notes).

### Round E: Security/privacy
14. ASVS L1 for MVP, L2 auth/session controls when accounts ship.
15. CSP via Astro built-in hash CSP; headers set in code for any SSR route (`_headers` covers static files only).
16. Bot protection: honeypot + Turnstile, or honeypot + Altcha (self-hosted).
17. Secret scanning: gitleaks pre-commit + CI (GitHub secret scanning on private personal repos appears paid). Updates: Dependabot with cooldown.
18. Analytics: cookieless tool, no banner, or none. Tool data: browser-only storage.
19. CAN-SPAM postal address for an overseas operator: US virtual mailbox (CMRA).
20. Legal review: one-time US attorney review + Turkish KVKK check before launch.

## Cross-note contradictions
- Body composition: hybrid step 1 (height/weight tables) vs current service policy (WHtR); see A1.
- Federal launch scope: validity note (military only) vs accepted MVP (5 federal agencies); see A3.
- Air Force fitness start date (2026-07-01 vs 2026-09-01) and max age (42 vs 41); FBI PFT points (9/10/12) and events; DEA PTA versions. Details in the fitness-standards notes.
- First tool (superseded 2026-11-24 by Round B): domain note recommends an eligibility screener (age/education variance is core and verifiable); competitors note recommends a fitness tracker (repeat visits, official FBI app is only a simulator).
- FBI entry age: 36 (domain note, current guide), 38 (an FBI-hosted copy, per domain and legal notes), 37 (third-party sites, competitors note). Must be verified on the live page before publishing.
- Agency-level figures (age caps, fitness standards, academy lengths) conflict within and across sources; full list in domain-1811-hiring.md.
- Vercel Hobby commercial use and Netlify commercial use: wording only partly read; treat Vercel as non-commercial.

## Top risks
1. Implied federal affiliation (18 U.S.C. 701/709, FTC Impersonation Rule): design and copy rules needed from day one.
2. Stale or wrong hiring facts on a YMYL-adjacent site: every fact needs a source and verified date; review cadence is mandatory.
3. npm/GitHub Actions supply-chain compromise (2025-2026 incidents): `npm ci`, install cooldown, pinned Action SHAs, MFA.
4. Copying or paraphrasing official test content: practice content must be original.
5. KVKK applicability to a Turkey-based operator is unsettled.
6. Solo-owner scope creep across many agencies.
7. Lighthouse >= 90 can regress from a single third-party script or image.

## Verification gaps
- fbijobs.gov, dea.gov, atf.gov, usmarshals.gov and most of secretservice.gov returned HTTP 403 to automated fetch; many agency facts are search-excerpt level and marked "(excerpt)". A human must check them in a real browser before publishing.
- federalregister.gov and ecfr.gov redirected to an unblock page; the FTC rule text and the ADA Title II interim rule were not read directly.

## Injected instructions seen (none acted on)
- Vercel docs pages: "For AI agents" blocks urging `npx plugins add vercel/vercel-plugin`.
- Cloudflare static-assets page front matter pointing to a search endpoint; Next.js docs pointing to llms.txt.
