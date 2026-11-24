# 0001: Astro static site with one Svelte island, TypeScript 6

- Status: accepted (default, 2026-11-24)
- Context: content-first, SEO-driven site with one interactive tool; Lighthouse >= 90; solo owner; $0 hosting. See [stack-hosting-ci](../research/stack-hosting-ci.md).
- Decision: Astro 7.x with static output, content collections for standards and guides, one Svelte 5 island for the readiness tool, TypeScript 6.x in strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, plain scoped CSS.
- Alternatives: Next.js (nonce CSP forces dynamic rendering, more JS); SvelteKit (good, but weaker content collections); TypeScript 7 (typescript-eslint peer range `<6.1.0` on 2026-11-24).
- Consequences: minimal client JS; hash CSP available; TS stays pinned to 6.x until the lint and check tooling accept 7.x.
