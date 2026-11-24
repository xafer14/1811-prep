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
| Military fitness and body-composition figures | [docs/research/fitness-standards-military.md](research/fitness-standards-military.md) (moves to `src/content/` when data is entered) |
| Federal 1811 fitness figures | [docs/research/fitness-standards-federal.md](research/fitness-standards-federal.md) (moves to `src/content/` when data is entered) |
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
