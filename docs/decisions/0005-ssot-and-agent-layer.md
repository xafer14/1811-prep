# 0005: Single source of truth for docs; Claude Code primary, Codex thin adapter

- Status: accepted (owner, 2026-11-24)
- Context: the project is built with AI agents across sessions on different models; duplicated facts drift.
- Decision: one owner file per fact, listed in [ssot-map](../ssot-map.md); shared rules in `AGENTS.md`; `CLAUDE.md` imports it with `@AGENTS.md`; persona role cards in `.claude/agents/`; Codex reads `AGENTS.md` and the cards as plain markdown; `scripts/check-ssot.mjs` runs inside `npm run verify`.
- Alternatives: separate CLAUDE.md and AGENTS.md content (drift); generated Codex mirrors (only with owner approval).
- Consequences: any behavior change updates its owning doc in the same change; mirrors, if ever approved, are generated and drift-checked.
