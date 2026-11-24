import { describe, expect, it } from 'vitest';
import { isFormattable, parseHookInput, tailLines, wantsReminder } from './lib.mjs';

describe('isFormattable', () => {
  it.each([
    ['src/pages/index.astro', true],
    ['scripts/check-ssot.mjs', true],
    ['package.json', true],
    ['docs/SPEC.md', false],
    ['node_modules/x/index.js', false],
    ['dist/index.html', false],
    ['.tools/gitleaks-8.30.1/README.md', false],
    ['../outside/file.ts', false],
    ['C:/elsewhere/file.ts', false],
    ['public/favicon.ico', false],
  ])('%s -> %s', (path, expected) => {
    expect(isFormattable(path)).toBe(expected);
  });
});

describe('wantsReminder', () => {
  const ran = '{"text":"<command-name>/kapanis</command-name>"}';
  it('reminds when files changed and /kapanis never ran', () => {
    expect(wantsReminder({ porcelain: ' M src/a.ts\n', transcript: 'hello' })).toBe(true);
  });
  it('does not remind when /kapanis ran', () => {
    expect(wantsReminder({ porcelain: ' M src/a.ts\n', transcript: ran })).toBe(false);
  });
  it('does not remind on a clean tree', () => {
    expect(wantsReminder({ porcelain: '', transcript: 'hello' })).toBe(false);
  });
  it('ignores a mere mention of kapanis in text', () => {
    expect(wantsReminder({ porcelain: '?? a\n', transcript: 'run /kapanis later' })).toBe(true);
  });
});

describe('helpers', () => {
  it('keeps the last lines and strips color codes', () => {
    expect(tailLines('a\n\u001b[31mb\u001b[0m\n\nc\n', 2)).toBe('b\nc');
  });
  it('parses bad hook input as an empty object', () => {
    expect(parseHookInput('not json')).toEqual({});
    expect(parseHookInput('{"a":1}')).toEqual({ a: 1 });
  });
});
