# 0002: Host on Cloudflare Workers static assets

- Status: accepted (default, 2026-11-24)
- Context: $0 budget, possible future monetization, static output. See [stack-hosting-ci](../research/stack-hosting-ci.md).
- Decision: deploy the static build to Cloudflare Workers static assets; security headers via `_headers`.
- Alternatives: Vercel Hobby (non-commercial only); Netlify Free (pauses all sites at the credit cap); GitHub Pages (private-repo availability unverified).
- Consequences: static requests are not metered; Workers, D1 available later in the same account; any future SSR route must set its headers in code because `_headers` covers static files only.
