import { waistToHeightRatio } from '../body';
import type { BodyCompositionStandard, Standard, StandardEvent } from './schema';

export type Sex = 'male' | 'female';

export interface Profile {
  age: number;
  sex: Sex;
  /** Optional sex-neutral variant id (for example the Army combat standard). */
  variant?: string | undefined;
}

export type EventStatus = 'meets' | 'below' | 'not-entered' | 'no-standard';

export interface EventResult {
  eventId: string;
  eventName: string;
  unit: StandardEvent['unit'];
  status: EventStatus;
  /** What the user entered, if anything. */
  value?: number | undefined;
  /** The official minimum for this age and sex, if one exists. */
  minimum?: number | undefined;
  /** Positive = better than the minimum, negative = short of it (in the event's own unit). */
  margin?: number | undefined;
}

export interface StandardResult {
  standardId: string;
  events: EventResult[];
  metCount: number;
  enteredCount: number;
  totalCount: number;
  completeness: Standard['completeness'];
  caveat?: string | undefined;
}

function assertProfile(profile: Profile): void {
  if (!Number.isInteger(profile.age) || profile.age < 0) {
    throw new RangeError('age must be a non-negative whole number');
  }
}

function assertValue(eventId: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`value for ${eventId} must be a non-negative number`);
  }
}

/** The sex column used for scoring, after applying an optional sex-neutral variant. */
export function scoringSex(standard: Standard, profile: Profile): Sex {
  if (profile.variant === undefined) return profile.sex;
  const variant = standard.variants.find((item) => item.id === profile.variant);
  if (!variant) throw new RangeError(`unknown variant "${profile.variant}" for ${standard.id}`);
  return variant.useSex;
}

/** The official minimum for this event, sex and age, or undefined if none is listed. */
export function findMinimum(event: StandardEvent, sex: Sex, age: number): number | undefined {
  for (const minimum of event.minimums) {
    if (minimum.sex !== 'any' && minimum.sex !== sex) continue;
    if (age < minimum.ageMin) continue;
    if (minimum.ageMax !== null && age > minimum.ageMax) continue;
    return minimum.value;
  }
  return undefined;
}

/** Compare one entered result to one event minimum. */
export function evaluateEvent(
  event: StandardEvent,
  sex: Sex,
  age: number,
  value: number | undefined,
): EventResult {
  const base = { eventId: event.id, eventName: event.name, unit: event.unit };
  const minimum = findMinimum(event, sex, age);
  if (minimum === undefined) {
    return { ...base, status: 'no-standard', value };
  }
  if (value === undefined) {
    return { ...base, status: 'not-entered', minimum };
  }
  assertValue(event.id, value);
  const margin = event.better === 'higher' ? value - minimum : minimum - value;
  return { ...base, status: margin >= 0 ? 'meets' : 'below', value, minimum, margin };
}

/**
 * Compare entered results to every event minimum of one standard.
 * There is deliberately no overall verdict: see docs/decisions/0003-readiness-hybrid-model.md.
 */
export function evaluateStandard(
  standard: Standard,
  profile: Profile,
  entries: Readonly<Record<string, number | undefined>>,
): StandardResult {
  assertProfile(profile);
  const sex = scoringSex(standard, profile);
  const events = standard.events.map((event) =>
    evaluateEvent(event, sex, profile.age, entries[event.id]),
  );
  return {
    standardId: standard.id,
    events,
    metCount: events.filter((e) => e.status === 'meets').length,
    enteredCount: events.filter((e) => e.status === 'meets' || e.status === 'below').length,
    totalCount: events.length,
    completeness: standard.completeness,
    caveat: standard.caveat,
  };
}

export interface BodyCompositionResult {
  standardId: string;
  /** Waist divided by height, unrounded. */
  ratio: number;
  /** The ratio actually compared (rounded down when the standard says so). */
  comparedRatio: number;
  limit: number;
  status: 'within' | 'over';
  ifOver: string;
}

function roundDown(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // The small epsilon keeps exact decimals (0.55) from becoming 0.5499999 after floating point.
  return Math.floor(value * factor + 1e-9) / factor;
}

/** Check a waist and height (same unit) against a waist-to-height rule. */
export function evaluateBodyComposition(
  standard: BodyCompositionStandard,
  waist: number,
  height: number,
): BodyCompositionResult {
  const ratio = waistToHeightRatio(waist, height);
  const comparedRatio =
    standard.roundDownDecimals === undefined ? ratio : roundDown(ratio, standard.roundDownDecimals);
  return {
    standardId: standard.id,
    ratio,
    comparedRatio,
    limit: standard.limit,
    status: comparedRatio < standard.limit ? 'within' : 'over',
    ifOver: standard.ifOver,
  };
}
