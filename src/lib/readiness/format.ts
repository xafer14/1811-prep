import { CM_PER_INCH, KG_PER_POUND } from '../body';
import type { EventResult } from '../standards/evaluate';
import type { StandardEvent } from '../standards/schema';
import type { UnitSystem } from './inputs';

function trimDecimals(value: number, maxDecimals: number): string {
  return String(Number(value.toFixed(maxDecimals)));
}

/** "m:ss", or "m:ss.hh" when the value has hundredths (HSI sprint: 47.73 s -> 0:47.73). */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const whole = Math.abs(seconds - Math.round(seconds)) < 1e-9;
  const text = whole
    ? String(Math.round(seconds)).padStart(2, '0')
    : seconds.toFixed(2).padStart(5, '0');
  return `${minutes}:${text}`;
}

/** A value in the standard's unit, shown in the user's unit system. */
export function formatValue(
  unit: StandardEvent['unit'],
  value: number,
  system: UnitSystem,
): string {
  switch (unit) {
    case 'reps':
      return `${trimDecimals(value, 0)} reps`;
    case 'seconds':
      return formatClock(value);
    case 'pounds':
      return system === 'us'
        ? `${trimDecimals(value, 0)} lb`
        : `${trimDecimals(value * KG_PER_POUND, 1)} kg`;
    case 'inches':
      return system === 'us'
        ? `${trimDecimals(value, 1)} in`
        : `${trimDecimals(value * CM_PER_INCH, 1)} cm`;
  }
}

/** Plain-words margin: how far ahead of or short of the minimum. Positive margin = meets. */
export function describeMargin(result: EventResult, system: UnitSystem): string {
  if (result.margin === undefined || result.value === undefined) return '';
  const amount = Math.abs(result.margin);
  if (amount < 1e-9) return 'Exactly at the minimum.';
  const better = result.margin > 0;
  switch (result.unit) {
    case 'reps':
      return `${trimDecimals(amount, 0)} ${amount === 1 ? 'rep' : 'reps'} ${better ? 'more than' : 'short of'} the minimum.`;
    case 'seconds':
      return `${trimDecimals(amount, 2)} seconds ${better ? 'ahead of' : 'short of'} the minimum.`;
    case 'pounds':
      return `${formatValue('pounds', amount, system)} ${better ? 'above' : 'below'} the minimum.`;
    case 'inches':
      return `${formatValue('inches', amount, system)} ${better ? 'beyond' : 'short of'} the minimum.`;
  }
}

/** Words shown for each status (never color alone). */
export function statusLabel(status: EventResult['status']): string {
  switch (status) {
    case 'meets':
      return 'Meets the minimum';
    case 'below':
      return 'Below the minimum';
    case 'not-entered':
      return 'No result entered';
    case 'no-standard':
      return 'No published minimum for your age';
  }
}

/** A minimum in plain words: "at least 33 reps", "12:18 or faster". */
export function describeMinimum(
  unit: StandardEvent['unit'],
  better: StandardEvent['better'],
  value: number,
  system: UnitSystem,
): string {
  const text = formatValue(unit, value, system);
  if (better === 'higher') return `at least ${text}`;
  return unit === 'seconds' ? `${text} or faster` : `at most ${text}`;
}
