@AGENTS.md

# Claude Code notes

- Plan mode for anything touching more than two files or the content schema; show the plan before editing.
- If an advisor is configured, consult it before a plan locks, after the same error twice, and before saying "done".
- Delegate by persona (see the table above); name the reason in one line; wake only the personas the task needs.
- Use `/context` when a session feels slow or confused; `/clear` between unrelated tasks.
- Run `/kapanis` before ending a session that produced owner rulings or changed behavior.
- CLAUDE.md is guidance, not enforcement; hard rules live in `.claude/settings.json` and `npm run verify`.
