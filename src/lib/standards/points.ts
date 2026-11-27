import type { Profile, Sex } from './evaluate';
import type { PointsEvent, PointsStandard } from './schema';

type Scale = PointsEvent['scales'][number];

export type PointsEventStatus = 'scored' | 'not-entered' | 'no-standard';

export interface PointsEventResult {
  eventId: string;
  eventName: string;
  unit: PointsEvent['unit'];
  status: PointsEventStatus;
  /** What the user entered. */
  value?: number | undefined;
  /** Points the result earns on the official scale. */
  points?: number | undefined;
  /** Named performance level of those points, when the standard has levels. */
  level?: string | undefined;
  /** How many times the points count in the total. */
  multiplier: number;
  /** Points as counted in the total (points times multiplier). */
  countedPoints?: number | undefined;
  /** Points needed in this event. */
  minPoints: number;
  /** True when the result earns at least the points needed in this event. */
  meetsEventMinimum?: boolean | undefined;
}

export interface PointsGroupResult {
  id: string;
  label: string;
  maxPoints: number;
  status: 'scored' | 'not-entered';
  /** Points this part adds to the total (the best event of the group). */
  points?: number | undefined;
  /** The event that counts, when the part comes from events. */
  eventName?: string | undefined;
  /** Whether the counted event reached its minimum (events only). */
  meetsMinimum?: boolean | undefined;
  fromBodyComposition: boolean;
}

export interface PointsStandardResult {
  standardId: string;
  events: PointsEventResult[];
  /** Parts of the total, when the standard has them (Air Force); otherwise empty. */
  groups: PointsGroupResult[];
  /** Sum of counted points over the events that were entered. */
  totalPoints: number;
  scoredCount: number;
  totalCount: number;
  minTotal: number;
  minPerEvent: number;
  /** Number of entered events that earned fewer points than the per-event minimum. */
  eventsBelowMinimum: number;
  /** The total can only be compared once every event (or every part) has a result. */
  totalStatus: 'meets' | 'below' | 'incomplete';
  caveat?: string | undefined;
}

/** The sex column used for scoring, after applying an optional sex-neutral variant. */
export function pointsScoringSex(standard: PointsStandard, profile: Profile): Sex {
  if (profile.variant === undefined) return profile.sex;
  const variant = standard.variants.find((item) => item.id === profile.variant);
  if (!variant) throw new RangeError(`unknown variant "${profile.variant}" for ${standard.id}`);
  return variant.useSex;
}

function findScale(event: PointsEvent, sex: Sex, age: number): Scale | undefined {
  return event.scales.find(
    (scale) =>
      (scale.sex === 'any' || scale.sex === sex) &&
      age >= scale.ageMin &&
      (scale.ageMax === null || age <= scale.ageMax),
  );
}

/** Points a result earns, or undefined when the standard has no scale for this age and sex. */
export function pointsFor(
  event: PointsEvent,
  sex: Sex,
  age: number,
  value: number,
): number | undefined {
  const scale = findScale(event, sex, age);
  if (!scale) return undefined;
  let points = scale.floorPoints;
  for (const step of scale.steps) {
    const reached = event.better === 'higher' ? value >= step.value : value <= step.value;
    if (reached && step.points > points) points = step.points;
  }
  return points;
}

/**
 * The least demanding result that still earns `minPoints` in this event (for the comparison
 * page). Undefined when there is no scale, or when the minimum is already earned by any result.
 */
export function minimumValueForPoints(
  event: PointsEvent,
  sex: Sex,
  age: number,
  minPoints: number,
): number | undefined {
  const scale = findScale(event, sex, age);
  if (!scale || scale.floorPoints >= minPoints) return undefined;
  return scale.steps.find((step) => step.points >= minPoints)?.value;
}

/** True when the standard has a scale for this age and sex in every event. */
export function hasScale(event: PointsEvent, sex: Sex, age: number): boolean {
  return findScale(event, sex, age) !== undefined;
}

function assertValue(eventId: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`value for ${eventId} must be a non-negative number`);
  }
}

/**
 * Score entered results on a points-based test and compare them with the test's own
 * requirements (points per event and in total). There is deliberately no overall verdict.
 */
export function evaluatePointsStandard(
  standard: PointsStandard,
  profile: Profile,
  entries: Readonly<Record<string, number | undefined>>,
  /** Points from the waist-to-height ratio, for a part that is filled from body composition. */
  bodyPoints?: number,
): PointsStandardResult {
  if (!Number.isInteger(profile.age) || profile.age < 0) {
    throw new RangeError('age must be a non-negative whole number');
  }
  const { minPerEvent } = standard.rule;
  const scoringSex = pointsScoringSex(standard, profile);
  const minTotal =
    standard.variants.find((item) => item.id === profile.variant)?.minTotal ??
    standard.rule.minTotal;

  const events = standard.events.map((event): PointsEventResult => {
    const base = {
      eventId: event.id,
      eventName: event.name,
      unit: event.unit,
      multiplier: event.multiplier,
      minPoints: minPerEvent,
    };
    const value = entries[event.id];
    if (!hasScale(event, scoringSex, profile.age)) {
      return { ...base, status: 'no-standard', value };
    }
    if (value === undefined) return { ...base, status: 'not-entered' };
    assertValue(event.id, value);
    const points = pointsFor(event, scoringSex, profile.age, value);
    if (points === undefined) return { ...base, status: 'no-standard', value };
    const level = standard.levels.filter((item) => item.points <= points).at(-1)?.label;
    return {
      ...base,
      status: 'scored',
      value,
      points,
      level,
      countedPoints: points * event.multiplier,
      meetsEventMinimum: points >= minPerEvent,
    };
  });

  const scored = events.filter((e) => e.status === 'scored');
  const groups = standard.groups.map((group): PointsGroupResult => {
    const base = {
      id: group.id,
      label: group.label,
      maxPoints: group.maxPoints,
      fromBodyComposition: group.fromBodyComposition,
    };
    if (group.fromBodyComposition) {
      return bodyPoints === undefined
        ? { ...base, status: 'not-entered' }
        : { ...base, status: 'scored', points: bodyPoints };
    }
    const members = standard.events
      .map((event, index) => ({ event, result: events[index] }))
      .filter((item) => item.event.group === group.id && item.result?.status === 'scored');
    // Alternatives: the best result of the group counts.
    let best: PointsEventResult | undefined;
    for (const item of members) {
      if (item.result && (best === undefined || (item.result.points ?? 0) > (best.points ?? 0))) {
        best = item.result;
      }
    }
    if (!best) return { ...base, status: 'not-entered' };
    return {
      ...base,
      status: 'scored',
      points: best.points,
      eventName: best.eventName,
      meetsMinimum: best.meetsEventMinimum,
    };
  });

  let totalPoints: number;
  let scoredCount: number;
  let totalCount: number;
  let complete: boolean;
  if (groups.length > 0) {
    totalPoints = groups.reduce((sum, g) => sum + (g.points ?? 0), 0);
    scoredCount = groups.filter((g) => g.status === 'scored').length;
    totalCount = groups.length;
    complete = scoredCount === totalCount;
  } else {
    totalPoints = scored.reduce((sum, e) => sum + (e.countedPoints ?? 0), 0);
    scoredCount = scored.length;
    totalCount = standard.events.length;
    complete = scored.length === standard.events.length;
  }
  const belowMinimum =
    groups.length > 0
      ? groups.filter((g) => g.meetsMinimum === false).length
      : scored.filter((e) => e.meetsEventMinimum === false).length;
  let totalStatus: PointsStandardResult['totalStatus'] = 'incomplete';
  // With parts (Air Force, Marine Corps) or when the rule says so (Army, Navy) every event must
  // also reach its own minimum; elsewhere the total alone decides and the per-event minimums
  // are reported separately.
  const mustReachEach = groups.length > 0 || standard.rule.eachEventRequired;
  const eventsOk = !mustReachEach || belowMinimum === 0;
  if (complete) totalStatus = totalPoints >= minTotal && eventsOk ? 'meets' : 'below';

  return {
    standardId: standard.id,
    events,
    groups,
    totalPoints,
    scoredCount,
    totalCount,
    minTotal,
    minPerEvent,
    eventsBelowMinimum: belowMinimum,
    totalStatus,
    caveat: standard.caveat,
  };
}
