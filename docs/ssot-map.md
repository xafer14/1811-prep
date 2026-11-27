# SSOT map

One owner file per topic. Everything else links to the owner. Owner: defne.

Precedence when sources disagree: measured result (tests, Lighthouse, running app) > config files > code > docs > lessons/research notes. Interview files are history, not current state.

| Topic | Owner file |
|---|---|
| Product what/why, scope, non-goals, routes, NFRs | [docs/SPEC.md](SPEC.md) |
| Decisions with rationale | [docs/decisions/](decisions/) |
| Prioritized work items | [docs/backlog.md](backlog.md) |
| Milestones and phases | [docs/roadmap.md](roadmap.md) |
| Branches, commits, PRs, releases | [docs/git_workflow.md](git_workflow.md) |
| Shared agent rules, commands, definition of done, boundaries, persona table | [AGENTS.md](../AGENTS.md) |
| Claude-only habits | [CLAUDE.md](../CLAUDE.md) |
| Persona roles and owner rulings | `.claude/agents/<name>.md` |
| Fitness and body-composition numbers entered as data (Navy PRT, Marine Corps PFT minimums, Air Force and Space Force walk, ATF, US Marshals, HSI; Army AFT, Air Force PFRA, FBI PFT, DEA PTA, Secret Service APAT as point scales; Army, Navy, Marine Corps, Air Force and Space Force waist-to-height) | `src/content/` JSON files, schema in `src/lib/standards/schema.ts` |
| Military fitness figures not yet entered as data, and the evidence record for all of them | [docs/research/fitness-standards-military.md](research/fitness-standards-military.md) |
| Federal 1811 fitness figures not yet entered as data, and the evidence record for all of them | [docs/research/fitness-standards-federal.md](research/fitness-standards-federal.md) |
| Live-page verification checklist (B-001) | [docs/verification/live-page-checklist.md](verification/live-page-checklist.md) |
| Other researched facts | `docs/research/<topic>.md`, indexed in [docs/research/README.md](research/README.md) |
| Lessons | `docs/lessons/<area>.md` |
| Capability proposals | [docs/proposals/](proposals/) |
| Approved skills and MCP servers | [docs/agents/skills.md](agents/skills.md) |
| Dependency versions | `package.json`, `package-lock.json` |
| TypeScript, lint, format config | `tsconfig.json`, `eslint.config.js`, `.prettierrc.json` |
| Claude permissions, hooks, main-thread agent | `.claude/settings.json` (hook scripts in `scripts/hooks/`, router in `scripts/persona-router.mjs`) |
| Project MCP servers | `.mcp.json` |
| Approved skills, MCP servers, tools, pinned versions and hashes | [docs/agents/skills.md](agents/skills.md); gitleaks version and SHA-256 live in `scripts/gitleaks.mjs` |
| Modern Web Guidance skill | GENERATED `.claude/skills/modern-web-guidance/SKILL.md` from the pinned package (`npm run sync:mwg`) |
| Git hooks | `lefthook.yml` |
| Secret-scan config | `.gitleaks.toml` |
| Codex project config | `.codex/config.toml` |
| CI | `.github/workflows/ci.yml` |
| Environment variable names | `.env.example` |
| Interview records (history) | [docs/interviews/](interviews/) |
