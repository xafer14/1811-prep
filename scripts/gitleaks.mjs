#!/usr/bin/env node
// Runs a pinned gitleaks binary. Downloads it once into .tools/ (gitignored) and verifies the
// archive against the SHA-256 pinned below before extracting. Usage: node scripts/gitleaks.mjs <gitleaks args>
// Source: https://github.com/gitleaks/gitleaks/releases (checksums cross-checked on 2026-11-24
// against the release checksums file and the GitHub API asset digests). See docs/agents/skills.md.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '8.30.1';
const SHA256 = {
  'darwin-arm64': ['tar.gz', 'b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5'],
  'darwin-x64': ['tar.gz', 'dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709'],
  'linux-arm64': ['tar.gz', 'e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080'],
  'linux-x64': ['tar.gz', '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'],
  'win32-x64': ['zip', 'd29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e'],
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const key = `${process.platform}-${process.arch}`;
const entry = SHA256[key];
if (!entry) {
  console.error(`gitleaks: no pinned build for ${key}`);
  process.exit(1);
}
const [ext, expected] = entry;
const platformName = { 'win32-x64': 'windows_x64' }[key] ?? key.replace('-', '_');
const asset = `gitleaks_${VERSION}_${platformName}.${ext}`;
const dir = join(root, '.tools', `gitleaks-${VERSION}`);
const exe = join(dir, process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks');

async function ensureBinary() {
  if (existsSync(exe)) return;
  mkdirSync(dir, { recursive: true });
  const url = `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${asset}`;
  console.error(`gitleaks: downloading ${asset}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) {
    throw new Error(`checksum mismatch for ${asset}: expected ${expected}, got ${actual}`);
  }
  const archive = join(dir, asset);
  writeFileSync(archive, bytes);
  // Windows ships bsdtar, which also reads .zip; Git Bash's GNU tar does not, so use the system one.
  const tar =
    process.platform === 'win32'
      ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe')
      : 'tar';
  const unpack = spawnSync(tar, ['-xf', archive, '-C', dir], { stdio: 'inherit' });
  rmSync(archive, { force: true });
  if (unpack.status !== 0 || !existsSync(exe)) throw new Error('extraction failed');
  console.error(`gitleaks ${VERSION}: checksum verified and extracted to .tools/`);
}

try {
  await ensureBinary();
} catch (error) {
  console.error(`gitleaks: ${error instanceof Error ? error.message : error}`);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}
const result = spawnSync(exe, process.argv.slice(2), { stdio: 'inherit' });
process.exit(result.status ?? 1);
