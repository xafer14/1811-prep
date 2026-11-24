---
topic: stack-hosting-ci
owner: ozan
status: current
last_verified: 2026-11-24
review_by: 2026-12-24
sources: [https://registry.npmjs.org/astro/latest, https://registry.npmjs.org/next/latest, https://registry.npmjs.org/@sveltejs/kit/latest, https://registry.npmjs.org/react-router/latest, https://api.github.com/repos/withastro/astro/releases, https://api.github.com/repos/vercel/next.js/releases/latest, https://api.github.com/repos/sveltejs/kit/releases, https://api.github.com/repos/remix-run/react-router/releases/latest, https://docs.astro.build/en/install-and-setup/, https://docs.astro.build/en/guides/testing/, https://docs.astro.build/en/guides/deploy/cloudflare/, https://docs.astro.build/en/guides/content-collections/, https://nextjs.org/docs/app/guides/testing, https://svelte.dev/docs/kit/adapter-static, https://developers.cloudflare.com/pages/, https://developers.cloudflare.com/pages/platform/limits/, https://developers.cloudflare.com/workers/platform/limits/, https://developers.cloudflare.com/workers/platform/pricing/, https://developers.cloudflare.com/workers/static-assets/, https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/, https://www.cloudflare.com/terms/, https://vercel.com/docs/plans/hobby, https://vercel.com/docs/limits/fair-use-guidelines, https://vercel.com/terms, https://www.netlify.com/pricing/, https://www.netlify.com/pricing/personal-vs-free.md, https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/, https://www.netlify.com/changelog/netlify-pricing-update-introducing-credit-based-plans/, https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits, https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages, https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions, https://developers.cloudflare.com/d1/platform/pricing/, https://turso.tech/pricing, https://supabase.com/pricing, https://neon.com/pricing, https://clerk.com/pricing, https://better-auth.com/blog/authjs-joins-better-auth, https://vercel.com/blog/vercel-acquires-better-auth, https://registry.npmjs.org/better-auth/latest, https://registry.npmjs.org/next-auth, https://lucia-auth.com/, https://buttondown.com/pricing, https://docs.buttondown.com/double-opt-in, https://www.kit.com/pricing, https://www.mailerlite.com/pricing, https://resend.com/pricing, https://loops.so/pricing, https://devblogs.microsoft.com/typescript/announcing-typescript-7.0/, https://infoq.com/news/2026/08/typescript-7-released/, https://registry.npmjs.org/typescript/latest, https://registry.npmjs.org/typescript-eslint/latest, https://registry.npmjs.org/@astrojs/check/latest, https://registry.npmjs.org/@astrojs/cloudflare/latest, https://registry.npmjs.org/eslint/latest, https://registry.npmjs.org/prettier/latest, https://registry.npmjs.org/@biomejs/biome/latest, https://registry.npmjs.org/vitest/latest, https://registry.npmjs.org/@playwright/test/latest, https://registry.npmjs.org/@axe-core/playwright/latest, https://registry.npmjs.org/@lhci/cli/latest, https://api.github.com/repos/GoogleChrome/lighthouse-ci/releases/latest, https://registry.npmjs.org/lefthook/latest, https://api.github.com/repos/evilmartians/lefthook/releases/latest, https://registry.npmjs.org/husky/latest, https://api.github.com/repos/typicode/husky/releases/latest, https://registry.npmjs.org/pnpm/latest, https://pnpm.io/installation]
superseded_by:
---

All facts accessed 2026-11-24 unless marked. Registry/GitHub-API URLs are the source for version numbers.

## Summary
- Astro 7.4.13 (released 2026-11-18) is the best fit: content-first, static by default, content collections with MDX, one interactive island, official `npm create astro@latest`. Node >=22.23.4, even-numbered only, so Node 24.15 is fine.
- Hosting: Cloudflare Workers (static assets) is the best $0 fit. Static asset requests are free and unlimited, and the Free plan has no commercial-use ban I could find in the general terms. Cloudflare itself says to start new projects on Workers, not Pages.
- Vercel Hobby is non-commercial only per Vercel's fair-use docs. Rule it out if the site has ads, affiliate links, or sells anything.
- Netlify Free is a hard 300 credits/month cap. Bandwidth is 20 credits/GB, and exceeding the cap pauses all sites. Its commercial-use position comes from an older changelog, so re-check the current terms.
- Email at ~500 subscribers: Kit Free (up to 10,000 subscribers, API included) fits at $0. Buttondown is free only to 100 subscribers. MailerLite caps at 250. Loops free covers 1,000 contacts but carries Loops branding.
- TypeScript 7.0 (native compiler) is current on npm, but typescript-eslint (peer `<6.1.0`) and @astrojs/check (`^5 || ^6`) do not accept it. Pin TypeScript 6.x for now.
- GitHub Actions Free on private repos: $12/month of included compute (about 2,000 Linux minutes, derived), 500 MB artifacts, 10 GB cache. Windows runners cost about 1.67x Linux. Use Linux runners.
- Auth later: Better Auth (1.7.28) is the active choice, but Vercel acquired it. Auth.js is in maintenance under Better Auth. Lucia was deprecated in March 2025.

## Findings
### 1. Framework
| | Astro | Next.js | SvelteKit | React Router (framework mode) |
|---|---|---|---|---|
| Stable | 7.4.13, 2026-11-18 | 16.4.6, 2026-11-09 | @sveltejs/kit 3.4.0, 2026-11-18 | 8.5.3, 2026-11-24 |
| Node engines | >=22.23.4 | >=20.9.0 | >=22.17 | >=22.22.0 |
| Node 24 | Yes (even versions) | Yes (>=20.9) | Yes (>=22.17) | Yes (>=22.22) |
| Content/MDX | Content collections, glob/file loaders, Zod schemas, MDX | Needs its own MDX setup (unverified) | Needs mdsvex or similar (unverified) | None built in (unverified) |
| Static vs SSR | Static default, opt-in on-demand via adapters | Static export or server | adapter-static with prerender, or SSR | SPA/prerender/SSR (unverified detail) |
| Scaffold | `npm create astro@latest` | `npx create-next-app` (unverified) | `npx sv create` (unverified) | `npx create-react-router` (unverified) |
| Testing guidance | Vitest (`getViteConfig`), Container API, Playwright | Cypress, Jest, Playwright, Vitest | Not checked | Not checked |

- Astro: `strict` and `strictest` tsconfigs ship with it. Docs advise testing the production build (https://docs.astro.build/en/guides/testing/). Islands can be React, Svelte, Preact and others (framework list not re-checked).
- Next.js docs say async Server Components are best covered by E2E tests, not unit tests (https://nextjs.org/docs/app/guides/testing). Next on Cloudflare is not covered in this research.
- SvelteKit: official adapters listed for Cloudflare, Cloudflare Workers, Netlify, Vercel. The static adapter needs the host to serve `/a.html` for `/a`, or `trailingSlash: 'always'`.
- Astro Cloudflare: static sites need only a Wrangler config. On-demand rendering uses `@astrojs/cloudflare` (14.4.9, peers astro ^7.4.0 and wrangler ^4.125.0). Deploy with `astro build && wrangler deploy` (https://docs.astro.build/en/guides/deploy/cloudflare/).
- Windows dev friction: nothing in the sources flagged a Windows problem for any framework. The Astro install page has no Windows notes. Wrangler/workerd on Windows 11 is unverified; test it early.

### 2. Hosting free tiers
- Cloudflare Workers Free: 100,000 requests/day (Worker invocations), 10 ms CPU per request, 20,000 static files per version, 25 MiB per file (https://developers.cloudflare.com/workers/platform/limits/). Static asset requests are "free and unlimited" (https://developers.cloudflare.com/workers/platform/pricing/). Workers Builds Free: 3,000 build min/month, 1 concurrent build, 20 min timeout.
- Cloudflare Pages Free: 500 builds/month, 1 concurrent build, 20,000 files, 25 MiB per file (https://developers.cloudflare.com/pages/platform/limits/). Not deprecated, but Cloudflare recommends Workers for new projects.
- Cloudflare terms: no clause limiting commercial use of Free plans found. Bans reselling access and handling credit-card data on Free services (https://www.cloudflare.com/terms/). Service-Specific Terms were not read.
- Vercel Hobby: 100 GB fast data transfer, 1M CDN requests, 1M function invocations, 100 deploys/day, 300 s function max (https://vercel.com/docs/plans/hobby). Hobby is for non-commercial personal use only; commercial use needs Pro ($20 per developer seat/month). See Contradictions.
- Netlify Free: 300 credits/month, hard limit, no top-up. 15 credits per production deploy, 20 per GB bandwidth, 2 per 10,000 requests (https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/). Roughly 20 deploys or 15 GB, my arithmetic.
- GitHub Pages: site <=1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour. Not meant for sites that primarily handle commercial transactions or SaaS (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Static only, with no SSR or server code.

### 3. Data/auth (info only)
| Service | Free tier | Notes |
|---|---|---|
| Cloudflare D1 | 5M rows read/day, 100k written/day, 5 GB, 10 DBs | Fits a Workers deploy |
| Turso | 100 DBs, 5 GB, 500M reads and 10M writes/month | Commercial terms not read |
| Supabase | 500 MB DB, 50k MAU auth, 2 active projects, pauses after 1 week idle | Pausing hurts a low-traffic site |
| Neon | 1 GB/project, 100 CU-hours/project/month, scale to zero | Does not pause for inactivity |
| Clerk Hobby | 50k monthly retained users/app | Clerk branding, no MFA or passkeys on free |

- Better Auth: npm 1.7.28. Vercel announced acquiring it; the project says it stays open source.
- Auth.js/next-auth: latest 4.24.15, v5 still `beta` tag (5.0.0-beta.32). The team announced on 2025-09-22 that it joined Better Auth, with security fixes only.
- Lucia: deprecated March 2025, now a learning resource with a single-file replacement.

### 4. Email signup (~500 subscribers)
| Service | Free tier | API | Double opt-in |
|---|---|---|---|
| Kit | Up to 10,000 subscribers, unlimited broadcasts, Kit branding | Yes, included | Not stated on pricing page (unverified) |
| Buttondown | First 100 subscribers free, so 500 means paid (price not read) | Yes, free plan (2023 post) | On by default per docs |
| MailerLite | 250 subscribers, 2,500 emails/month | "Limited" | Not stated (unverified) |
| Resend | 1,000 marketing contacts, 3,000 emails/month, 100/day for transactional | Yes | Not stated (unverified) |
| Loops | 1,000 subscribed contacts, 4,000 sends/30 days, Loops branding | Not stated (unverified) | Not stated (unverified) |

### 5. CI
- GitHub Free, private repos: $12 of included compute per month, 500 MB artifact storage shared with Packages, 10 GB cache per repo. Without a payment method, usage stops at the cap (https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions).
- Per-minute rates: Linux 2-core $0.006, Windows 2-core $0.010 (about 1.67x), macOS about 10x. Windows gives about 1,200 minutes versus about 2,000 Linux (derived).
- Public repos and self-hosted runners do not use the allowance.

### 6. Tooling (npm "latest" on 2026-11-24)
- TypeScript 7.0.2 (7.0 announced 2026-07-08). It has no programmatic compiler API, expected in 7.1. Microsoft suggests npm aliasing `typescript` to a 6.x package for tools that import it.
- typescript-eslint 8.74.0 (peer TS `>=4.8.4 <6.1.0`, ESLint ^8.57 || ^9 || ^10). ESLint 10.15.0 (Node ^20.19 || ^22.13 || >=24), flat config is the model.
- Prettier 3.10.1, Biome 2.6.9. Biome does not read `.astro` files fully (unverified), so ESLint plus Prettier is the safer default for Astro.
- Vitest 5.1.1 (Node ^22.12 || ^24 || >=26). Playwright 1.65.1. @axe-core/playwright 4.14.1. @lhci/cli 0.16.1 (release 2026-11-11, Node >=22.19).
- lefthook 2.2.2 (npm), latest GitHub release v2.2.3 on 2026-11-24, actively maintained. Husky 9.1.7, last release 2024-11-18, stable but quiet. Windows support for either: unverified; the lefthook install page 404'd.
- pnpm 12.23.0 supports Node 24. On Windows, install it via npm, because Defender can block the standalone exe and slow installs (https://pnpm.io/installation). npm 11 also works with no extra setup.

## Options for this project
| Option | Fit | Cost | Main risk |
|---|---|---|---|
| A. Astro static + 1 island, Cloudflare Workers assets | Best content/SEO fit; D1 and Workers available later for auth | $0 | Wrangler on Windows unverified; Cloudflare pushing Workers over Pages |
| B. Astro static, Netlify Free | Simple Git deploys | $0 | 300-credit hard pause; commercial terms to re-check |
| C. Astro static, GitHub Pages | Zero extra vendor | $0 | Static only; commercial-use wording; private-repo Pages availability to confirm |
| D. Next.js on Vercel Hobby | Easiest Next hosting | $0 | Hobby non-commercial; heavier than needed for content |
| E. SvelteKit + adapter-static | Smaller islands/app code | $0 | Weaker content/MDX story |

## Decisions needed
1. Framework. Options: Astro / SvelteKit / Next. Recommend Astro: the content collections are built in, pages ship little JS, and one island covers the tool.
2. Host. Options: Cloudflare Workers assets / Netlify / GitHub Pages. Recommend Cloudflare: static traffic is unmetered, and D1 plus Workers sit in the same account for later auth.
3. Will the site carry ads, affiliate links, or paid products? If yes, Vercel Hobby is out. Recommend assuming yes (SEO site, possible monetization).
4. Email provider. Options: Kit Free / Buttondown paid. Recommend Kit Free for 500 subscribers at $0. Verify double opt-in on a Free account before committing.
5. TypeScript pin. Recommend `typescript@^6` until typescript-eslint and @astrojs/check accept 7.x.
6. Package manager. Recommend npm: it is already installed, with no Windows Defender caveat.
7. Git hooks. Options: lefthook / husky / none for MVP. Recommend lefthook, or no hooks at first since CI covers it.

## Risks
- A fresh `npm i typescript` pulls 7.x and breaks typescript-eslint peer resolution and Astro type-checking.
- Cloudflare's Pages-to-Workers shift means older Pages tutorials are outdated.
- Cloudflare free Worker cap of 100,000 requests/day applies to SSR/Worker-routed requests; static asset requests are exempt per pricing text.
- Netlify Free pauses every site when credits run out.
- Better Auth now sits under Vercel; roadmap and independence may change.
- GitHub Actions compute is dollar-based; Windows runners drain it faster.
- Several free tiers can change; this file expires 2026-12-24.

## Contradictions
- Vercel commercial use: the Terms of Service describe Hobby as personal or non-commercial, while the fair-use page says non-commercial personal use and that commercial needs Pro. The fetched fair-use page body was mostly collapsed, so the exact wording came from a search summary. Treat the stricter reading as binding.
- Netlify commercial use: a search summary of an older Netlify changelog says Free can host commercial projects. The current pricing pages say nothing on it. Unresolved.
- GitHub Actions: older docs describe 2,000 free minutes. The current billing page gives $12 of compute. The 2,000 figure here is my derivation.
- GitHub Pages on private repos: the fetched "what is Pages" summary says it is available on the Free plan for private repos. I recall past restrictions; re-check before relying on it.
- Cloudflare: one fetched page said Pages isn't deprecated; the Astro and Cloudflare docs say start new projects on Workers.
- Loops: the pricing page listed both "up to 5,000" and "5,000 to 1.5 million" contacts for the Growth plan.

## Open questions
- Will the interactive tool need server code, or can it run fully client-side with `localStorage`?
- Does Kit Free offer double opt-in on forms?
- What does Buttondown cost at 500 subscribers?
- Does Wrangler/workerd run cleanly on this Windows 11 Home machine?
- Are husky and lefthook both fine on Windows? (Not verified.)
- Does the owner plan any monetization at launch?

## Notes
- What would change the recommendation: monetization plans (affects Vercel); a need for heavy SSR (Next/SvelteKit); an app-like tool with accounts early (then reconsider SvelteKit or Next); Cloudflare Free request caps on SSR.
- Possible injected text seen, none acted on: Vercel docs pages carry a "For AI agents: follow these links" block and front matter telling agents to install a Vercel plugin (`npx plugins add vercel/vercel-plugin`). The Cloudflare static-assets page front matter pushes agents to a search endpoint. Next.js docs point agents to `/docs/llms.txt`. A comparison-site search snippet is third-party marketing.
- Secondary sources used: community threads and third-party blogs for Auth.js and Vercel terms context; mark those (unverified) in any citation.
- Version numbers come from npm `latest` tags, which can include releases newer than docs reference.
