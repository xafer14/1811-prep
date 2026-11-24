import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Parse a simple YAML frontmatter block (key: value, inline [a, b] lists). */
export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return null;
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) return null;
  const data = {};
  for (const line of normalized.slice(4, end).split('\n')) {
    const match = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const raw = (match[2] ?? '').trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      data[key] = raw;
    }
  }
  return data;
}

export function readText(path) {
  return readFileSync(path, 'utf8');
}

/** Recursively list files under dir, skipping ignored directory names. */
export function listFiles(dir, ignore = new Set()) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (ignore.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, ignore));
    else out.push(full);
  }
  return out;
}

export function toPosix(root, path) {
  return relative(root, path).split(sep).join('/');
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Persona cards in .claude/agents: [{ name, file, data, text }]. */
export function loadAgents(root) {
  const dir = join(root, '.claude', 'agents');
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const text = readText(join(dir, file));
      const data = parseFrontmatter(text) ?? {};
      return { name: data.name ?? '', file, data, text };
    });
}
