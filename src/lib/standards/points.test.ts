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

describe('point standard data', () => {
  it('loads FBI, DEA and Secret Service with read-level evidence', () => {
    expect([...standards.keys()].sort()).toEqual(['dea-pta', 'fbi-pft', 'usss-apat']);
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
