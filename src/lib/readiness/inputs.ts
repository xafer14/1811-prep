import { CM_PER_INCH, KG_PER_POUND } from '../body';
import { parseTime } from '../time';
import type { StandardEvent } from '../standards/schema';

export type UnitSystem = 'us' | 'metric';

/** Parsed text field: a value, an empty field, or an error message for the user. */
export type Parsed = { ok: true; value: number | undefined } | { ok: false; message: string };

export const MIN_AGE = 17;
export const MAX_AGE = 80;

function cleanNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '' || !/^\d+(?:\.\d+)?$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

/** Age in whole years; the tool is for people 17 and older (docs/SPEC.md). */
export function parseAge(text: string): Parsed {
  if (text.trim() === '') return { ok: false, message: 'Enter your age.' };
  const value = cleanNumber(text);
  if (value === undefined || !Number.isInteger(value)) {
    return { ok: false, message: 'Enter your age in whole years, for example 24.' };
  }
  if (value < MIN_AGE) return { ok: false, message: 'This tool is for people 17 and older.' };
  if (value > MAX_AGE) return { ok: false, message: `Enter an age of ${MAX_AGE} or less.` };
  return { ok: true, value };
}

export type LengthKind = 'height' | 'waist';

/** Plausible adult range in inches for each measurement. */
const LENGTH_RANGE: Record<LengthKind, readonly [number, number]> = {
  height: [48, 96],
  waist: [20, 80],
};

/** Height or waist in inches or centimeters; empty is allowed. */
export function parseLength(text: string, system: UnitSystem, kind: LengthKind): Parsed {
  if (text.trim() === '') return { ok: true, value: undefined };
  const value = cleanNumber(text);
  const unit = system === 'us' ? 'inches' : 'centimeters';
  if (value === undefined || value <= 0) {
    const example =
      kind === 'height' ? (system === 'us' ? '70' : '178') : system === 'us' ? '33' : '84';
    return { ok: false, message: `Enter a number in ${unit}, for example ${example}.` };
  }
  const inches = system === 'us' ? value : value / CM_PER_INCH;
  const [low, high] = LENGTH_RANGE[kind];
  if (inches < low || inches > high) {
    return { ok: false, message: `That does not look right. Check the number in ${unit}.` };
  }
  return { ok: true, value };
}

/** Body weight in pounds or kilograms; empty is allowed. */
export function parseWeight(text: string, system: UnitSystem): Parsed {
  if (text.trim() === '') return { ok: true, value: undefined };
  const value = cleanNumber(text);
  const unit = system === 'us' ? 'pounds' : 'kilograms';
  if (value === undefined || value <= 0) {
    return {
      ok: false,
      message: `Enter a number in ${unit}, for example ${system === 'us' ? '170' : '77'}.`,
    };
  }
  const pounds = system === 'us' ? value : value / KG_PER_POUND;
  if (pounds < 60 || pounds > 800) {
    return { ok: false, message: `That does not look right. Check the number in ${unit}.` };
  }
  return { ok: true, value };
}

/**
 * One event result typed by the user, converted into the unit the standard uses
 * (pounds, inches, seconds, reps). Empty is allowed.
 */
export function parseEventValue(
  unit: StandardEvent['unit'],
  text: string,
  system: UnitSystem,
): Parsed {
  if (text.trim() === '') return { ok: true, value: undefined };

  if (unit === 'seconds') {
    const trimmed = text.trim();
    if (trimmed.includes(':')) {
      try {
        return { ok: true, value: parseTime(trimmed) };
      } catch {
        return { ok: false, message: 'Use minutes and seconds, for example 12:30.' };
      }
    }
    const seconds = cleanNumber(trimmed);
    if (seconds === undefined || seconds > 3600) {
      return { ok: false, message: 'Use minutes and seconds like 12:30, or seconds like 47.5.' };
    }
    return { ok: true, value: seconds };
  }

  const value = cleanNumber(text);
  if (value === undefined) return { ok: false, message: 'Enter a number.' };

  if (unit === 'reps') {
    if (!Number.isInteger(value) || value > 999) {
      return { ok: false, message: 'Enter the number of repetitions as a whole number.' };
    }
    return { ok: true, value };
  }
  if (unit === 'pounds') {
    return { ok: true, value: system === 'us' ? value : value / KG_PER_POUND };
  }
  return { ok: true, value: system === 'us' ? value : value / CM_PER_INCH };
}

/** Label for the unit a user should type for this event. */
export function unitHint(unit: StandardEvent['unit'], system: UnitSystem): string {
  switch (unit) {
    case 'reps':
      return 'repetitions';
    case 'seconds':
      return 'time as minutes:seconds, for example 12:30';
    case 'pounds':
      return system === 'us' ? 'pounds' : 'kilograms';
    case 'inches':
      return system === 'us' ? 'inches' : 'centimeters';
  }
}
