#!/usr/bin/env node
// SSOT guard, part of `npm run verify`. Errors fail the run; warnings only print.
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILL_TARGET, generateSkill } from './lib/mwg-skill.mjs';
import {
  DATE_RE,
  listFiles,
  loadAgents,
  parseFrontmatter,
  readText,
  toPosix,
  today,
} from './lib/md.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const MAX_AGENTS_LINES = 150;
const MAX_CLAUDE_LINES = 30;
const MAX_CARD_LINES = 120;
const KNOWLEDGE_DIRS = ['docs/research', 'docs/lessons'];
const STATUSES = new Set(['current', 'superseded', 'unverified']);
const REQUIRED_KEYS = [
  'topic',
  'owner',
  'status',
  'last_verified',
  'review_by',
  'sources',
  'superseded_by',
];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.astro',
  'coverage',
  'playwright-report',
  'test-results',
  '.wrangler',
]);
// Generated mirrors approved by the owner: { source, target }. Target must start with a
// "GENERATED, DO NOT EDIT" line followed by the exact source content. None approved yet.
const MIRRORS = [];

const lineCount = (text) => text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;

// 1. Persona cards and commands.
const agents = loadAgents(root);
const agentNames = new Set();
for (const agent of agents) {
  const where = `.claude/agents/${agent.file}`;
  if (!agent.name) err(`${where}: missing frontmatter name`);
  else if (agent.file !== `${agent.name}.md`) err(`${where}: file name must be ${agent.name}.md`);
  if (!agent.data.model) err(`${where}: model must be pinned in frontmatter`);
  if (!agent.data.description?.startsWith(agent.name))
    err(`${where}: description must start with the persona name`);
  if (!agent.text.includes('## Owner rulings')) err(`${where}: missing "## Owner rulings" section`);
  if (lineCount(agent.text) > MAX_CARD_LINES)
    warn(`${where}: over ${MAX_CARD_LINES} lines; consider a split proposal`);
  if (!existsSync(join(root, '.claude', 'commands', `${agent.name}.md`)))
    err(`.claude/commands/${agent.name}.md missing for persona ${agent.name}`);
  agentNames.add(agent.name);
}

// 2. AGENTS.md and CLAUDE.md.
const agentsMd = readText(join(root, 'AGENTS.md'));
if (lineCount(agentsMd) > MAX_AGENTS_LINES)
  err(`AGENTS.md has ${lineCount(agentsMd)} lines (max ${MAX_AGENTS_LINES})`);
const claudeMd = readText(join(root, 'CLAUDE.md'));
if (lineCount(claudeMd) > MAX_CLAUDE_LINES)
  err(`CLAUDE.md has ${lineCount(claudeMd)} lines (max ${MAX_CLAUDE_LINES})`);
if (claudeMd.replace(/\r\n/g, '\n').split('\n')[0] !== '@AGENTS.md')
  err('CLAUDE.md line 1 must be exactly "@AGENTS.md"');

// 3. Persona table in AGENTS.md must match .claude/agents.
const tableNames = new Set();
for (const match of agentsMd.matchAll(/^\|\s*([a-z][a-z0-9-]*)\s*\|.*\.claude\/agents\/\1\.md/gm)) {
  tableNames.add(match[1]);
}
for (const name of agentNames)
  if (!tableNames.has(name)) err(`AGENTS.md persona table is missing ${name}`);
for (const name of tableNames)
  if (!agentNames.has(name)) err(`AGENTS.md persona table lists ${name}, but no card exists`);

// 4. Knowledge-file frontmatter.
const todayStr = today();
for (const dir of KNOWLEDGE_DIRS) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const file of listFiles(abs)) {
    if (!file.endsWith('.md')) continue;
    const rel = toPosix(root, file);
    if (rel.endsWith('/README.md') && dir === 'docs/lessons') continue;
    const data = parseFrontmatter(readText(file));
    if (!data) {
      err(`${rel}: missing frontmatter`);
      continue;
    }
    for (const key of REQUIRED_KEYS)
      if (!(key in data)) err(`${rel}: frontmatter missing "${key}"`);
    if (data.status && !STATUSES.has(data.status))
      err(`${rel}: status must be current|superseded|unverified`);
    if (data.status === 'superseded' && !data.superseded_by)
      err(`${rel}: superseded note needs superseded_by`);
    for (const key of ['last_verified', 'review_by'])
      if (data[key] && !DATE_RE.test(data[key])) err(`${rel}: ${key} must be YYYY-MM-DD`);
    if (data.owner && !agentNames.has(data.owner))
      err(`${rel}: owner "${data.owner}" is not a persona`);
    if (!Array.isArray(data.sources) || data.sources.length === 0)
      err(`${rel}: sources must be a non-empty [list]`);
    if (data.status === 'current' && data.review_by && data.review_by < todayStr)
      warn(`${rel}: review_by ${data.review_by} has passed; treat as unverified`);
  }
}

// 5. Generated mirrors must not drift.
for (const { source, target } of MIRRORS) {
  const expected = readText(join(root, source));
  const actual = existsSync(join(root, target)) ? readText(join(root, target)) : '';
  const body = actual.replace(/^.*GENERATED, DO NOT EDIT.*\r?\n/, '');
  if (!actual.includes('GENERATED, DO NOT EDIT')) err(`${target}: missing GENERATED header`);
  else if (body !== expected) err(`${target}: drifted from ${source}; regenerate it`);
}

// 5b. The Modern Web Guidance skill is generated from the pinned package.
{
  const expected = generateSkill(root);
  const targetPath = join(root, SKILL_TARGET);
  if (expected === null)
    warn(`${SKILL_TARGET}: modern-web-guidance not installed; drift not checked`);
  else if (!existsSync(targetPath)) err(`${SKILL_TARGET}: missing; run npm run sync:mwg`);
  else if (readText(targetPath).replace(/\r\n/g, '\n') !== expected)
    err(`${SKILL_TARGET}: drifted from the pinned package; run npm run sync:mwg`);
}

// 6. Broken relative links in markdown.
const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
for (const file of listFiles(root, IGNORE_DIRS)) {
  if (!file.endsWith('.md')) continue;
  const text = readText(file).replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(linkRe)) {
    const target = match[1] ?? '';
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURI(target.split('#')[0] ?? '');
    if (!path) continue;
    if (!existsSync(resolve(dirname(file), path)))
      err(`${toPosix(root, file)}: broken link -> ${target}`);
  }
}

for (const msg of warnings) console.warn(`warn  ${msg}`);
for (const msg of errors) console.error(`error ${msg}`);
console.log(
  `check-ssot: ${errors.length} error(s), ${warnings.length} warning(s), ${agentNames.size} personas`,
);
process.exit(errors.length > 0 ? 1 : 0);
