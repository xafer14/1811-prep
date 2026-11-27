import { describe, expect, it } from 'vitest';
import {
  evaluateBodyComposition,
  evaluateEvent,
  evaluateStandard,
  findMinimum,
  scoringSex,
} from './evaluate';
import {
  bodyCompositionSchema,
  organizationSchema,
  standardSchema,
  type BodyCompositionStandard,
  type Standard,
} from './schema';

const standardFiles = import.meta.glob('/src/content/standards/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const organizationFiles = import.meta.glob('/src/content/organizations/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const bodyFiles = import.meta.glob('/src/content/body-composition/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const fileId = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/\.json$/, '') ?? '';

const standards = new Map<string, Standard>();
for (const [path, data] of Object.entries(standardFiles)) {
  standards.set(fileId(path), standardSchema.parse(data));
}
const bodyStandards = new Map<string, BodyCompositionStandard>();
for (const [path, data] of Object.entries(bodyFiles)) {
  bodyStandards.set(fileId(path), bodyCompositionSchema.parse(data));
}
const organizations = new Map(
  Object.entries(organizationFiles).map(([path, data]) => [
    fileId(path),
    organizationSchema.parse(data),
  ]),
);

function standard(id: string): Standard {
  const found = standards.get(id);
  if (!found) throw new Error(`missing test data ${id}`);
  return found;
}

function bodyStandard(id: string): BodyCompositionStandard {
  const found = bodyStandards.get(id);
  if (!found) throw new Error(`missing test data ${id}`);
  return found;
}

function minimumOf(id: string, eventId: string, sex: 'male' | 'female', age: number) {
  const event = standard(id).events.find((e) => e.id === eventId);
  if (!event) throw new Error(`missing event ${eventId}`);
  return findMinimum(event, sex, age);
}

describe('content files', () => {
  it('loads every file and the id matches the file name', () => {
    expect(standards.size).toBeGreaterThanOrEqual(5);
    for (const [name, item] of standards) expect(item.id).toBe(name);
    for (const [name, item] of bodyStandards) expect(item.id).toBe(name);
    for (const [name, item] of organizations) expect(item.id).toBe(name);
  });

  it('references only organizations that exist', () => {
    for (const item of [...standards.values(), ...bodyStandards.values()]) {
      expect(organizations.has(item.organization), `${item.id} -> ${item.organization}`).toBe(true);
    }
  });

  it('gives every event a unique id (alternatives may share a family)', () => {
    for (const item of standards.values()) {
      const ids = item.events.map((event) => event.id);
      expect(new Set(ids).size, `${item.id} repeats an event id`).toBe(ids.length);
    }
  });

  it('only ships read-level evidence with a verification date', () => {
    for (const item of [...standards.values(), ...bodyStandards.values()]) {
      expect(item.source.evidence, item.id).toBe('read');
      expect(item.source.verifiedAt, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// Spot checks against the official documents (docs/verification/live-page-checklist.md).
describe('transcribed values', () => {
  it.each([
    ['navy-prt', 'push-ups', 'male', 32, 31],
    ['navy-prt', 'plank', 'male', 32, 67],
    ['navy-prt', 'run', 'male', 32, 870],
    ['navy-prt', 'push-ups', 'female', 70, 1],
    ['atf-ptt', 'run', 'male', 25, 738],
    ['atf-ptt', 'sit-ups', 'female', 45, 22],
    ['usms-peb', 'push-ups', 'female', 55, 7],
    ['usms-peb', 'sit-and-reach', 'male', 35, 16.5],
    ['hsi-pftp', 'sprint', 'female', 30, 47.73],
    ['hsi-pftp', 'run', 'male', 45, 14 * 60 + 25],
    // Marine Corps order (the official minimum rows), Air Force chart, Space Force manual.
    ['marine-pft', 'pull-ups', 'male', 48, 4],
    ['marine-pft', 'pull-ups', 'female', 18, 1],
    ['marine-pft', 'push-ups', 'male', 19, 42],
    ['marine-pft', 'plank', 'female', 40, 70],
    ['marine-pft', 'run', 'male', 55, 33 * 60],
    ['space-force-walk', 'walk', 'male', 25, 16 * 60 + 16],
    ['space-force-walk', 'walk', 'female', 65, 18 * 60 + 53],
  ] as const)('%s %s %s age %s -> %s', (id, eventId, sex, age, expected) => {
    expect(minimumOf(id, eventId, sex, age)).toBe(expected);
  });
});

describe('evaluateEvent', () => {
  const atfRun = standard('atf-ptt').events.find((e) => e.id === 'run');
  const atfPushUps = standard('atf-ptt').events.find((e) => e.id === 'push-ups');
  if (!atfRun || !atfPushUps) throw new Error('missing ATF events');

  it('meets a higher-is-better minimum exactly at the minimum', () => {
    const result = evaluateEvent(atfPushUps, 'male', 25, 33);
    expect(result).toMatchObject({ status: 'meets', minimum: 33, margin: 0 });
  });

  it('is below by one rep', () => {
    expect(evaluateEvent(atfPushUps, 'male', 25, 32)).toMatchObject({
      status: 'below',
      margin: -1,
    });
  });

  it('meets a lower-is-better minimum when faster', () => {
    expect(evaluateEvent(atfRun, 'male', 25, 700)).toMatchObject({ status: 'meets', margin: 38 });
  });

  it('is below a lower-is-better minimum when slower', () => {
    expect(evaluateEvent(atfRun, 'male', 25, 750)).toMatchObject({ status: 'below', margin: -12 });
  });

  it('reports not-entered with the minimum', () => {
    expect(evaluateEvent(atfRun, 'female', 25, undefined)).toMatchObject({
      status: 'not-entered',
      minimum: 895,
    });
  });

  it('reports no-standard outside the published age bands', () => {
    expect(evaluateEvent(atfRun, 'male', 19, 700).status).toBe('no-standard');
    const usms = standard('usms-peb').events[0];
    if (!usms) throw new Error('missing USMS event');
    expect(evaluateEvent(usms, 'male', 60, 900).status).toBe('no-standard');
  });

  it('rejects negative and non-finite results', () => {
    expect(() => evaluateEvent(atfRun, 'male', 25, -1)).toThrow(RangeError);
    expect(() => evaluateEvent(atfRun, 'male', 25, Number.NaN)).toThrow(RangeError);
  });
});

describe('evaluateStandard', () => {
  it('counts met and entered events without giving an overall verdict', () => {
    const result = evaluateStandard(
      standard('atf-ptt'),
      { age: 25, sex: 'male' },
      { 'sit-ups': 45, 'push-ups': 30 },
    );
    expect(result.totalCount).toBe(3);
    expect(result.enteredCount).toBe(2);
    expect(result.metCount).toBe(1);
    expect(result.completeness).toBe('complete');
    expect(result).not.toHaveProperty('passed');
  });

  it('uses one set of minimums for everyone when the standard has no banding', () => {
    const female = evaluateStandard(
      standard('hsi-pftp'),
      { age: 33, sex: 'female' },
      { 'sit-ups': 32, sprint: 47.73, 'push-ups': 22, run: 865 },
    );
    expect(female.metCount).toBe(4);
  });

  it('carries the caveat for minimums-only standards', () => {
    const result = evaluateStandard(standard('marine-pft'), { age: 25, sex: 'female' }, {});
    expect(result.completeness).toBe('minimums-only');
    expect(result.caveat).toMatch(/total/);
  });

  it('applies the sex-neutral combat variant (male column for everyone)', () => {
    const marine = standard('marine-pft');
    expect(scoringSex(marine, { age: 25, sex: 'female', variant: 'combat' })).toBe('male');
    const standardResult = evaluateStandard(marine, { age: 25, sex: 'female' }, { 'pull-ups': 4 });
    const combatResult = evaluateStandard(
      marine,
      { age: 25, sex: 'female', variant: 'combat' },
      { 'pull-ups': 4 },
    );
    expect(standardResult.events.find((e) => e.eventId === 'pull-ups')?.minimum).toBe(3);
    expect(combatResult.events.find((e) => e.eventId === 'pull-ups')?.minimum).toBe(5);
  });

  it('rejects an unknown variant and an invalid age', () => {
    expect(() =>
      evaluateStandard(standard('marine-pft'), { age: 25, sex: 'male', variant: 'x' }, {}),
    ).toThrow(RangeError);
    expect(() => evaluateStandard(standard('atf-ptt'), { age: -1, sex: 'male' }, {})).toThrow(
      RangeError,
    );
    expect(() => evaluateStandard(standard('atf-ptt'), { age: 25.5, sex: 'male' }, {})).toThrow(
      RangeError,
    );
  });
});

describe('evaluateBodyComposition', () => {
  const army = bodyStandard('army-whtr');
  const navy = bodyStandard('navy-bca');

  it('treats exactly 0.55 as over for both services', () => {
    expect(evaluateBodyComposition(army, 38.5, 70).status).toBe('over');
    expect(evaluateBodyComposition(navy, 38.5, 70).status).toBe('over');
  });

  it('is within below the limit', () => {
    expect(evaluateBodyComposition(army, 33, 70).status).toBe('within');
    expect(evaluateBodyComposition(navy, 33, 70).status).toBe('within');
  });

  it('rounds the Navy ratio down to four decimals but not the Army ratio', () => {
    const result = evaluateBodyComposition(navy, 38.4999, 70);
    expect(result.comparedRatio).toBe(0.5499);
    expect(result.status).toBe('within');
    expect(evaluateBodyComposition(army, 38.5001, 70).status).toBe('over');
    expect(evaluateBodyComposition(army, 38.5001, 70).comparedRatio).toBe(
      evaluateBodyComposition(army, 38.5001, 70).ratio,
    );
  });

  it('says what happens when over the limit', () => {
    expect(evaluateBodyComposition(navy, 40, 70).ifOver).toMatch(/Step 2/);
  });

  it('rejects non-positive measurements', () => {
    expect(() => evaluateBodyComposition(army, 0, 70)).toThrow(RangeError);
  });
});

describe('Marine Corps and Air Force waist-to-height rules', () => {
  const marine = bodyStandard('marine-whtr');
  const airForce = bodyStandard('af-whtr');

  it('follows the Marine Corps maximum-waist table, including the exact 0.52 rows', () => {
    // From the table in MARADMIN 066/26: 70 in -> 36.0, 62.5 in -> 32.5, 75 in -> 39.0, 53 in -> 27.5.
    expect(evaluateBodyComposition(marine, 36, 70).status).toBe('within');
    expect(evaluateBodyComposition(marine, 36.5, 70).status).toBe('over');
    expect(evaluateBodyComposition(marine, 32.5, 62.5).status).toBe('within');
    expect(evaluateBodyComposition(marine, 33, 62.5).status).toBe('over');
    expect(evaluateBodyComposition(marine, 39, 75).status).toBe('within');
    expect(evaluateBodyComposition(marine, 27.5, 53).status).toBe('within');
    expect(evaluateBodyComposition(marine, 28, 53).status).toBe('over');
  });

  it('rounds Marine Corps waist and height down to the half inch before dividing', () => {
    // Raw ratio 36.6 / 70.4 = 0.5199 is under 0.52, but the rounded 36.5 / 70 = 0.5214 is over.
    const result = evaluateBodyComposition(marine, 36.6, 70.4);
    expect(result.usedWaistInches).toBe(36.5);
    expect(result.usedHeightInches).toBe(70);
    expect(result.status).toBe('over');
  });

  it('converts centimeters to inches before rounding', () => {
    const result = evaluateBodyComposition(marine, 91.44, 177.8, 'cm'); // 36 in and 70 in
    expect(result.usedWaistInches).toBe(36);
    expect(result.usedHeightInches).toBe(70);
    expect(result.status).toBe('within');
  });

  it('cuts the Air Force ratio off after two decimals and allows exactly 0.55', () => {
    expect(evaluateBodyComposition(airForce, 39.5, 72).comparedRatio).toBe(0.54);
    expect(evaluateBodyComposition(airForce, 39.5, 72).status).toBe('within');
    // 40.0 / 72 = 0.5555 is cut off to 0.55, which is not above 0.55.
    expect(evaluateBodyComposition(airForce, 40, 72).comparedRatio).toBe(0.55);
    expect(evaluateBodyComposition(airForce, 40, 72).status).toBe('within');
    // 40.5 / 72 = 0.5625 is cut off to 0.56, which is above 0.55 (high risk).
    expect(evaluateBodyComposition(airForce, 40.5, 72).status).toBe('over');
  });

  it('scores the Air Force ratio with the chart points', () => {
    expect(evaluateBodyComposition(airForce, 35, 72).points).toBe(20); // 0.4861, at most 0.49
    expect(evaluateBodyComposition(airForce, 40, 72).points).toBe(12.5); // cut off to 0.55
    expect(evaluateBodyComposition(airForce, 43, 72).points).toBe(2.5); // 0.5972 -> 0.59
    expect(evaluateBodyComposition(airForce, 50, 72).points).toBe(0);
    expect(evaluateBodyComposition(marine, 36, 70).points).toBeUndefined();
  });

  it('rounds only the Air Force waist down, not the height', () => {
    const result = evaluateBodyComposition(airForce, 39.9, 72.4);
    expect(result.usedWaistInches).toBe(39.5);
    expect(result.usedHeightInches).toBe(72.4);
  });
});

describe('schema guards', () => {
  interface MinimumInput {
    sex: string;
    ageMin: number;
    ageMax: number | null;
    value: string;
  }
  const minimums: MinimumInput[] = [
    { sex: 'male', ageMin: 20, ageMax: 29, value: '12:00' },
    { sex: 'female', ageMin: 20, ageMax: 29, value: '14:00' },
  ];
  const valid = {
    id: 'test-standard',
    organization: 'army',
    name: 'Test',
    source: { document: 'doc', verifiedAt: '2026-11-24', evidence: 'read' },
    completeness: 'complete',
    events: [
      {
        id: 'run',
        name: 'Run',
        family: 'run-1-5-mile',
        unit: 'seconds',
        better: 'lower',
        minimums,
      },
    ],
  };

  it('accepts a valid standard and converts times to seconds', () => {
    const parsed = standardSchema.parse(valid);
    expect(parsed.events[0]?.minimums[0]?.value).toBe(720);
  });

  it('rejects overlapping age ranges for the same sex', () => {
    const bad = structuredClone(valid);
    bad.events[0]?.minimums.push({ sex: 'male', ageMin: 25, ageMax: 35, value: '13:00' });
    expect(standardSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects overlap with a sex-any row', () => {
    const bad = structuredClone(valid);
    bad.events[0]?.minimums.push({ sex: 'any', ageMin: 20, ageMax: null, value: '13:00' });
    expect(standardSchema.safeParse(bad).success).toBe(false);
  });

  it('requires a caveat for minimums-only standards', () => {
    const bad = { ...structuredClone(valid), completeness: 'minimums-only' };
    expect(standardSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects duplicate event ids, bad times and a missing source date', () => {
    const duplicate = structuredClone(valid);
    const first = duplicate.events[0];
    if (first) duplicate.events.push(structuredClone(first));
    expect(standardSchema.safeParse(duplicate).success).toBe(false);

    const badTime = structuredClone(valid);
    const row = badTime.events[0]?.minimums[0];
    if (row) row.value = '12:75';
    expect(standardSchema.safeParse(badTime).success).toBe(false);

    const noDate = structuredClone(valid);
    Reflect.deleteProperty(noDate.source, 'verifiedAt');
    expect(standardSchema.safeParse(noDate).success).toBe(false);
  });
});
