#!/usr/bin/env node
// UserPromptSubmit helper: prints a one-line hint when the prompt mentions a persona by name.
// Persona names come from .claude/agents/*.md (cards with `routing: none` are ignored).
// It never blocks: any error exits 0 with no output. The model decides what to do with the hint.
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadAgents } from './lib/md.mjs';

const TURKISH_MAP = { ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u' };

/** Lowercase with Turkish rules, then strip diacritics to plain a-z. */
export function normalize(text) {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[ığşçöü]/g, (ch) => TURKISH_MAP[ch] ?? ch)
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function routableNames(root) {
  return loadAgents(root)
    .filter((agent) => agent.name && agent.data.routing !== 'none')
    .map((agent) => agent.name);
}

/** Names that start a word in the text (suffixes such as 'e, -e, -in are allowed). */
export function findMentions(text, names) {
  const plain = normalize(text);
  return names.filter((name) => new RegExp(`(^|[^a-z0-9])${normalize(name)}`).test(plain));
}

export function hint(mentions) {
  if (mentions.length === 0) return '';
  return `Possible persona mention: ${mentions.join(', ')}. If it refers to the persona, delegate to it.`;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const raw = await readStdin();
  let prompt = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.prompt === 'string') prompt = parsed.prompt;
  } catch {
    // Plain text input (manual testing).
  }
  const line = hint(findMentions(prompt, routableNames(root)));
  if (line) process.stdout.write(`${line}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => process.exit(0));
}
