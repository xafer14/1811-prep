#!/usr/bin/env node
// SessionStart: if the previous session left a marker, tell Claude to remind the owner once.
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const marker = join(root, '.claude', 'state', 'pending-kapanis.json');

if (existsSync(marker)) {
  let detail = '';
  try {
    const data = JSON.parse(readFileSync(marker, 'utf8'));
    detail = ` (${data.changed} changed paths, ended ${data.endedAt})`;
  } catch {
    // Unreadable marker: still remind.
  }
  rmSync(marker, { force: true });
  console.log(
    `Reminder for the owner: the previous session ended with uncommitted changes and no /kapanis run${detail}. Tell the owner once, in one Turkish sentence, that /kapanis can record rulings and stale docs.`,
  );
}
process.exit(0);
