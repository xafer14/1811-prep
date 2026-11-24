#!/usr/bin/env node
// PostToolUse (Edit|Write): formats the edited file with the project's Prettier. Never blocks.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFormattable, parseHookInput, readStdin } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const prettier = join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

const input = parseHookInput(await readStdin());
const file = input.tool_input?.file_path;
if (typeof file === 'string' && existsSync(prettier)) {
  const abs = resolve(file);
  const rel = relative(root, abs).split('\\').join('/');
  if (!isAbsolute(rel) && isFormattable(rel) && existsSync(abs)) {
    // Prettier treats backslashes as glob escapes: pass a project-relative path with forward slashes.
    spawnSync(process.execPath, [prettier, '--write', '--ignore-unknown', rel], {
      cwd: root,
      stdio: 'ignore',
      timeout: 20000,
    });
  }
}
process.exit(0);
