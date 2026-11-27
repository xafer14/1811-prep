import { describe, expect, it } from 'vitest';
import { evaluatePointsStandard, hasScale, minimumValueForPoints, pointsFor } from './points';
import { pointsStandardSchema, type PointsEvent, type PointsStandard } from './schema';

const files = import.meta.glob('/src/content/point-standards/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const standards = new Map<string, PointsStandard>();
for (const [path, data] of Object.entries(files)) {
  const id =
    path
      .split('/')
      .pop()
      ?.replace(/\.json$/, '') ?? '';
  const parsed = pointsStandardSchema.parse(data);
  expect(parsed.id).toBe(id);
  standards.set(id, parsed);
}

function standard(id: string): PointsStandard {
  const found = standards.get(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

function event(id: string, eventId: string): PointsEvent {
  const found = standard(id).events.find((e) => e.id === eventId);
  if (!found) throw new Error(`missing ${id}/${eventId}`);
  return found;
}

const t = (m: number, s: number) => m * 60 + s;

// Spot checks against the Army Fitness Test Score Tables (approved 15 May 2025).
describe('Air Force PFRA scoring', () => {
  const af = () => standard('af-pfra');
  const ok = { 'push-ups': 30, 'sit-ups': 33, run: t(19, 45) };

  it('scores rows of the Under 25 male column, in half points', () => {
    const pushUps = event('af-pfra', 'push-ups');
    expect(pointsFor(pushUps, 'male', 20, 67)).toBe(15);
    expect(pointsFor(pushUps, 'male', 20, 66)).toBe(14.5);
    expect(pointsFor(pushUps, 'male', 20, 30)).toBe(2.5); // the asterisk row: the minimum
    expect(pointsFor(pushUps, 'male', 20, 29)).toBe(0); // below the minimum scores zero
    expect(pointsFor(pushUps, 'female', 20, 50)).toBe(15);
    const run = event('af-pfra', 'run');
    expect(pointsFor(run, 'male', 20, t(13, 25))).toBe(50);
    expect(pointsFor(run, 'male', 20, t(19, 45))).toBe(35);
    expect(pointsFor(run, 'male', 20, t(19, 46))).toBe(0);
    expect(pointsFor(event('af-pfra', 'hamr'), 'male', 20, 87)).toBe(50);
  });

  it('reads times written without minutes as 0:ss', () => {
    const plank = event('af-pfra', 'plank');
    expect(pointsFor(plank, 'female', 62, 50)).toBe(2.5);
    expect(pointsFor(plank, 'female', 62, 49)).toBe(0);
  });

  it('adds one counted result per part and the waist-to-height points', () => {
    const best = evaluatePointsStandard(
      af(),
      { age: 20, sex: 'male' },
      { 'push-ups': 67, 'sit-ups': 58, run: t(13, 25) },
      20,
    );
    expect(best.totalPoints).toBe(100);
    expect(best.totalStatus).toBe('meets');
    expect(best.groups.map((g) => g.id)).toEqual(['cardio', 'body', 'strength', 'core']);
  });

  it('counts only the best event of a part', () => {
    const result = evaluatePointsStandard(
      af(),
      { age: 20, sex: 'male' },
      { ...ok, 'hand-release-push-ups': 52 },
      20,
    );
    const strength = result.groups.find((g) => g.id === 'strength');
    expect(strength?.points).toBe(15); // 52 hand-release push-ups beat 30 push-ups
    expect(strength?.eventName).toMatch(/Hand-release/);
  });

  it('is below 75 when only the minimums are met, and says what is missing', () => {
    const minimums = evaluatePointsStandard(af(), { age: 20, sex: 'male' }, ok, 12.5);
    expect(minimums.totalPoints).toBe(52.5);
    expect(minimums.totalStatus).toBe('below');
    expect(minimums.eventsBelowMinimum).toBe(0);
    const noBody = evaluatePointsStandard(af(), { age: 20, sex: 'male' }, ok);
    expect(noBody.totalStatus).toBe('incomplete');
    expect(noBody.groups.find((g) => g.id === 'body')?.status).toBe('not-entered');
  });

  it('fails a part below its minimum even when the total is high', () => {
    const result = evaluatePointsStandard(
      af(),
      { age: 20, sex: 'male' },
      { 'push-ups': 29, 'sit-ups': 58, run: t(13, 25) },
      20,
    );
    expect(result.totalPoints).toBe(85);
    expect(result.eventsBelowMinimum).toBe(1);
    expect(result.totalStatus).toBe('below');
  });

  it('has a first step of at least 1 point everywhere, so zero means below the minimum', () => {
    for (const item of standard('af-pfra').events) {
      for (const scale of item.scales) {
        expect(scale.floorPoints).toBe(0);
        expect(scale.steps[0]?.points ?? 0).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// Spot checks against MCO 6100.13A Tables 2-2, 2-4 and 2-5.
describe('Marine Corps PFT scoring', () => {
  const marine = () => standard('marine-pft');
  const ok = { 'pull-ups': 4, plank: t(1, 10), run: t(27, 40) };

  it('scores pull-ups, push-ups, plank and run rows of the 17-20 columns', () => {
    const pullUps = event('marine-pft', 'pull-ups');
    expect(pointsFor(pullUps, 'male', 18, 20)).toBe(100);
    expect(pointsFor(pullUps, 'male', 18, 25)).toBe(100); // more than the maximum
    expect(pointsFor(pullUps, 'male', 18, 4)).toBe(40);
    expect(pointsFor(pullUps, 'male', 18, 3)).toBe(0); // below the minimum fails
    expect(pointsFor(pullUps, 'female', 18, 7)).toBe(100);
    expect(pointsFor(pullUps, 'female', 18, 1)).toBe(60); // the female minimum is worth 60
    expect(pointsFor(event('marine-pft', 'push-ups'), 'male', 18, 82)).toBe(70);
    expect(pointsFor(event('marine-pft', 'push-ups'), 'male', 18, 42)).toBe(40);
    const plank = event('marine-pft', 'plank');
    expect(pointsFor(plank, 'male', 30, t(3, 45))).toBe(100);
    expect(pointsFor(plank, 'female', 55, t(1, 10))).toBe(40);
    expect(pointsFor(plank, 'male', 30, t(1, 9))).toBe(0);
    const run = event('marine-pft', 'run');
    expect(pointsFor(run, 'male', 18, t(18, 0))).toBe(100);
    expect(pointsFor(run, 'male', 18, t(27, 40))).toBe(40);
    expect(pointsFor(run, 'male', 18, t(27, 41))).toBe(0);
    expect(pointsFor(run, 'female', 18, t(21, 0))).toBe(100);
  });

  it('counts the best of pull-ups and push-ups, and needs 150 points (210 combat arms)', () => {
    const minimums = evaluatePointsStandard(marine(), { age: 18, sex: 'male' }, ok);
    expect(minimums.totalPoints).toBe(120);
    expect(minimums.totalStatus).toBe('below');
    const strong = evaluatePointsStandard(
      marine(),
      { age: 18, sex: 'male' },
      { 'pull-ups': 20, 'push-ups': 82, plank: t(3, 45), run: t(18, 0) },
    );
    expect(strong.totalPoints).toBe(300);
    expect(strong.totalStatus).toBe('meets');
    const combat = evaluatePointsStandard(
      marine(),
      { age: 18, sex: 'male', variant: 'combat' },
      { 'pull-ups': 12, plank: t(2, 30), run: t(22, 0) },
    );
    expect(combat.minTotal).toBe(210);
  });

  it('fails when one event is below its minimum, whatever the total', () => {
    const result = evaluatePointsStandard(
      marine(),
      { age: 18, sex: 'male' },
      { 'pull-ups': 20, plank: t(3, 45), run: t(28, 0) },
    );
    expect(result.totalPoints).toBe(200);
    expect(result.eventsBelowMinimum).toBe(1);
    expect(result.totalStatus).toBe('below');
  });

  it('scores a woman on the male scale under the combat arms option', () => {
    const entries = { 'pull-ups': 4, plank: t(1, 10), run: t(30, 50) };
    const normal = evaluatePointsStandard(marine(), { age: 18, sex: 'female' }, entries);
    expect(normal.events.find((e) => e.eventId === 'pull-ups')?.points).toBe(80);
    const combat = evaluatePointsStandard(
      marine(),
      { age: 18, sex: 'female', variant: 'combat' },
      entries,
    );
    expect(combat.events.find((e) => e.eventId === 'pull-ups')?.points).toBe(40);
    expect(combat.events.find((e) => e.eventId === 'run')?.meetsEventMinimum).toBe(false);
  });
});

describe('Army AFT scoring', () => {
  const army = () => standard('army-aft');
  const sixty = { mdl: 150, hrp: 14, sdc: t(2, 31), plk: t(1, 25), '2mr': t(19, 45) };

  it('scores deadlift rows of the 17-21 male column, including skipped point levels', () => {
    const mdl = event('army-aft', 'mdl');
    expect(pointsFor(mdl, 'male', 20, 340)).toBe(100);
    expect(pointsFor(mdl, 'male', 20, 339)).toBe(98); // 99 points has no row in this column
    expect(pointsFor(mdl, 'male', 20, 150)).toBe(60);
    expect(pointsFor(mdl, 'male', 20, 149)).toBe(50);
    expect(pointsFor(mdl, 'male', 20, 89)).toBe(0);
    expect(pointsFor(mdl, 'female', 20, 220)).toBe(100);
    expect(pointsFor(mdl, 'female', 20, 120)).toBe(60);
  });

  it('scores times with a lower-is-better scale', () => {
    const run = event('army-aft', '2mr');
    expect(pointsFor(run, 'male', 25, t(19, 45))).toBe(60);
    expect(pointsFor(run, 'male', 25, t(19, 46))).toBeLessThan(60);
    expect(pointsFor(run, 'male', 25, t(30, 0))).toBeLessThan(10);
  });

  it('needs 300 points in total, or 350 under the combat option', () => {
    const normal = evaluatePointsStandard(army(), { age: 25, sex: 'male' }, sixty);
    expect(normal.totalPoints).toBe(300);
    expect(normal.minTotal).toBe(300);
    expect(normal.totalStatus).toBe('meets');
    const combat = evaluatePointsStandard(
      army(),
      { age: 25, sex: 'male', variant: 'combat' },
      sixty,
    );
    expect(combat.minTotal).toBe(350);
    expect(combat.totalStatus).toBe('below');
  });

  it('scores a woman on the male column under the combat option', () => {
    const hrp = { ...sixty, hrp: 11 }; // 60 points on the female column, below on the male one
    const normal = evaluatePointsStandard(army(), { age: 25, sex: 'female' }, hrp);
    expect(normal.events.find((e) => e.eventId === 'hrp')?.points).toBe(60);
    const combat = evaluatePointsStandard(
      army(),
      { age: 25, sex: 'female', variant: 'combat' },
      hrp,
    );
    expect(combat.events.find((e) => e.eventId === 'hrp')?.meetsEventMinimum).toBe(false);
  });

  it('rejects an unknown variant', () => {
    expect(() =>
      evaluatePointsStandard(army(), { age: 25, sex: 'male', variant: 'x' }, {}),
    ).toThrow(RangeError);
  });
});

describe('point standard data', () => {
  it('loads Army, FBI, DEA and Secret Service with read-level evidence', () => {
    expect([...standards.keys()].sort()).toEqual([
      'af-pfra',
      'army-aft',
      'dea-pta',
      'fbi-pft',
      'marine-pft',
      'usss-apat',
    ]);
    for (const item of standards.values()) {
      expect(item.source.evidence).toBe('read');
      expect(item.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps the requirements of each test as published', () => {
    expect(standard('fbi-pft').rule).toEqual({ minTotal: 10, minPerEvent: 1 });
    expect(standard('dea-pta').rule).toEqual({ minTotal: 12, minPerEvent: 1 });
    expect(standard('usss-apat').rule).toEqual({ minTotal: 20, minPerEvent: 1 });
    expect(event('dea-pta', 'run').multiplier).toBe(2);
    expect(event('dea-pta', 'sit-ups').multiplier).toBe(1);
  });
});

// Spot checks against the official scales (docs/verification/live-page-checklist.md).
describe('pointsFor', () => {
  it.each([
    // FBI pull-ups: women 1 point per rep, men 1 point per two reps, 0 below.
    ['fbi-pft', 'pull-ups', 'female', 0, 0],
    ['fbi-pft', 'pull-ups', 'female', 1, 1],
    ['fbi-pft', 'pull-ups', 'female', 12, 10],
    ['fbi-pft', 'pull-ups', 'male', 1, 0],
    ['fbi-pft', 'pull-ups', 'male', 2, 1],
    ['fbi-pft', 'pull-ups', 'male', 3, 1],
    ['fbi-pft', 'pull-ups', 'male', 20, 10],
    // FBI 300 m sprint (seconds, lower is better), -2 below the lowest band.
    ['fbi-pft', 'sprint', 'male', 55.1, -2],
    ['fbi-pft', 'sprint', 'male', 55.0, 0],
    ['fbi-pft', 'sprint', 'male', 49.4, 3],
    ['fbi-pft', 'sprint', 'male', 40.9, 10],
    ['fbi-pft', 'sprint', 'female', 67.4, 0],
    // FBI push-ups.
    ['fbi-pft', 'push-ups', 'male', 19, -2],
    ['fbi-pft', 'push-ups', 'male', 20, 0],
    ['fbi-pft', 'push-ups', 'male', 40, 3],
    ['fbi-pft', 'push-ups', 'female', 4, -2],
    ['fbi-pft', 'push-ups', 'female', 45, 10],
    // FBI 1.5-mile run.
    ['fbi-pft', 'run', 'male', t(13, 30), -2],
    ['fbi-pft', 'run', 'male', t(13, 29), 0],
    ['fbi-pft', 'run', 'male', t(12, 24), 1],
    ['fbi-pft', 'run', 'female', t(14, 59), 0],
    ['fbi-pft', 'run', 'female', t(10, 34), 10],
    // DEA sit-ups.
    ['dea-pta', 'sit-ups', 'male', 31, -2],
    ['dea-pta', 'sit-ups', 'male', 38, 1],
    ['dea-pta', 'sit-ups', 'male', 58, 10],
    ['dea-pta', 'sit-ups', 'female', 41, 3],
    ['dea-pta', 'sit-ups', 'female', 29, -2],
    // Secret Service (same scale for everyone, 0 to 8).
    ['usss-apat', 'push-ups', 'female', 14, 0],
    ['usss-apat', 'push-ups', 'male', 15, 1],
    ['usss-apat', 'push-ups', 'male', 44, 8],
    ['usss-apat', 'sit-ups', 'male', 41, 5],
    ['usss-apat', 'agility', 'male', 23.89, 0],
    ['usss-apat', 'agility', 'female', 23.88, 1],
    ['usss-apat', 'agility', 'male', 18.64, 8],
    ['usss-apat', 'run', 'male', t(19, 41), 0],
    ['usss-apat', 'run', 'male', t(14, 30), 5],
    ['usss-apat', 'run', 'female', t(12, 1), 8],
  ] as const)('%s %s %s %s -> %s points', (id, eventId, sex, value, expected) => {
    expect(pointsFor(event(id, eventId), sex, 30, value)).toBe(expected);
  });

  it('gives the same points at every age for tests without age bands', () => {
    const pushUps = event('fbi-pft', 'push-ups');
    expect(pointsFor(pushUps, 'male', 21, 40)).toBe(3);
    expect(pointsFor(pushUps, 'male', 55, 40)).toBe(3);
    expect(hasScale(pushUps, 'male', 70)).toBe(true);
  });
});

describe('minimumValueForPoints', () => {
  it('finds the least demanding result that earns the per-event minimum', () => {
    expect(minimumValueForPoints(event('fbi-pft', 'pull-ups'), 'male', 30, 1)).toBe(2);
    expect(minimumValueForPoints(event('fbi-pft', 'pull-ups'), 'female', 30, 1)).toBe(1);
    expect(minimumValueForPoints(event('fbi-pft', 'push-ups'), 'male', 30, 1)).toBe(30);
    expect(minimumValueForPoints(event('fbi-pft', 'run'), 'male', 30, 1)).toBe(t(12, 24));
    expect(minimumValueForPoints(event('fbi-pft', 'sprint'), 'female', 30, 1)).toBe(64.9);
    expect(minimumValueForPoints(event('dea-pta', 'sit-ups'), 'female', 30, 1)).toBe(35);
    expect(minimumValueForPoints(event('usss-apat', 'run'), 'male', 30, 1)).toBe(t(19, 40));
    expect(minimumValueForPoints(event('usss-apat', 'agility'), 'male', 30, 1)).toBe(23.88);
  });

  it('returns nothing when any result already earns the minimum', () => {
    expect(minimumValueForPoints(event('fbi-pft', 'push-ups'), 'male', 30, -5)).toBeUndefined();
  });
});

describe('evaluatePointsStandard', () => {
  const profile = { age: 30, sex: 'male' as const };

  it('scores every FBI event and compares the total with the requirement', () => {
    const result = evaluatePointsStandard(standard('fbi-pft'), profile, {
      'pull-ups': 8, // 4
      sprint: 47.9, // 4
      'push-ups': 40, // 3
      run: t(12, 24), // 1
    });
    expect(result.events.map((e) => e.points)).toEqual([4, 4, 3, 1]);
    expect(result.totalPoints).toBe(12);
    expect(result.totalStatus).toBe('meets');
    expect(result.eventsBelowMinimum).toBe(0);
  });

  it('flags an event under the per-event minimum even when the total is enough', () => {
    const result = evaluatePointsStandard(standard('fbi-pft'), profile, {
      'pull-ups': 20, // 10
      sprint: 40.9, // 10
      'push-ups': 19, // -2
      run: t(8, 59), // 10
    });
    expect(result.totalPoints).toBe(28);
    expect(result.totalStatus).toBe('meets');
    expect(result.eventsBelowMinimum).toBe(1);
    expect(result.events[2]).toMatchObject({ points: -2, meetsEventMinimum: false });
  });

  it('is below when the total is short, and incomplete when an event is missing', () => {
    const short = evaluatePointsStandard(standard('fbi-pft'), profile, {
      'pull-ups': 2, // 1
      sprint: 52.4, // 1
      'push-ups': 30, // 1
      run: t(12, 24), // 1
    });
    expect(short.totalPoints).toBe(4);
    expect(short.totalStatus).toBe('below');

    const partial = evaluatePointsStandard(standard('fbi-pft'), profile, { 'push-ups': 40 });
    expect(partial.totalStatus).toBe('incomplete');
    expect(partial.scoredCount).toBe(1);
    expect(partial.events.filter((e) => e.status === 'not-entered')).toHaveLength(3);
  });

  it('counts the DEA run points twice in the total', () => {
    const result = evaluatePointsStandard(standard('dea-pta'), profile, {
      'sit-ups': 38, // 1
      'push-ups': 33, // 2
      run: t(12, 14), // 2 points, counted as 4
    });
    expect(result.events.map((e) => e.points)).toEqual([1, 2, 2]);
    expect(result.events.map((e) => e.countedPoints)).toEqual([1, 2, 4]);
    expect(result.totalPoints).toBe(7);
    expect(result.totalStatus).toBe('below'); // 12 needed
  });

  it('meets the DEA total with strong results', () => {
    const result = evaluatePointsStandard(
      standard('dea-pta'),
      { age: 25, sex: 'female' },
      {
        'sit-ups': 47, // 5
        'push-ups': 30, // 5
        run: t(12, 29), // 4, counted as 8
      },
    );
    expect(result.totalPoints).toBe(18);
    expect(result.totalStatus).toBe('meets');
  });

  it('applies the Secret Service rule: 20 points and no zero', () => {
    const result = evaluatePointsStandard(
      standard('usss-apat'),
      { age: 28, sex: 'female' },
      {
        'push-ups': 44, // 8
        'sit-ups': 50, // 8
        agility: 19.43, // 7
        run: t(23, 0), // 0
      },
    );
    expect(result.totalPoints).toBe(23);
    expect(result.totalStatus).toBe('meets');
    expect(result.eventsBelowMinimum).toBe(1);
    expect(result.events[3]).toMatchObject({ points: 0, meetsEventMinimum: false });
  });

  it('never returns an overall verdict', () => {
    const result = evaluatePointsStandard(standard('usss-apat'), profile, {});
    expect(result).not.toHaveProperty('passed');
    expect(result.totalStatus).toBe('incomplete');
  });

  it('rejects bad input', () => {
    expect(() => evaluatePointsStandard(standard('fbi-pft'), { age: -1, sex: 'male' }, {})).toThrow(
      RangeError,
    );
    expect(() => evaluatePointsStandard(standard('fbi-pft'), profile, { 'push-ups': -3 })).toThrow(
      RangeError,
    );
  });
});

describe('points schema guards', () => {
  const valid = {
    id: 'test-points',
    organization: 'fbi',
    name: 'Test',
    source: { document: 'doc', verifiedAt: '2026-11-26', evidence: 'read' },
    scoring: 'points',
    rule: { minTotal: 5, minPerEvent: 1 },
    events: [
      {
        id: 'push-ups',
        name: 'Push-ups',
        family: 'push-ups',
        unit: 'reps',
        better: 'higher',
        scales: [
          {
            sex: 'any',
            ageMin: 17,
            ageMax: null,
            floorPoints: 0,
            steps: [
              { points: 1, value: 10 },
              { points: 2, value: 20 },
            ],
          },
        ],
      },
    ],
  };

  it('accepts a valid points standard', () => {
    expect(pointsStandardSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects steps whose values move the wrong way', () => {
    const bad = structuredClone(valid);
    const steps = bad.events[0]?.scales[0]?.steps;
    if (steps) steps[1] = { points: 2, value: 5 };
    expect(pointsStandardSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a floor that is not below the first step', () => {
    const bad = structuredClone(valid);
    const scale = bad.events[0]?.scales[0];
    if (scale) scale.floorPoints = 1;
    expect(pointsStandardSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects overlapping scales', () => {
    const bad = structuredClone(valid);
    const first = bad.events[0]?.scales[0];
    if (first) bad.events[0]?.scales.push(structuredClone(first));
    expect(pointsStandardSchema.safeParse(bad).success).toBe(false);
  });
});
