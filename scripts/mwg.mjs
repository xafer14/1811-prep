#!/usr/bin/env node
// Runs the pinned, locally installed Modern Web Guidance CLI with telemetry disabled.
// Usage: node scripts/mwg.mjs search "<query>" | retrieve "<id>" | list
// Why a wrapper: the upstream skill calls `npx -y modern-web-guidance@latest` (unpinned, with
// telemetry on). docs/agents/skills.md records the decision.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(
  root,
  'node_modules',
  'modern-web-guidance',
  'skills',
  'modern-web-guidance',
  'modern-web.mjs',
);

if (!existsSync(cli)) {
  console.error('modern-web-guidance is not installed. Run: npm install');
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, DISABLE_TELEMETRY: '1' },
});
process.exit(result.status ?? 1);
