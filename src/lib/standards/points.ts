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
  /** How many times the points count in the total. */
  multiplier: number;
  /** Points as counted in the total (points times multiplier). */
  countedPoints?: number | undefined;
  /** Points needed in this event. */
  minPoints: number;
  /** True when the result earns at least the points needed in this event. */
  meetsEventMinimum?: boolean | undefined;
}

export interface PointsStandardResult {
  standardId: string;
  events: PointsEventResult[];
  /** Sum of counted points over the events that were entered. */
  totalPoints: number;
  scoredCount: number;
  totalCount: number;
  minTotal: number;
  minPerEvent: number;
  /** Number of entered events that earned fewer points than the per-event minimum. */
  eventsBelowMinimum: number;
  /** The total can only be compared once every event has a result. */
  totalStatus: 'meets' | 'below' | 'incomplete';
  caveat?: string | undefined;
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
): PointsStandardResult {
  if (!Number.isInteger(profile.age) || profile.age < 0) {
    throw new RangeError('age must be a non-negative whole number');
  }
  const { minTotal, minPerEvent } = standard.rule;

  const events = standard.events.map((event): PointsEventResult => {
    const base = {
      eventId: event.id,
      eventName: event.name,
      unit: event.unit,
      multiplier: event.multiplier,
      minPoints: minPerEvent,
    };
    const value = entries[event.id];
    if (!hasScale(event, profile.sex, profile.age)) {
      return { ...base, status: 'no-standard', value };
    }
    if (value === undefined) return { ...base, status: 'not-entered' };
    assertValue(event.id, value);
    const points = pointsFor(event, profile.sex, profile.age, value);
    if (points === undefined) return { ...base, status: 'no-standard', value };
    return {
      ...base,
      status: 'scored',
      value,
      points,
      countedPoints: points * event.multiplier,
      meetsEventMinimum: points >= minPerEvent,
    };
  });

  const scored = events.filter((e) => e.status === 'scored');
  const totalPoints = scored.reduce((sum, e) => sum + (e.countedPoints ?? 0), 0);
  const complete = scored.length === standard.events.length;
  let totalStatus: PointsStandardResult['totalStatus'] = 'incomplete';
  if (complete) totalStatus = totalPoints >= minTotal ? 'meets' : 'below';

  return {
    standardId: standard.id,
    events,
    totalPoints,
    scoredCount: scored.length,
    totalCount: standard.events.length,
    minTotal,
    minPerEvent,
    eventsBelowMinimum: scored.filter((e) => e.meetsEventMinimum === false).length,
    totalStatus,
    caveat: standard.caveat,
  };
}
