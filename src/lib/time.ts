/** Matches "m:ss" or "mm:ss", optionally with hundredths ("12:18.50"). */
export const TIME_PATTERN = /^\d{1,2}:[0-5]\d(?:\.\d{1,2})?$/;

/** Parse "m:ss" (or "mm:ss.hh") into total seconds. */
export function parseTime(text: string): number {
  if (!TIME_PATTERN.test(text)) throw new RangeError(`invalid time "${text}"`);
  const [minutes = '0', rest = '0'] = text.split(':');
  return Number(minutes) * 60 + Number(rest);
}

/** Format total seconds as "m:ss" (whole seconds, rounded to the nearest second). */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new RangeError('seconds must be a non-negative number');
  }
  const whole = Math.round(totalSeconds);
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
