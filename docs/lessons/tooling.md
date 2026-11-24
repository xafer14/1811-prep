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
