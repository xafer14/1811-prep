#!/usr/bin/env node
// Stop hook: fast checks (typecheck + lint). Exit 2 blocks the stop and feeds the output to Claude.
// Skips when stop_hook_active is set (loop guard), when node_modules is missing, and when the
// code fingerprint equals the last passing run. Claude Code also caps consecutive blocks at 8.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, toPosix } from '../lib/md.mjs';
import { parseHookInput, readStdin, tailLines } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const stateFile = join(root, '.claude', 'state', 'last-fast-check.txt');
const WATCH_DIRS = ['src', 'scripts', 'e2e'];
const WATCH_FILES = [
  'package.json',
  'tsconfig.json',
  'astro.config.mjs',
  'eslint.config.js',
  'svelte.config.js',
  'vitest.config.ts',
  'playwright.config.ts',
];

function fingerprint() {
  const files = [];
  for (const dir of WATCH_DIRS) {
    if (existsSync(join(root, dir))) files.push(...listFiles(join(root, dir)));
  }
  for (const name of WATCH_FILES) if (existsSync(join(root, name))) files.push(join(root, name));
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    const stats = statSync(file);
    hash.update(`${toPosix(root, file)}:${stats.size}:${stats.mtimeMs}\n`);
  }
  return hash.digest('hex');
}

const input = parseHookInput(await readStdin());
if (input.stop_hook_active === true) process.exit(0);
if (!existsSync(join(root, 'node_modules'))) {
  console.error('stop-check: node_modules missing, skipping (run npm install)');
  process.exit(0);
}

const current = fingerprint();
if (existsSync(stateFile) && readFileSync(stateFile, 'utf8').trim() === current) process.exit(0);

for (const script of ['typecheck', 'lint']) {
  const result = spawnSync('npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    timeout: 150000,
  });
  if (result.status !== 0) {
    const output = tailLines(`${result.stdout ?? ''}\n${result.stderr ?? ''}`, 40);
    console.error(`Fast check failed: npm run ${script}. Fix it before finishing.\n${output}`);
    process.exit(2);
  }
}
mkdirSync(dirname(stateFile), { recursive: true });
writeFileSync(stateFile, `${current}\n`);
process.exit(0);
