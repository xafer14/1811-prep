import { describe, expect, it } from 'vitest';
import type { EventResult } from '../standards/evaluate';
import { describeMargin, formatClock, formatValue, statusLabel } from './format';
import {
  parseAge,
  parseEventValue,
  parseLength,
  parseWeight,
  unitHint,
  type Parsed,
} from './inputs';

const okValue = (parsed: Parsed): number | undefined => {
  if (!parsed.ok) throw new Error(`unexpected error: ${parsed.message}`);
  return parsed.value;
};
const errorOf = (parsed: Parsed): string => {
  if (parsed.ok) throw new Error('expected an error');
  return parsed.message;
};

describe('parseAge', () => {
  it.each([
    ['17', 17],
    [' 24 ', 24],
    ['80', 80],
  ])('accepts %s', (text, expected) => {
    expect(okValue(parseAge(text))).toBe(expected);
  });

  it('rejects empty, minors, decimals, text and very high ages', () => {
    expect(errorOf(parseAge(''))).toMatch(/Enter your age/);
    expect(errorOf(parseAge('16'))).toMatch(/17 and older/);
    expect(errorOf(parseAge('24.5'))).toMatch(/whole years/);
    expect(errorOf(parseAge('abc'))).toMatch(/whole years/);
    expect(errorOf(parseAge('81'))).toMatch(/80 or less/);
    expect(errorOf(parseAge('-5'))).toMatch(/whole years/);
  });
});

describe('parseLength and parseWeight', () => {
  it('allows empty fields', () => {
    expect(okValue(parseLength('', 'us', 'height'))).toBeUndefined();
    expect(okValue(parseWeight('  ', 'metric'))).toBeUndefined();
  });

  it('accepts typical values in both unit systems', () => {
    expect(okValue(parseLength('70', 'us', 'height'))).toBe(70);
    expect(okValue(parseLength('177,5', 'metric', 'height'))).toBe(177.5);
    expect(okValue(parseLength('33', 'us', 'waist'))).toBe(33);
    expect(okValue(parseLength('70', 'metric', 'waist'))).toBe(70);
    expect(okValue(parseWeight('170', 'us'))).toBe(170);
    expect(okValue(parseWeight('77.5', 'metric'))).toBe(77.5);
  });

  it('rejects values that cannot be real, and mixed-up units', () => {
    expect(errorOf(parseLength('0', 'us', 'height'))).toMatch(/inches/);
    expect(errorOf(parseLength('7', 'us', 'height'))).toMatch(/does not look right/);
    expect(errorOf(parseLength('70', 'metric', 'height'))).toMatch(/does not look right/);
    expect(errorOf(parseLength('7', 'us', 'waist'))).toMatch(/does not look right/);
    expect(errorOf(parseLength('300', 'metric', 'waist'))).toMatch(/does not look right/);
    expect(errorOf(parseLength('seventy', 'us', 'waist'))).toMatch(/inches/);
    expect(errorOf(parseWeight('15', 'us'))).toMatch(/does not look right/);
    expect(errorOf(parseWeight('900', 'metric'))).toMatch(/does not look right/);
  });
});

describe('parseEventValue', () => {
  it('reads repetitions as whole numbers', () => {
    expect(okValue(parseEventValue('reps', '33', 'us'))).toBe(33);
    expect(errorOf(parseEventValue('reps', '33.5', 'us'))).toMatch(/whole number/);
    expect(errorOf(parseEventValue('reps', 'many', 'us'))).toMatch(/number/);
  });

  it('reads times as minutes:seconds or plain seconds', () => {
    expect(okValue(parseEventValue('seconds', '12:30', 'us'))).toBe(750);
    expect(okValue(parseEventValue('seconds', '0:47.73', 'us'))).toBeCloseTo(47.73, 5);
    expect(okValue(parseEventValue('seconds', '47.5', 'us'))).toBe(47.5);
    expect(errorOf(parseEventValue('seconds', '12:75', 'us'))).toMatch(/minutes and seconds/);
    expect(errorOf(parseEventValue('seconds', 'fast', 'us'))).toMatch(/minutes and seconds/);
  });

  it('converts metric entries into the standard unit', () => {
    expect(okValue(parseEventValue('pounds', '100', 'us'))).toBe(100);
    expect(okValue(parseEventValue('pounds', '100', 'metric'))).toBeCloseTo(220.46, 2);
    expect(okValue(parseEventValue('inches', '25.4', 'metric'))).toBeCloseTo(10, 6);
  });

  it('allows empty fields', () => {
    expect(okValue(parseEventValue('reps', '', 'us'))).toBeUndefined();
  });
});

describe('unitHint', () => {
  it('describes what to type', () => {
    expect(unitHint('pounds', 'metric')).toBe('kilograms');
    expect(unitHint('inches', 'us')).toBe('inches');
    expect(unitHint('seconds', 'us')).toMatch(/minutes:seconds/);
    expect(unitHint('reps', 'us')).toBe('repetitions');
  });
});

describe('formatting', () => {
  it.each([
    [738, '12:18'],
    [47.73, '0:47.73'],
    [59, '0:59'],
    [1500, '25:00'],
  ])('formatClock(%s) = %s', (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });

  it('formats values in the user unit system', () => {
    expect(formatValue('pounds', 150, 'us')).toBe('150 lb');
    expect(formatValue('pounds', 150, 'metric')).toBe('68 kg');
    expect(formatValue('inches', 17.5, 'us')).toBe('17.5 in');
    expect(formatValue('inches', 17.5, 'metric')).toBe('44.5 cm');
    expect(formatValue('reps', 33, 'us')).toBe('33 reps');
  });

  const base = { eventId: 'x', eventName: 'X', minimum: 10 } as const;
  const result = (overrides: Partial<EventResult>): EventResult => ({
    ...base,
    unit: 'reps',
    status: 'meets',
    value: 12,
    margin: 2,
    ...overrides,
  });

  it('describes margins in plain words', () => {
    expect(describeMargin(result({}), 'us')).toBe('2 reps more than the minimum.');
    expect(describeMargin(result({ margin: 1, value: 11 }), 'us')).toBe(
      '1 rep more than the minimum.',
    );
    expect(describeMargin(result({ margin: -3, value: 7, status: 'below' }), 'us')).toBe(
      '3 reps short of the minimum.',
    );
    expect(describeMargin(result({ margin: 0, value: 10 }), 'us')).toBe('Exactly at the minimum.');
    expect(describeMargin(result({ unit: 'seconds', margin: 12.5 }), 'us')).toBe(
      '12.5 seconds ahead of the minimum.',
    );
    expect(describeMargin(result({ unit: 'seconds', margin: -4, status: 'below' }), 'us')).toBe(
      '4 seconds short of the minimum.',
    );
    expect(
      describeMargin(result({ unit: 'inches', margin: -1.5, status: 'below' }), 'metric'),
    ).toBe('3.8 cm short of the minimum.');
    expect(describeMargin(result({ unit: 'pounds', margin: 10 }), 'us')).toBe(
      '10 lb above the minimum.',
    );
  });

  it('returns nothing without a margin', () => {
    expect(describeMargin(result({ margin: undefined, status: 'not-entered' }), 'us')).toBe('');
  });

  it('has a plain label for every status', () => {
    expect(statusLabel('meets')).toBe('Meets the minimum');
    expect(statusLabel('below')).toBe('Below the minimum');
    expect(statusLabel('not-entered')).toBe('No result entered');
    expect(statusLabel('no-standard')).toMatch(/your age/);
  });
});
