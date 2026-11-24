import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readText } from './md.mjs';

export const SKILL_TARGET = '.claude/skills/modern-web-guidance/SKILL.md';
const SOURCE = 'node_modules/modern-web-guidance/skills/modern-web-guidance/SKILL.md';
const HEADER =
  '<!-- GENERATED, DO NOT EDIT. Source: modern-web-guidance (pinned in package.json) via `npm run sync:mwg`. See docs/agents/skills.md. -->';
const RUNNER_NOTE = [
  '## Runner (project override)',
  '',
  'This project runs the pinned local package through `node scripts/mwg.mjs` (telemetry disabled, no network needed).',
  'Do not run `npx modern-web-guidance@latest`; it is unpinned and not allowed here.',
  '',
].join('\n');

/** Build the project copy of the upstream SKILL.md, or null if the package is not installed. */
export function generateSkill(root) {
  const sourcePath = join(root, SOURCE);
  if (!existsSync(sourcePath)) return null;
  let text = readText(sourcePath).replace(/\r\n/g, '\n');

  const commands = text.split('npx -y modern-web-guidance@latest ').length - 1;
  if (commands < 3) throw new Error('upstream SKILL.md changed: expected >= 3 npx commands');
  text = text.replaceAll('npx -y modern-web-guidance@latest ', 'node scripts/mwg.mjs ');

  const section = /^## Using npx \/ pnpx\n[\s\S]*?(?=^## )/m;
  if (!section.test(text)) throw new Error('upstream SKILL.md changed: runner section not found');
  text = text.replace(section, `${RUNNER_NOTE}\n`);

  const end = text.indexOf('\n---', 4);
  if (!text.startsWith('---\n') || end === -1) throw new Error('upstream SKILL.md: no frontmatter');
  const frontmatterEnd = end + '\n---'.length;
  return `${text.slice(0, frontmatterEnd)}\n\n${HEADER}${text.slice(frontmatterEnd)}`;
}
