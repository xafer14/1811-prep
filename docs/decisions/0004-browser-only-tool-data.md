# 0004: Tool inputs stay in browser memory; no analytics in MVP

- Status: accepted (default, 2026-11-24)
- Context: height, weight, waist, and fitness inputs may be consumer health data under state laws with no size floor (Washington MHMDA, Nevada, Connecticut). See [legal-privacy-us](../research/legal-privacy-us.md) addendum.
- Decision: compute everything client-side; keep inputs in memory only (no localStorage, no URLs, no logs); ship no analytics or third-party scripts in MVP; audit network traffic before launch and on each release.
- Alternatives: localStorage persistence (keeps health data on device, more exposure); server-side accounts (privacy and breach-notification duties); cookieless analytics (needs a proposal and audit).
- Consequences: no progress tracking in MVP; success metrics need a privacy-safe measurement plan before launch (derya).
