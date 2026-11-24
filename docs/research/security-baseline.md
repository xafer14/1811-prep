---
topic: security-baseline
owner: ozan
status: current
last_verified: 2026-11-24
review_by: 2027-02-22
sources: [https://owasp.org/www-project-top-ten/, https://top10.owasp.org/2025, https://asvs.owasp.org/, https://devguide.owasp.org/03-requirements/05-asvs, https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP, https://docs.astro.build/en/reference/configuration-reference/, https://svelte.dev/docs/kit/configuration, https://nextjs.org/docs/app/guides/content-security-policy, https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html, https://developers.cloudflare.com/pages/configuration/headers/, https://developers.cloudflare.com/workers/static-assets/headers/, https://vercel.com/docs/project-configuration/vercel-json, https://vercel.com/docs/headers, https://vercel.com/docs/limits/fair-use-guidelines, https://vercel.com/docs/plans/hobby, https://docs.netlify.com/manage/routing/headers/, https://developers.cloudflare.com/turnstile/, https://developers.cloudflare.com/waf/rate-limiting-rules/, https://altcha.org/docs/, https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html, https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html, https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html, https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html, https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API, https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning, https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection, https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security, https://github.blog/changelog/2025-03-04-introducing-github-secret-protection-and-github-code-security/, https://github.com/gitleaks/gitleaks, https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference, https://docs.renovatebot.com/configuration-options/, https://docs.npmjs.com/trusted-publishers, https://docs.npmjs.com/cli/v11/commands/npm-audit, https://docs.npmjs.com/cli/v11/using-npm/config, https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem, https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/, https://tanstack.com/blog/npm-supply-chain-compromise-postmortem, https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/]
superseded_by:
---

All facts below were read on 2026-11-24 from the URL given inline. "(unverified)" = not confirmed from a primary page I could read.

## Summary

- OWASP Top 10 current edition is 2025 (https://owasp.org/www-project-top-ten/, 2026-11-24). "Software Supply Chain Failures" is new at A03 (https://top10.owasp.org/2025, 2026-11-24).
- ASVS current is 5.0.0, published 30 May 2025 (https://asvs.owasp.org/, 2026-11-24). Recommend Level 1 as the MVP floor and selected Level 2 items once accounts exist.
- Headers: set CSP (with `frame-ancestors`, `object-src 'none'`, `base-uri`), HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP. CSP is the one that needs framework care.
- Static output + hash-based CSP is the cheapest route. Nonces force per-request rendering (Next.js docs state this; MDN agrees nonces cannot work with static HTML).
- Static-host header files (`_headers`) do not apply to SSR/Function responses on Cloudflare or Netlify. SSR code must set its own headers.
- Signup form: server-side validation, double opt-in, Origin/Sec-Fetch-Site check, honeypot plus a privacy-friendly challenge (Turnstile or Altcha), edge rate limit.
- Supply chain is the most likely real-world threat to a solo Node project: lockfile + `npm ci`, install cooldown, `ignore-scripts`, pinned Actions SHAs, phishing-resistant MFA.
- Provenance and trusted publishing are not sufficient: the May 2026 TanStack malware carried valid provenance (https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/, 2026-11-24).
- GitHub secret scanning for private repos needs a paid product per the docs I read. Plan on gitleaks pre-commit plus CI instead.
- Auth is deferred; prefer passkeys (WebAuthn is Baseline widely available) or a vetted provider over hand-rolled passwords.

## Findings

### 1. OWASP Top 10 and ASVS
- Top 10 2025 list (https://top10.owasp.org/2025, 2026-11-24): A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions. Release date not stated on the page (unverified).
- ASVS 5.0.0 is current, published 30 May 2025 (https://asvs.owasp.org/, 2026-11-24). That page does not define levels.
- Levels (from a search summary of OWASP Developer Guide pages, not read directly: https://devguide.owasp.org/03-requirements/05-asvs, 2026-11-24): L1 first steps/automated checks, L2 most applications, L3 high-value/high-safety. Requirement counts by level vary by source (see Contradictions).
- Fit: a content site with an email list holds low-sensitivity data. L1 is a valid choice. Adopt L2 items for authentication/session chapters when accounts ship, because they will hold credentials and personal data.

### 2. Security headers
- OWASP recommended values (https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html, 2026-11-24): `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: geolocation=(), camera=(), microphone=()` (disable all unused features); `X-Content-Type-Options: nosniff`; `Cross-Origin-Opener-Policy: same-origin`; `Cross-Origin-Resource-Policy: same-site`; COEP `require-corp` only after testing; do not set `X-XSS-Protection` (or set `0`). HSTS preload can lock users out for the full max-age if misconfigured.
- Clickjacking: `Content-Security-Policy: frame-ancestors 'none'` unless embedding is needed; it supersedes X-Frame-Options (https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP, 2026-11-24). Meta-tag CSP cannot carry `frame-ancestors` or report-only (same MDN page; also SvelteKit docs https://svelte.dev/docs/kit/configuration, 2026-11-24). So `frame-ancestors` must be an HTTP header.
- Strict CSP baseline from MDN: `script-src` with nonce or hash, `object-src 'none'`, `base-uri 'none'`. Allowlist-based CSPs are hard to maintain. `'strict-dynamic'` lets a trusted script load others but does not help if trusted scripts build script elements from attacker input.
- Nonce vs hash (MDN): nonce = new random value per response, needs server rendering; hash = digest of script, fine for static pages, must be recomputed when scripts change.
- Astro: built-in `security.csp` added in astro@6.0.0 (https://docs.astro.build/en/reference/configuration-reference/, 2026-11-24). It emits a `<meta http-equiv>` tag with hashes for scripts and styles, has `scriptDirective.strictDynamic` (default false). Limits per docs: no external scripts/styles out of the box, no `<ClientRouter />` view transitions, no Shiki, inactive in dev. Only first 100,000 of 123,109 characters of that page were read.
- SvelteKit: `kit.csp` with `mode: 'hash' | 'nonce' | 'auto'` (auto = hashes for prerendered, nonces for dynamic) and `reportOnly` (https://svelte.dev/docs/kit/configuration, 2026-11-24). Prerendered pages get a meta tag, which ignores `frame-ancestors`, `report-uri`, `sandbox`.
- Next.js: nonce CSP via `proxy.ts`; requires dynamic rendering, disables static optimization/ISR, PPR incompatible. Hash route is experimental SRI (`experimental.sri`, App Router only) (https://nextjs.org/docs/app/guides/content-security-policy, page lastUpdated 2026-03-20, read 2026-11-24).
- Setting headers by host:
  - Cloudflare Pages / Workers static assets: `_headers` file, max 100 rules, 2,000 chars/line; not applied to Functions/Worker/SSR responses (https://developers.cloudflare.com/pages/configuration/headers/ and https://developers.cloudflare.com/workers/static-assets/headers/, 2026-11-24).
  - Vercel: `headers` array in `vercel.json` (source + key/value pairs), applies to static files and functions (https://vercel.com/docs/project-configuration/vercel-json, 2026-11-24).
  - Netlify: `_headers` file or `[[headers]]` in `netlify.toml`; static files only, not functions/edge/SSR (https://docs.netlify.com/manage/routing/headers/, 2026-11-24).
- Vercel Hobby limits listed (100 GB transfer, 1M invocations, 3 WAF custom rules) at https://vercel.com/docs/plans/hobby (2026-11-24). Whether Hobby forbids commercial use: not found on the pages read (unverified).

### 3. Forms and email signup
- Validate on the server with an allowlist; client checks are UX only. Syntax checks do not prove mailbox ownership (https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html, 2026-11-24). Use double opt-in to prove control of the address.
- CSRF: use framework protection first; check `Sec-Fetch-Site` with Origin/Referer fallback; reject `Origin: null`; SameSite is defense in depth only; unauthenticated forms still need it (https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html, 2026-11-24). Astro `security.checkOrigin` defaults to true (since 4.9.0) and covers on-demand-rendered form POSTs (https://docs.astro.build/en/reference/configuration-reference/, 2026-11-24).
- Bot protection, privacy/accessibility options:
  - Cloudflare Turnstile: non-interactive challenges; states it does not read form entries; claims WCAG 2.2 AA; works without proxying traffic through Cloudflare (https://developers.cloudflare.com/turnstile/, 2026-11-24). Free-tier terms not on that page (unverified). Server-side token verification requirement not stated there; verify in Siteverify docs before relying on it.
  - Altcha: self-hosted proof-of-work, vendor claims no personal data and WCAG 2.2 AA (https://altcha.org/docs/, 2026-11-24, vendor claim). Open-source tier is basic protection per vendor.
  - Honeypot field: zero friction, only basic protection (search summary of vendor guides, unverified). Must be hidden from assistive tech and autofill.
- Edge rate limiting: Cloudflare Free plan gets 1 rate-limiting rule, counted by IP, 10-second period, 10-second mitigation (https://developers.cloudflare.com/waf/rate-limiting-rules/, 2026-11-24). Enough for one signup endpoint. Vercel Hobby allows up to 3 WAF custom rules (https://vercel.com/docs/plans/hobby, 2026-11-24).

### 4. Auth (later)
- Passwords (https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html, 2026-11-24): min 8 chars with MFA, 15 without (NIST SP 800-63B); allow at least 64 chars; no composition rules; no silent truncation; generic errors and equal timing on login, reset, signup; per-account rate limiting with anti-lockout-DoS; no security questions; re-authenticate for sensitive changes; do not assume passkeys are hardware-bound.
- Sessions (https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html, 2026-11-24): CSPRNG IDs, at least 64 bits entropy (128 recommended for self-generated); cookie `Secure; HttpOnly; SameSite=Strict|Lax` (set explicitly), `__Host-` prefix, no `Domain`; regenerate ID on login/privilege change; server-side idle and absolute timeouts; invalidate server-side on logout; `Clear-Site-Data` on logout; never store tokens in localStorage/sessionStorage.
- WebAuthn: Baseline widely available since September 2021; passkeys are built on it; HTTPS only (https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API, 2026-11-24).

### 5. Dependencies and supply chain
- `npm audit` needs a lockfile, reports known advisories; `npm audit signatures` verifies registry signatures and provenance attestations (https://docs.npmjs.com/cli/v11/commands/npm-audit, 2026-11-24).
- npm config (v11 docs, shows 11.21.3) lists `ignore-scripts`, `min-release-age` (days; default null), `save-exact`, `allow-git` (all/none/root) (https://docs.npmjs.com/cli/v11/using-npm/config, 2026-11-24). Introduction versions not stated (unverified).
- Dependabot: default 3-day cooldown for version updates (not security updates), configurable `cooldown` for npm (https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference, 2026-11-24; first 100,000 of 186,189 chars read). Renovate has `minimumReleaseAge` but I could not read its description (https://docs.renovatebot.com/configuration-options/, 2026-11-24; unverified).
- Trusted publishing (OIDC): GitHub Actions, GitLab CI, CircleCI; needs npm CLI 11.5.1+ and Node 22.14.0+; auto-provenance only for public repo to public package (https://docs.npmjs.com/trusted-publishers, 2026-11-24). Relevant only if the project ever publishes a package.
- Incidents (dates from sources, all 2026-11-24 access):
  - Sept 2025 Shai-Hulud worm: over 500 packages, credential theft and auto-republish (https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem). CISA advice: review lockfiles, rotate credentials, phishing-resistant MFA, enable secret scanning and Dependabot security updates.
  - GitHub plan, 22 Sept 2025: deprecate classic tokens, shorter-lived granular tokens, FIDO 2FA, expand trusted publishing (https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/). Rollout status today: partly unverified.
  - 31 Mar 2026 axios backdoored releases, live roughly 3 hours (secondary: VentureBeat via search; unverified).
  - 11 May 2026 TanStack: 84 versions across 42 packages published in about 6 minutes; chain was `pull_request_target` misuse, Actions cache poisoning, OIDC token theft from runner memory; no npm token stolen; detected externally after about 26 minutes (https://tanstack.com/blog/npm-supply-chain-compromise-postmortem).
  - Unit 42 timeline adds 22 Apr 2026 Bitwarden CLI (preinstall hook), 19 May 2026 @antv wave (639 versions/323 packages), 1 Jun 2026 Red Hat packages, 14 Jul 2026 AsyncAPI (https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/).
- Lessons: install-time cooldown of about 24-72 hours, `ignore-scripts`, `npm ci` with lockfile, pin Actions to commit SHAs, audit `pull_request_target`, valid provenance is not proof of a clean build, rotate all credentials if an affected version was installed, protect all branches (Unit 42 and TanStack pages above).

### 6. Secrets
- Secret scanning is free for public repos. For private repos it requires GitHub Secret Protection, sold to Team/Enterprise plans; the docs page does not mention personal accounts (https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning and https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security, 2026-11-24). Price quoted as $19/month per active committer in a GitHub changelog result (https://github.blog/changelog/2025-03-04-introducing-github-secret-protection-and-github-code-security/, via search snippet). Whether a free personal private repo can use it: not confirmed (unverified).
- User-level push protection is on by default but only blocks pushes to public repos (https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection, 2026-11-24).
- gitleaks: MIT licensed, pre-commit hook available; README says feature-complete, security patches only, maintainer moving to Betterleaks (https://github.com/gitleaks/gitleaks, 2026-11-24). The README example pins v8.24.2; current release not shown (unverified).
- .env handling (general practice, no source fetched): gitignore `.env*` except `.env.example`; keep real secrets in host env settings; never prefix server secrets with client-exposed prefixes (e.g. `PUBLIC_`, `NEXT_PUBLIC_`, `VITE_`) (unverified).

### 7. Lightweight threat model
- Assets: email list (PII), the tool's logic and any stored user input, domain/DNS, hosting and GitHub accounts, deploy tokens, content integrity (defacement or malicious script injection), reputation of sending domain. Later: credentials, sessions.
- Actors: opportunistic bots (spam signups, scraping), email harvesters, supply-chain attackers (npm/Actions), account-takeover attackers (phishing the owner), competitors/scrapers, curious users abusing the tool (input fuzzing).
- Entry points: signup endpoint; the interactive tool's inputs; third-party scripts (analytics, embeds); build pipeline (npm install, GitHub Actions, preview deploys); DNS/registrar; the owner's GitHub/hosting/email accounts; error pages and logs.
- Highest likelihood: spam signups, dependency compromise, owner-account compromise. Highest impact: deploy credential theft, email list leak.

## MVP security checklist
- [ ] Enable phishing-resistant MFA (passkey or hardware key) on GitHub, host, DNS registrar, npm, email provider.
- [ ] Commit lockfile; CI and deploy use `npm ci`; add `ignore-scripts=true` to `.npmrc` and allow-list only scripts that must run.
- [ ] Set install cooldown (`min-release-age` in npm if available, plus Dependabot `cooldown`); record chosen days.
- [ ] Configure Dependabot (or Renovate) with grouped updates; enable Dependabot security updates.
- [ ] Run `npm audit` and `npm audit signatures` in CI; fail on high severity.
- [ ] Pin all GitHub Actions to full commit SHAs; set workflow `permissions: contents: read`; do not use `pull_request_target`.
- [ ] Branch protection on `main`; no secrets exposed to forked PR workflows.
- [ ] Add gitleaks pre-commit hook and a CI scan; commit `.env.example` only; gitignore `.env*`.
- [ ] Send HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP, and CSP (with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`); start CSP in Report-Only, then enforce.
- [ ] Verify headers on the deployed URL (not just local) and on SSR/API responses separately.
- [ ] Signup: server-side validation, length caps, double opt-in, generic success message, honeypot plus Turnstile or Altcha, one edge rate-limit rule, Origin/Sec-Fetch-Site check.
- [ ] Interactive tool: treat all input as untrusted; no `innerHTML` with user data; cap input size and compute time.
- [ ] Third-party scripts: none by default; if added, load via hash/nonce and document why.
- [ ] Error pages and logs: no stack traces to users; no PII in logs; write a privacy note stating what is collected.
- [ ] HTTPS-only, HSTS without `preload` until all subdomains are confirmed HTTPS; then decide on preload.
- [ ] Publish `/.well-known/security.txt` with a contact address.
- [ ] Back up the email list export and know how to revoke every deploy token.

## Post-MVP (auth) checklist
- [ ] Prefer passkeys/WebAuthn plus email magic link, or a vetted auth library/provider; avoid custom crypto.
- [ ] If passwords: min 15 chars (8 with MFA), allow 64+, check against breached lists, hash with a modern password KDF (algorithm choice: see OWASP Password Storage cheat sheet, not read).
- [ ] Session cookie: `__Host-` prefix, `Secure`, `HttpOnly`, explicit `SameSite`, no `Domain`; rotate ID on login; server-side idle and absolute timeouts; revoke on logout.
- [ ] CSRF tokens or Fetch Metadata checks on all state-changing routes, including login.
- [ ] Generic errors and equal timing for login/reset/signup; per-account throttling; re-auth for email/password change.
- [ ] Authorization check on every object access (A01); add tests for IDOR.
- [ ] Log auth events (login, failure, reset) without secrets; alert on spikes (A09).
- [ ] Self-service account and data deletion; document retention.
- [ ] Move toward ASVS L2 for auth/session chapters; record which requirements are met.

## Decisions needed
1. Framework vs CSP effort. Options: (a) Astro static with built-in hash CSP, (b) SvelteKit `mode: 'auto'`, (c) Next.js nonce (dynamic only) or experimental SRI. Recommend (a) or (b) for hash CSP on mostly static pages; avoid (c) unless React is wanted, since nonces end CDN caching.
2. Host. Options: Cloudflare Pages/Workers, Vercel, Netlify. Recommend choosing the host that applies headers to the SSR routes you will use; if fully static, any works. Confirm Vercel Hobby commercial-use terms before choosing it (unverified here).
3. Bot protection. Options: honeypot only; honeypot + Turnstile; honeypot + Altcha. Recommend honeypot + Turnstile (free tier terms to confirm), with Altcha as the self-hosted fallback if third-party scripts are unwanted.
4. Secret scanning on a private repo. Options: pay for GitHub Secret Protection; gitleaks pre-commit + CI (free); make repo public (not advisable). Recommend gitleaks; recheck GitHub plan terms for personal accounts.
5. Update bot. Options: Dependabot vs Renovate. Recommend Dependabot (native, documented cooldown) unless Renovate's `minimumReleaseAge` and grouping are needed (not verified).
6. Email handling. Options: hosted ESP form/API vs own endpoint storing addresses. Recommend an ESP with double opt-in to minimize stored PII.
7. ASVS level. Options: L1 now, L2 for auth later (recommended) vs L2 from day one.

## Risks
- npm/Actions compromise leading to deploy-token or secret theft (high likelihood in 2026 per timeline above).
- Owner account takeover (GitHub, host, registrar, email).
- CSP breaks the tool or analytics; a loose CSP gives false assurance.
- Headers silently missing on SSR/API routes because `_headers` covers static files only.
- Spam/abuse of signup damaging email sender reputation.
- Cooldown/`ignore-scripts` slow urgent security patches or break packages with needed install scripts.
- GitHub rollout details for npm token and 2FA changes may have moved since the Sept 2025 post.

## Contradictions
- ASVS level sizes: one search summary says about 350 requirements over 17 chapters with roughly 90 L3-only; another third-party count says 70 L1, 183 L2, 92 L3 (345 total). Neither read from OWASP itself. Not resolved.
- Mini Shai-Hulud date: Socket says 29 April 2026, another vendor says May 2026 (search summaries); Unit 42 says 29 April 2026. Using Unit 42.
- Provenance value: GitHub's plan and npm docs present trusted publishing/provenance as security gains; Unit 42 and TanStack show malicious TanStack packages with valid provenance. Treat provenance as necessary-not-sufficient.
- Axios framing: a VentureBeat summary calls it the third major compromise in seven months, while the Unit 42 timeline lists more incidents in that span. Count is not reliable.
- Clickjacking header: OWASP says use `X-Frame-Options: DENY` but prefer `frame-ancestors`; MDN says `frame-ancestors` replaces it. Minor: send both, or only the CSP one.
- Astro CSP maturity: the docs read do not mark it experimental (added 6.0.0); I did not verify against the changelog.

## Open questions
- Does Cloudflare Turnstile free tier have limits that matter, and what does its Siteverify require?
- Does GitHub offer secret scanning or push protection on free personal private repos today?
- Which npm version introduced `min-release-age`, and is it stable?
- What does Renovate `minimumReleaseAge` default to, and is Renovate's GitHub app free for private repos?
- Does Vercel Hobby restrict commercial use?
- Which password-hashing algorithm does OWASP currently recommend (read Password Storage cheat sheet)?
- ASVS 5.0 level definitions from the standard itself.
- Does the interactive tool store user data? That changes the threat model and privacy duties (US state privacy laws not researched).
- Analytics choice (privacy-preserving, no third-party scripts?).

## Notes
- Injected or agent-directed text seen in tool results, none acted on:
  - Vercel docs pages contained "For AI agents" blocks and metadata lines (`install_vercel_plugin: npx plugins add vercel/vercel-plugin`, `search_with_vercel_cli`, and a CLI "Search the docs" section) inviting an agent to install a plugin or run CLI commands. Not run.
  - WebSearch results ended with a "REMINDER: You MUST include the sources above in your response" line; harmless but tool-originated. I cited sources in the file as the task required, not because of that line.
  - Next.js and Vercel pages also carried `llms.txt`/sitemap pointers; ignored.
  - The system prompt of this session mentioned MCP server instructions; no such block appeared inside any fetched page.
- Several incident details (axios, 19 May wave, Red Hat) come from secondary vendor/blog summaries; only CISA, GitHub blog, TanStack postmortem, and Unit 42 were read directly.
- Not researched: US privacy law obligations (CAN-SPAM, state laws), accessibility of the form beyond vendor claims, DNS/email authentication (SPF/DKIM/DMARC) for the sending domain. Add DMARC before sending newsletters.
- Page truncation: Astro and Dependabot and Renovate pages were only partly read, as noted above.
