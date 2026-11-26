# Backlog

Owner: aras. Ordered by priority. Status: todo | doing | done | blocked.

| ID | User story / item | Acceptance criteria | Owner | Status |
|---|---|---|---|---|
| B-001 | As the owner, I verify official standards in a real browser so calculators use primary data. | Checklist: [docs/verification/live-page-checklist.md](verification/live-page-checklist.md). 2026-11-24: owner sent 15 PDFs; DEA, Army, Navy, USMS, USPIS, HSI and USSS done; FBI and ATF fitness done (age lines open); Marine Corps, Air Force, State DSS, FLETC partial; Space Force, Coast Guard, DCIS missing. Research notes updated. | ozan + owner | doing |
| B-002 | Content schema for organizations and standards. | Done 2026-11-24: collections `organizations`, `standards`, `bodyComposition` in `src/content.config.ts`; schema requires `source`, `verifiedAt`, `evidence`; build fails on invalid data; overlapping age bands are rejected. Open: points-based type (FBI, DEA, Secret Service). | baran | doing |
| B-003 | As a candidate, I compare my self-test results and body measurements to one organization's minimums. | Logic done 2026-11-24 (`src/lib/standards/evaluate.ts`, 93 unit tests): Army AFT (with combat variant), Navy PRT, ATF, US Marshals, HSI per-event comparison with margin; Army and Navy waist-to-height check. UI done 2026-11-26: `/readiness` (Svelte form, nothing stored or sent, axe clean in light and dark, 17 e2e tests including a privacy test). Open: points model for FBI, DEA, Secret Service (owner will supply the data); safety screen and time-to-ready range (B-004); coverage measurement (needs the `@vitest/coverage-v8` dev dependency, owner approval). | baran (logic), yigit (UI), pelin (tests) | doing |
| B-004 | Safety screen and time-to-ready range. | 5-6 question screen + PAR-Q+ link shown before guidance; range in weeks labeled "estimate"; no injury flag. | yigit, baran | todo |
| B-005 | Organization pages and compare page. | Compare page done 2026-11-26: `/compare/` shows every organization with verified data side by side by event family, for a chosen age and sex (combat option for the Army), with sources and the list of organizations not shown yet; 9 e2e tests. Open: one page per organization (`/organizations/[slug]`); remaining organizations appear as their data is entered. | yigit | doing |
| B-006 | Methodology, privacy, terms, accessibility pages. | Drafts ready for attorney review; methodology lists every rule and source. | defne + owner | todo |
| B-007 | Newsletter signup (18+). | Posts to provider; honeypot; unchecked 18+ box; no tool data in the request. | yigit, sinan | todo |
| B-008 | Security headers and hash CSP. | `_headers` + Astro CSP; securityheaders-style check passes; tool works under CSP. | sinan, yigit | todo |
| B-009 | Privacy-safe success measurement plan. | Plan for the SPEC metrics without analytics on tool inputs; proposal if a tool is needed. | derya | todo |
| B-010 | Deploy pipeline to Cloudflare. | CI deploys `main`; token only in GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). | tuna, baran | todo |
| B-011 | Network audit of tool inputs. | Recorded evidence that no input leaves the browser. | sinan | todo |
| B-012 | E2E, axe, Lighthouse CI wiring. | Done 2026-11-24: Playwright Chromium installed, `e2e/home.spec.ts` (axe WCAG 2.2 AA, no third-party requests, CSP, no console errors). Open: Lighthouse budgets >= 90 (DevTools MCP has `lighthouse_audit`); every new route added to `ROUTES`. | pelin | doing |
| B-013 | Legal review before launch. | US attorney + Turkish KVKK check done; US virtual mailbox address set. | owner | todo |
| B-014 | Final name and domain. | Name chosen; domain registered by owner. | owner | todo |
