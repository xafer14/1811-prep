---
topic: security and privacy interview (Round E)
owner: aras
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [owner instruction 2026-11-24, docs/research/security-baseline.md, docs/research/legal-privacy-us.md]
superseded_by:
---
# Round E: Security/privacy

Not asked as questions. The owner chose on 2026-11-24 to proceed with agent defaults and correct later. Every item below is an unreviewed default.

1. Data stored by us: none server-side. Newsletter email is stored only at the email provider (Kit) until unsubscribe.
2. Tool inputs (height, weight, waist, age, sex, activity, self-test results): memory only; never logged, never in URLs, never sent to analytics or third-party scripts. A network audit runs before launch, then each release.
3. Auth: none in MVP. ASVS 5.0 Level 1 for MVP; selected L2 controls when accounts ship.
4. Headers: Astro hash-based CSP; HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, frame-ancestors via `_headers`.
5. Newsletter form: posts to the provider's form endpoint; honeypot field; unchecked "I am 18 or older" box; double opt-in if the provider supports it on the free plan (unverified). Turnstile only if spam appears.
6. Analytics: none in MVP, so no consent banner. A cookieless tool needs a proposal.
7. Secrets: none in the repo; deploy token only in GitHub Actions secrets; names listed in `.env.example`. gitleaks pre-commit + CI (pending install approval).
8. Supply chain: `npm ci` in CI, Dependabot with cooldown, SHA-pinned actions, MFA on GitHub, Cloudflare, registrar, email.
9. Legal before public launch: one-time US attorney review (privacy policy, terms, disclaimers, MHMDA/Nevada/Connecticut, FTC HBNR) plus a Turkish KVKK check; US virtual mailbox address before the first newsletter send.
10. Military and agency names: plain-text factual use only; site-wide non-affiliation disclaimer.
11. Minors: tool open to 17+; newsletter 18+.
