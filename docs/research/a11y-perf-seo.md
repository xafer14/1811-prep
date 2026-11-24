---
topic: a11y-perf-seo
owner: ozan
status: current
last_verified: 2026-11-24
review_by: 2027-02-22
sources: [https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/, https://www.w3.org/TR/wcag-3.0/, https://www.w3.org/WAI/test-evaluate/, https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues, https://developer.chrome.com/docs/lighthouse/accessibility/scoring, https://developer.chrome.com/docs/lighthouse/performance/performance-scoring, https://www.ada.gov/resources/web-rule-first-steps/, https://www.ada.gov/resources/2024-03-08-web-rule/, https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/, https://info.usablenet.com/2025-year-end-report-on-web-accessibility-lawsuits, https://krdo.com/news/2026/10/15/website-accessibility-lawsuits-are-rising-and-smaller-businesses-are-frequent-targets/, https://web.dev/articles/vitals, https://web.dev/articles/performance-budgets-101, https://web.dev/baseline, https://web.dev/articles/baseline-tools-web-features, https://github.com/browserslist/browserslist, https://github.com/eslint/css/blob/main/docs/rules/use-baseline.md, https://developers.google.com/search/docs/essentials, https://developers.google.com/search/docs/fundamentals/creating-helpful-content, https://developers.google.com/search/docs/fundamentals/seo-starter-guide, https://developers.google.com/search/docs/appearance/page-experience, https://developers.google.com/search/docs/appearance/structured-data/search-gallery, https://developers.google.com/search/docs/appearance/structured-data/faqpage, https://developers.google.com/search/blog/2023/08/howto-faq-changes, https://searchengineland.com/google-search-stops-showing-how-to-rich-results-desktop-431947]
superseded_by:
---

# Accessibility, performance, Baseline, SEO research for 1811 Prep

All sources accessed 2026-11-24. Items without a URL are marked (unverified).

## Summary
- WCAG 2.2 adds 9 criteria (6 at A/AA, 3 at AAA) and removes 4.1.1 Parsing. Target WCAG 2.2 AA; it is a superset-compatible step above the 2.1 AA that courts and DOJ cite.
- WCAG 3.0 is still a Working Draft (10 Sep 2026) and explicitly does not deprecate WCAG 2. Do not plan around it.
- Automation is partial: Deque claims ~57% of issues (vendor figure); Lighthouse a11y score covers a subset. Manual keyboard/screen-reader checks are mandatory.
- The DOJ Title II web rule (WCAG 2.1 AA) covers state/local government only. A private site like this is under Title III case law, where WCAG 2.1 AA is the most requested standard in suits.
- Core Web Vitals "good" at the 75th percentile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1. Lighthouse weights: TBT 30, LCP 25, CLS 25, FCP 10, SI 10 (v10 table).
- Baseline: Newly = all core browsers; Widely = 30 months later. Recommend "Widely available" as the default with a documented, linted exception list.
- FAQ rich results ended 7 May 2026; HowTo rich results ended 2023. Do not build SEO plans on FAQPage/HowTo markup.
- Google does not ban AI content but treats mass unreviewed AI text as low effort; career/government-process info leans YMYL-adjacent, so authorship, sourcing, and dated review matter.
- Core Web Vitals are a (modest) ranking input; relevance still wins. Treat Lighthouse >= 90 as a quality gate, not an SEO silver bullet.

## Findings

### Accessibility
- New in WCAG 2.2 (https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/): 2.4.11 Focus Not Obscured (Minimum) AA; 2.4.12 Focus Not Obscured (Enhanced) AAA; 2.4.13 Focus Appearance AAA; 2.5.7 Dragging Movements AA; 2.5.8 Target Size (Minimum) AA; 3.2.6 Consistent Help A; 3.3.7 Redundant Entry A; 3.3.8 Accessible Authentication (Minimum) AA; 3.3.9 Accessible Authentication (Enhanced) AAA. 4.1.1 Parsing removed as obsolete.
- AA-relevant new ones for this project: 2.4.11 (sticky headers/cookie banners must not hide focused elements), 2.5.8 (target size, 24x24 CSS px is the commonly stated minimum; the fetched page did not state the number, so (unverified) here), 2.5.7 (any drag in the interactive tool needs a non-drag alternative), 3.3.7 (do not re-ask for data in multi-step tool flows), 3.2.6 (put help/contact in a consistent place). 3.3.8 only matters if there are logins.
- WCAG 3.0: W3C Working Draft 10 Sep 2026, not a Recommendation; successor to 2.2 but "does not deprecate WCAG 2"; 2.2 A/AA expected to cover most of WCAG 3's minimum level (https://www.w3.org/TR/wcag-3.0/).
- Automated limits: W3C says no tool alone can determine conformance and human judgment is needed (https://www.w3.org/WAI/test-evaluate/). Deque's study: 57.38% of issues (by volume, first-time audit customers, ~300k issues) detectable automatically; ~80% with its guided semi-automated tests; this is vendor data, not neutral (https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues). axe-core returns "incomplete" results where it cannot decide.
- Lighthouse a11y score: weighted average of pass/fail audits (weights 3/7/10 from axe impact); manual and low-impact audits excluded; a high score does not mean accessible (https://developer.chrome.com/docs/lighthouse/accessibility/scoring).
- Needs manual checks: keyboard-only operation and focus order, visible and unobscured focus, screen-reader name/role/state, meaningful alt text and heading logic, reading order, zoom/reflow at 400% and text spacing, color contrast on gradients/images, error messaging in the tool, motion/timeouts.

### US legal context (information only, not legal advice)
- DOJ Title II rule (published 24 Apr 2024): applies to state and local governments and their contractors; technical standard WCAG 2.1 AA; five exceptions (archived content, preexisting documents, third-party posts, individualized password-protected docs, preexisting social media) (https://www.ada.gov/resources/2024-03-08-web-rule/). Compliance dates: 26 Apr 2027 (population >= 50,000), 26 Apr 2028 (smaller / special districts) (https://www.ada.gov/resources/web-rule-first-steps/). An Interim Final Rule of 20 Apr 2026 is described as extending dates (see Contradictions).
- The DOJ fact sheet does not address private businesses/Title III. 1811 Prep is private, so the rule does not directly bind it; it matters as a de facto benchmark and because the audience (federal job seekers) includes people with disabilities.
- Title III litigation trend: sources agree filings rose in 2025; counts differ (see Contradictions). Reported patterns: e-commerce and food/service lead; New York heavy in state courts; many repeat defendants; WCAG 2.1 AA most commonly cited (UsableNet via https://krdo.com/news/2026/10/15/website-accessibility-lawsuits-are-rising-and-smaller-businesses-are-frequent-targets/ and https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/; secondary summaries only, figures not opened in primary PDF).

### Performance
- CWV thresholds (https://web.dev/articles/vitals): LCP <= 2.5 s; INP <= 200 ms; CLS <= 0.1; assessed at the 75th percentile, mobile and desktop separately; all three must pass. INP replaced FID (replacement date not stated on the fetched page; (unverified)).
- Lighthouse score = weighted average of metric scores, each mapped via log-normal curve (p25 of HTTP Archive = 50, p8 = 90). Lighthouse 10 weights: TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10%. The page shows nothing newer than v10, so weights in the current Lighthouse release are (unverified). Score bands: 90-100 good, 50-89 needs improvement, 0-49 poor (https://developer.chrome.com/docs/lighthouse/performance/performance-scoring). INP is a field metric and not part of the lab score.
- Budget guidance from web.dev (https://web.dev/articles/performance-budgets-101): example of < 170 KB critical-path resources (compressed/minified), < 2 MB images on a desktop search page, TTI < 5 s on slow 3G Moto G4, Lighthouse > 80 as an example. These are illustrative defaults, not mandates.
- Content sites reach Lighthouse >= 90 mostly by shipping little JS, sizing images (AVIF/WebP, width/height set), self-hosting/subsetting fonts with swap, and avoiding layout shifts from banners/ads (practitioner knowledge, (unverified) as a sourced claim).

### Baseline
- Definitions (https://web.dev/baseline): Newly available = supported by all core browsers (Chrome desktop+Android, Edge, Firefox desktop+Android, Safari macOS+iOS); Widely available = 30 months after that date; before that = Limited availability. Yearly targets (Baseline 2023, 2024, 2025, 2026) are the sets that became Newly available by that year; 2026 is still developing.
- Choosing a target: Widely available = safest, moves automatically; a year target = fixed, reproducible set; "Newly" = latest features, more fallback work. Baseline Checker can use your analytics to choose (needs traffic data; none exists yet).
- Tooling: browserslist supports `baseline widely available`, `baseline newly available`, `baseline widely available on YYYY-MM-DD`, `baseline 2022` (end-of-year), with optional `with downstream` / `including kaios` (https://github.com/browserslist/browserslist). ESLint `css/use-baseline` (package eslint-css): option `available` default `"widely"`, accepts `"newly"` or a year; allow-lists for at-rules, functions, properties, selectors (e.g. `nesting`), units (https://github.com/eslint/css/blob/main/docs/rules/use-baseline.md). `web-features` npm package exposes `status.baseline` = "high" / "low" / false (https://web.dev/articles/baseline-tools-web-features). HTML/JS lint equivalents: not verified here (unverified). Lighthouse has a Baseline features audit (https://web.dev/baseline).

### SEO
- Search Essentials has three parts: technical requirements (very few), spam policies, key best practices (https://developers.google.com/search/docs/essentials).
- People-first content: audience-first, first-hand expertise, clear site focus; warning signs include mass-produced pages, thin summaries of others' work, and changing dates without real updates. E-E-A-T: trust is most important; not a direct ranking factor; weighted more for YMYL (health, financial stability, safety, societal well-being). Generative AI used for large text without oversight is described as little effort; AI is not banned, disclosure is advised where readers expect it; scaled content abuse is a spam policy (https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- YMYL relevance (my inference): hiring-process, pay/benefits, eligibility, and background-check info can affect financial stability and career decisions, so treat as high-accuracy content: named authors, primary sources (OPM/USAJOBS/agency pages), "last reviewed" dates that change only on real review.
- Structured data: gallery lists Article, Breadcrumb, Organization, Profile page, Video, Job posting, Course list, etc.; FAQPage and HowTo are absent (https://developers.google.com/search/docs/appearance/structured-data/search-gallery). FAQ rich result ended 7 May 2026, docs removed 15 Jun 2026 (https://developers.google.com/search/docs/appearance/structured-data/faqpage). HowTo: desktop rich results stopped Sept 2023 (https://searchengineland.com/google-search-stops-showing-how-to-rich-results-desktop-431947; Google post https://developers.google.com/search/blog/2023/08/howto-faq-changes). Useful for this site: Article, Breadcrumb, Organization (and Profile page for author pages if relevant).
- Starter guide: unique titles per page; snippets drawn mainly from page text; descriptive internal link text; sitemap optional; one canonical URL per content, redirect or `link rel=canonical`, Google picks if unspecified (https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Page experience: no single signal; Core Web Vitals are the part used by ranking systems; HTTPS/mobile/interstitials not direct factors; good scores do not guarantee ranking; relevance can outweigh poor experience (https://developers.google.com/search/docs/appearance/page-experience).

## Checklists

### Accessibility
- [ ] Target WCAG 2.2 AA; publish an accessibility statement with a contact route.
- [ ] Semantic landmarks, one h1, logical heading order, skip link, lang attribute.
- [ ] Visible focus, not hidden by sticky UI (2.4.11); targets >= 24x24 CSS px (2.5.8, number unverified here).
- [ ] No drag-only interactions (2.5.7); no re-asking entered data (3.3.7); consistent help link (3.2.6).
- [ ] Contrast checked in light and dark themes; reflow at 400% zoom; honor prefers-reduced-motion.
- [ ] Tool: labels, errors announced, keyboard complete, screen-reader pass (NVDA + VoiceOver).
- [ ] CI: axe-core (or Lighthouse a11y) on key templates; manual checklist before each release.

### Performance
- [ ] Measure LCP/INP/CLS in lab and (after launch) in field (CrUX / RUM).
- [ ] Ship pages as static HTML; JS only for the tool, loaded on its route.
- [ ] Images responsive, modern format, explicit dimensions, LCP image not lazy-loaded.
- [ ] Fonts: <= 2 families, subset, swap, preloaded critical one.
- [ ] No layout shift from banners, embeds, late fonts.

### Baseline
- [ ] Set browserslist to chosen Baseline query; commit it.
- [ ] Enable `css/use-baseline` at error; keep an allow-list with reasons.
- [ ] Re-review target when yearly set changes (each January).

### SEO
- [ ] Unique title and description per page; self-referencing canonical; one URL per page.
- [ ] XML sitemap with accurate lastmod; robots.txt; submit in Search Console.
- [ ] Article + Breadcrumb + Organization JSON-LD; validate with Rich Results Test.
- [ ] Named author, reviewer, sources, and genuine "last reviewed" date on every guide.
- [ ] Hub-and-spoke internal links with descriptive anchors; no orphan pages.
- [ ] AI-use policy: human review of every page, disclosure line where fitting.

## Suggested budgets
| Item | Budget | Basis |
|---|---|---|
| LCP / INP / CLS (p75) | 2.5 s / 200 ms / 0.1 | https://web.dev/articles/vitals |
| Lighthouse performance (mobile, CI gate) | >= 90 (project goal); alert < 95 | project target; bands from performance-scoring page |
| Critical-path resources, compressed | <= 170 KB | https://web.dev/articles/performance-budgets-101 (illustrative default) |
| JS on article pages | <= 50 KB gzip (own proposal, (unverified)); tool route <= 170 KB | stricter than source because pages are static |
| Images per page | <= 500 KB typical, hard cap 2 MB | cap from web.dev example; typical is own proposal (unverified) |
| Third-party scripts | 0 at launch (analytics via lightweight, deferred) | own proposal (unverified) |

## Decisions needed
1. Accessibility target: (a) WCAG 2.1 AA, (b) 2.2 AA, (c) 2.2 AA plus selected AAA. Recommend (b).
2. Baseline target: (a) Widely available, (b) fixed year e.g. Baseline 2024, (c) Newly available. Recommend (a) with a lint allow-list; revisit if analytics show older browsers matter.
3. AI-assisted drafting: (a) none, (b) allowed with named human reviewer and disclosure, (c) unrestricted. Recommend (b).
4. Structured data scope: (a) none, (b) Article/Breadcrumb/Organization only, (c) also FAQPage/HowTo for non-Google engines. Recommend (b).
5. Legal review: (a) none, (b) accessibility statement plus periodic third-party audit, (c) full VPAT. Recommend (b) once traffic exists; consult counsel for legal specifics.

## Risks
- Lighthouse >= 90 can regress via a single third-party tag, banner, or large hero image.
- The interactive tool is the likely source of a11y failures (focus, errors, drag, live updates).
- YMYL-style accuracy: stale or wrong hiring-process facts harm users and trust; a solo owner must schedule reviews.
- Scaled AI content could trigger spam-policy treatment.
- Litigation statistics come from vendors and law-firm summaries; counts are inconsistent.

## Contradictions
- Title II compliance dates: ada.gov pages describe the 20 Apr 2026 Interim Final Rule as "extending" dates, yet list 26 Apr 2027 / 26 Apr 2028, the same as the original 2024 dates. The fact sheet itself says the before/after is unclear. Not resolved; the IFR text was not retrieved (Federal Register fetch redirected to an unblock page).
- Lawsuit growth: one summary says federal website filings were 3,117 in 2025, +27% over 2,452; another says the share of federal Title III suits rose only 8%; UsableNet projections (~4,975 vs ~6,176 for a year) also differ across articles. Counting methods differ.
- FAQ rich results: Google's older docs and Aug 2023 post limited them to government/health sites, but the current FAQ page says they ended 7 May 2026 for everyone. Prefer the current Google page.
- Lighthouse weights: only v10 table is published on the fetched page; newer Lighthouse versions may differ.

## Open questions
- Exact current Lighthouse performance weights and version in the build toolchain.
- Which INP/LCP field data will be available before launch (CrUX needs traffic).
- Does the tool collect data or need accounts (affects 3.3.7/3.3.8 and privacy pages)?
- Final text of the 2026 Title II Interim Final Rule.
- Browserslist/ESLint coverage for HTML and JS Baseline checks.

## Notes
- Injection check: no instructions directed at the agent were found in fetched pages. One oddity: ada.gov (web-rule-first-steps) page text tells readers to disregard a pop-up on a linked W3C page calling WCAG 2.1 "outdated"; this is addressed to human readers, not acted on. The federalregister.gov request returned a redirect to an "unblock" host; not followed.
- Search-result summaries (SEJ, exchange4media, UsableNet, KRDO) are secondary; Google primary pages were preferred where fetched.
- Vendor sources (Deque, UsableNet) have commercial interest.
