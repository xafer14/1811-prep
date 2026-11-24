# Approved skills, MCP servers, and tools

Owner: ozan (vetting), the project owner approves. Each entry: name, source, version, why, date, approved by. Vetting rule: read the package contents first, pin an exact version, project scope only, never pipe a download into a shell.

Approved 2026-11-24 by the owner ("Hepsine go") after the approval table in the bootstrap report.

| Name | Source | Pinned version | Why | What it changes | Telemetry / network |
|---|---|---|---|---|---|
| Modern Web Guidance | npm `modern-web-guidance`, GoogleChrome/modern-web-guidance-src (Apache-2.0; maintainers paulirish, rviscomi, hoten) | 1.0.2 (devDependency, exact) | Current web-platform guidance for UI work | `.claude/skills/modern-web-guidance/SKILL.md` is GENERATED from the package by `npm run sync:mwg`; `check-ssot` fails on drift. `scripts/mwg.mjs` runs the local pinned CLI. | The vendor installer (`npx modern-web-guidance install`) was NOT used: it runs an unpinned third-party `skills` package, and the vendor skill calls `npx ...@latest` on every use. Telemetry is off via `DISABLE_TELEMETRY=1` in `scripts/mwg.mjs`. Works offline. |
| Chrome DevTools MCP | npm `chrome-devtools-mcp`, ChromeDevTools/chrome-devtools-mcp (Apache-2.0) | 1.14.0 (devDependency, exact) | Real-browser inspection, console, network, Lighthouse for UI changes | `.mcp.json` (project scope): `node node_modules/chrome-devtools-mcp/...` with `--isolated`, `--no-usage-statistics`, `--no-performance-crux`, `--no-file-navigations`; env `CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS=1`. | The server exposes browser content to the client (vendor warning). Isolated temp profile: your own Chrome profile and sign-ins are not used. Claude Code asks for approval on first use of a project MCP server. Handshake verified: 33 tools. |
| gitleaks | github.com/gitleaks/gitleaks releases (MIT) | 8.30.1 | Secret scanning (GitHub secret scanning on private personal repos is a paid product) | `scripts/gitleaks.mjs` downloads the release once into `.tools/` (gitignored, 8.4 MB zip on Windows) and verifies SHA-256 values pinned in the script (cross-checked against the release checksums file and the GitHub API digests). `.gitleaks.toml` allowlists `.tools/` and `node_modules/`. | One download from github.com on first use; nothing else. |
| lefthook | npm `lefthook` (MIT) | 2.2.2 (devDependency, exact) | Git hooks: pre-commit (gitleaks on staged files, prettier check, check-ssot), pre-push (`npm run verify`) | `lefthook.yml`; `npx lefthook install` writes `.git/hooks/pre-commit` and `pre-push` (done in this clone). | None. |
| Playwright Chromium | cdn.playwright.dev (Chrome for Testing 159) | chromium-1255 | e2e and axe tests | Browser binaries (about 350 MB) in `%LOCALAPPDATA%\ms-playwright`, outside the repo. | One download. |

## Updating
- Bump a pinned package only through a reviewed change (Dependabot has a 7-day cooldown). After bumping `modern-web-guidance`, run `npm run sync:mwg`.
- Re-verify gitleaks hashes when changing its version in `scripts/gitleaks.mjs`.

## Not installed
- Codex plugins for Modern Web Guidance and DevTools MCP (user-level; see README "Codex setup").
- Any other skill or MCP server: propose it in `docs/proposals/` first.
