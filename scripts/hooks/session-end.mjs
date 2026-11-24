#!/usr/bin/env node
// SessionEnd (shell-only, short time budget): leave a marker when files changed but /kapanis
// was never run in this chat. No hook can run the model at close; this only leaves a reminder.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHookInput, readStdin, wantsReminder } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const marker = join(root, '.claude', 'state', 'pending-kapanis.json');

const input = parseHookInput(await readStdin());
const status = spawnSync('git', ['status', '--porcelain'], {
  cwd: root,
  encoding: 'utf8',
  timeout: 1000,
});
const porcelain = status.status === 0 ? (status.stdout ?? '') : '';
let transcript = '';
const path = input.transcript_path;
if (typeof path === 'string' && existsSync(path)) {
  try {
    transcript = readFileSync(path, 'utf8');
  } catch {
    transcript = '';
  }
}
if (wantsReminder({ porcelain, transcript })) {
  mkdirSync(dirname(marker), { recursive: true });
  const changed = porcelain.split('\n').filter(Boolean).length;
  writeFileSync(marker, `${JSON.stringify({ endedAt: new Date().toISOString(), changed })}\n`);
}
process.exit(0);
