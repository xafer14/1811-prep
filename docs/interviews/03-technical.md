---
topic: technical interview (Round C)
owner: aras
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [owner interview 2026-11-24, docs/research/stack-hosting-ci.md, docs/research/security-baseline.md]
superseded_by:
---
# Round C: Technical

All items: default proposed by the agent, accepted 2026-11-24 when the owner said to start and correct later. Versions read from the npm registry on 2026-11-24.

1. Framework: Astro (7.4.13), static output. Why: content collections, built-in hash CSP, little shipped JS.
2. Interactive tool: one Svelte island (@astrojs/svelte 9.1.6, svelte 5.59.1). Why: small runtime, compile-time a11y warnings.
3. TypeScript 6.x (6.0.3) with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Why: typescript-eslint 8.74.0 peer range is `<6.1.0`; TS 7 breaks it.
4. Styling: Astro scoped CSS + CSS custom properties; no Tailwind. Why: no extra dependency; modern CSS is enough.
5. Data: standards as typed content collections (JSON/YAML in repo); schema requires `source`, `verifiedAt`, evidence level (`read` | `excerpt`). No database, auth, or API in MVP. Tool inputs live in memory only (no localStorage).
6. Hosting: Cloudflare Workers static assets; security headers via `_headers`. Newsletter: Kit (form integration details in Round E).
7. Tests: Vitest (100% branch coverage on scoring logic, table-driven from official tables); Playwright e2e + axe on every route; Lighthouse CI budget >= 90 in all categories.
8. Tooling: npm; ESLint flat config + typescript-eslint; Prettier; lefthook pre-commit (gitleaks + fast checks; pending install approval); GitHub Actions on Linux with SHA-pinned actions; Dependabot with cooldown.
9. Baseline target: Baseline Widely available.
10. Units: US customary input (in, lb), metric optional. (added from Round D default)
