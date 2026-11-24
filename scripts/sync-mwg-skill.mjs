#!/usr/bin/env node
// Regenerates .claude/skills/modern-web-guidance/SKILL.md from the pinned package.
// Run after changing the modern-web-guidance version: npm run sync:mwg
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILL_TARGET, generateSkill } from './lib/mwg-skill.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const content = generateSkill(root);
if (content === null) {
  console.error('modern-web-guidance is not installed. Run: npm install');
  process.exit(1);
}
const target = join(root, SKILL_TARGET);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, content, 'utf8');
console.log(`wrote ${SKILL_TARGET}`);
