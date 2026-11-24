---
topic: team and agents interview (Round F)
owner: aras
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [owner instruction 2026-11-24]
superseded_by:
---
# Round F: Team and agents

Not asked as questions. The owner chose on 2026-11-24 to proceed with agent defaults and correct later. Every item below is an unreviewed default unless marked otherwise.

1. Git flow: trunk-based; `main` is the only long-lived branch (local `master` renamed to `main` to match the remote default); short-lived `feat/`, `fix/`, `docs/`, `chore/` branches; Conventional Commits; PR into `main`.
2. Review: solo owner approves every PR; sinan (security) and pelin (QA) review non-trivial changes first.
3. Personas: default names kept: aras, defne, tuna, yigit, baran, sinan, pelin, derya, ozan, kesif, iz, kosucu.
4. Model tiers (pinned in each agent's frontmatter): aras `inherit`; yigit, baran, sinan, pelin, ozan, derya `sonnet`; defne, tuna `sonnet`; kesif, iz, kosucu `haiku`.
5. AI token budget: not provided (open).
6. Approved by the owner on 2026-11-24 ("Hepsine go") after the approval table: persona-router UserPromptSubmit hook; `"agent": "aras"` as main-thread agent; Stop (typecheck + lint), PostToolUse (Prettier) and SessionStart/SessionEnd (/kapanis reminder) hooks; Modern Web Guidance; Chrome DevTools MCP; lefthook + gitleaks; Playwright Chromium. Details and pinned versions: [docs/agents/skills.md](../agents/skills.md). The owner approved `"agent": "aras"` knowing it was untested as a main-thread agent.
