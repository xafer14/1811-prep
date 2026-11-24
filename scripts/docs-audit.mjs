#!/usr/bin/env node
// Stale-docs report for defne. Read-only; always exits 0.
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, parseFrontmatter, readText, toPosix, today } from './lib/md.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOON_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const todayStr = today();

const rows = [];
for (const dir of ['docs/research', 'docs/lessons']) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const file of listFiles(abs)) {
    if (!file.endsWith('.md')) continue;
    const text = readText(file);
    const data = parseFrontmatter(text);
    if (!data) continue;
    const days = data.review_by
      ? Math.round((Date.parse(data.review_by) - Date.parse(todayStr)) / DAY_MS)
      : Number.NaN;
    let state = 'ok';
    if (data.status !== 'current') state = data.status ?? 'unknown';
    else if (Number.isNaN(days)) state = 'no-date';
    else if (days < 0) state = 'EXPIRED';
    else if (days <= SOON_DAYS) state = 'soon';
    rows.push({
      file: toPosix(root, file),
      owner: data.owner ?? '?',
      reviewBy: data.review_by ?? '?',
      days,
      state,
      unverified: (text.match(/\(unverified\)/g) ?? []).length,
      excerpt: (text.match(/\(excerpt\)/g) ?? []).length,
      superseded: (text.match(/\(superseded /g) ?? []).length,
    });
  }
}

rows.sort((a, b) => (a.days || 0) - (b.days || 0));
console.log(`docs-audit ${todayStr}`);
console.log('state    review_by   days  unverif excerpt supers owner  file');
for (const r of rows) {
  console.log(
    `${r.state.padEnd(8)} ${r.reviewBy.padEnd(11)} ${String(r.days).padStart(4)}  ${String(r.unverified).padStart(7)} ${String(r.excerpt).padStart(7)} ${String(r.superseded).padStart(6)} ${r.owner.padEnd(6)} ${r.file}`,
  );
}
const expired = rows.filter((r) => r.state === 'EXPIRED').length;
const soon = rows.filter((r) => r.state === 'soon').length;
console.log(`${rows.length} notes, ${expired} expired, ${soon} due within ${SOON_DAYS} days`);
