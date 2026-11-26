import { describe, expect, it } from 'vitest';
import { formatTime, parseTime } from './time';

describe('parseTime', () => {
  it.each([
    ['12:18', 738],
    ['0:59', 59],
    ['1:30', 90],
    ['25:00', 1500],
    ['12:18.5', 738.5],
  ])('%s -> %s seconds', (text, seconds) => {
    expect(parseTime(text)).toBe(seconds);
  });

  it.each(['12', '12:6', '12:60', 'abc', '', '1:2:3', '-1:30'])('rejects "%s"', (text) => {
    expect(() => parseTime(text)).toThrow(RangeError);
  });
});

describe('formatTime', () => {
  it.each([
    [738, '12:18'],
    [59, '0:59'],
    [1500, '25:00'],
    [47.73, '0:48'],
  ])('%s -> %s', (seconds, text) => {
    expect(formatTime(seconds)).toBe(text);
  });

  it('rejects negative and non-finite input', () => {
    expect(() => formatTime(-1)).toThrow(RangeError);
    expect(() => formatTime(Number.NaN)).toThrow(RangeError);
  });
});
