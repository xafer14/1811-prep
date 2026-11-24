import { extname } from 'node:path';

const FORMATTABLE = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.json',
  '.yml',
  '.yaml',
  '.astro',
  '.svelte',
  '.css',
  '.html',
]);
const SKIP_PREFIXES = ['node_modules/', '.tools/', 'dist/', '.astro/', '.claude/state/'];

/** True if a project-relative POSIX path should be auto-formatted by the PostToolUse hook. */
export function isFormattable(relPath) {
  if (relPath.startsWith('..') || /^[A-Za-z]:/.test(relPath)) return false;
  if (SKIP_PREFIXES.some((prefix) => relPath.startsWith(prefix))) return false;
  return FORMATTABLE.has(extname(relPath).toLowerCase());
}

/** SessionEnd rule: remind when files changed and the owner never ran /kapanis in this chat. */
export function wantsReminder({ porcelain, transcript }) {
  if (porcelain.trim() === '') return false;
  return !/<command-name>\/?kapanis<\/command-name>/.test(transcript ?? '');
}

/** Last n non-empty lines, with terminal color codes removed. */
export function tailLines(text, n) {
  // eslint-disable-next-line no-control-regex
  const plain = text.replace(/\u001b\[[0-9;]*m/g, '');
  return plain
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(-n)
    .join('\n');
}

/** Parse hook stdin; hooks never fail on malformed input. */
export function parseHookInput(raw) {
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
