# 1811 Prep

Fitness and body-composition standards for US military and federal law enforcement candidates, with an in-browser readiness tool. Not affiliated with any government agency or military service.

- Product spec: [docs/SPEC.md](docs/SPEC.md)
- Agent rules and commands: [AGENTS.md](AGENTS.md)
- Where each fact lives: [docs/ssot-map.md](docs/ssot-map.md)

## Quick start (Windows, macOS, Linux)
Requires Node >= 22.23.4 (developed on Node 24).

```
npm install
npx lefthook install
npx playwright install chromium
npm run dev
npm run verify
```

`lefthook install` enables the git hooks (secret scan on staged files, format check, SSOT check; `npm run verify` before push). `playwright install` is only needed for `npm run test:e2e`.

## Codex setup
Codex reads `AGENTS.md` natively. To work as a persona, say: "work as sinan: read .claude/agents/sinan.md first".

`.codex/config.toml` sets a conservative approval policy and a workspace-write sandbox; Codex applies it only after you trust the project. Per-user settings (model, profiles, MCP servers) belong in `~/.codex/config.toml`, not in this repo.

Optional, user-level, not installed by this repo (see [docs/agents/skills.md](docs/agents/skills.md)):
- Chrome DevTools MCP: `codex mcp add chrome-devtools -- npx chrome-devtools-mcp@1.14.0 --isolated --no-usage-statistics --no-performance-crux --no-file-navigations` (on Windows the vendor suggests a `cmd /c npx` entry in `config.toml`).
- Modern Web Guidance: `node scripts/mwg.mjs search "<query>"` works in any agent without a plugin.
