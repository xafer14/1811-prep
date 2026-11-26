---
topic: tooling lessons
owner: defne
status: current
last_verified: 2026-11-24
review_by: 2027-05-23
sources: [scripts/hooks/format-file.mjs, AGENTS.md]
superseded_by:
---
# Tooling lessons

## 2026-11-24: hook test input mangled by the shell layer
- What happened: two manual hook tests "failed" because Windows paths with backslashes typed into the shell command were changed on the way, so the hook received invalid JSON and (by design) did nothing. This looked like a hook bug twice.
- Cause: the test input was hand-typed in the shell instead of built in code.
- Rule: build hook test input with `JSON.stringify` in Node and build backslashes with `String.fromCharCode(92)`; never hand-type Windows paths in a shell command.
- Guard: proposed. A vitest that spawns `scripts/hooks/format-file.mjs` with a real backslash path on stdin and checks the file was formatted.

## 2026-11-24: running dev server blocks `npm ci` on Windows
- What happened: a background `astro dev` held `node_modules` native `.node` files, so `npm ci` failed with EPERM. Stopping the npm wrapper did not stop its child process.
- Cause: the child `astro` process kept running after the wrapper was stopped.
- Rule: stop the dev server and its child before `npm ci` (written in AGENTS.md Gotchas).
- Guard: proposed. A `scripts/stop-dev.mjs` that kills whatever listens on port 4321, and `npm ci` is never run without it.

## 2026-11-26: dev server served stale content after a schema and data change
- What happened: after adding a required `family` field to the schema and all data files, the running dev server kept its old content cache. The compare page rendered with no event rows and three e2e tests failed, although unit tests and a fresh build passed.
- Cause: Playwright reuses a server already listening on port 4321 (`reuseExistingServer: true`), so the tests ran against the stale dev server instead of the build.
- Rule: restart the dev server (and delete `.astro`) after changing the content schema or data files; run e2e against a fresh build.
- Guard: proposed. Make `playwright.config.ts` start its own build and preview (`reuseExistingServer: false`) so dev-server state can never affect e2e results; it needs the dev server stopped, which CI already guarantees.
