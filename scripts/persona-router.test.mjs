import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { findMentions, hint, normalize, routableNames } from './persona-router.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const names = routableNames(root);

describe('persona-router', () => {
  it('reads names from the cards and skips routing: none', () => {
    expect(names).toContain('yigit');
    expect(names).toContain('aras');
    expect(names).not.toContain('kesif');
    expect(names).not.toContain('iz');
    expect(names).not.toContain('kosucu');
  });

  it('normalizes Turkish letters', () => {
    expect(normalize('YİĞİT ŞÇÖÜı')).toBe('yigit scoui');
  });

  it.each([
    ["yiğit'e söyle butonu düzeltsin", ['yigit']],
    ['YİĞİTE bak, header kayıyor', ['yigit']],
    ["Sinan bu PR'ı incelesin, sonra pelin testleri koşsun", ['sinan', 'pelin']],
    ["aras'ın planını onayladım", ['aras']],
    ['kesif repo haritasını çıkarsın', []],
    ['header rengini değiştir', []],
    // Known false positive: the Turkish word "arasında" (between) starts with "aras".
    ['bu iki dosyanın arasında fark var', ['aras']],
  ])('%s -> %j', (text, expected) => {
    expect(findMentions(text, names).sort()).toEqual([...expected].sort());
  });

  it('prints one line or nothing', () => {
    expect(hint([])).toBe('');
    expect(hint(['yigit'])).toBe(
      'Possible persona mention: yigit. If it refers to the persona, delegate to it.',
    );
  });
});
