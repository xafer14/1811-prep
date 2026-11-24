---
topic: design and UX interview (Round D)
owner: aras
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [owner instruction 2026-11-24, docs/research/a11y-perf-seo.md, docs/research/legal-privacy-us.md]
superseded_by:
---
# Round D: Design/UX

Not asked as questions. The owner chose on 2026-11-24 to proceed with agent defaults and correct later. Every item below is an unreviewed default.

1. Brand: neutral, utilitarian, trustworthy. No military or agency seals, insignia, camouflage, or look-alike imagery.
2. Tone: plain US English, second person, short sentences, roughly 8th-grade reading level; numbers always with source and as-of date.
3. Components: native HTML first (forms, details/summary, tables); one Svelte island for the readiness tool.
4. Color scheme: follow the system (`prefers-color-scheme`); no manual toggle in MVP (saves JS).
5. Motion: minimal; respect `prefers-reduced-motion`.
6. Accessibility: WCAG 2.2 AA.
7. Responsive: mobile-first, 320 px to 1440 px.
8. Units: US customary input by default (in, lb), metric optional.
