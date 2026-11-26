import { describe, expect, it } from 'vitest';
import { buildComparison } from './compare';
import { describeMinimum } from './readiness/format';
import {
  bodyCompositionSchema,
  organizationSchema,
  pointsStandardSchema,
  standardSchema,
  type BodyCompositionStandard,
  type Organization,
  type PointsStandard,
  type Standard,
} from './standards/schema';

const load = <T>(files: Record<string, unknown>, parse: (data: unknown) => T): T[] =>
  Object.keys(files)
    .sort()
    .map((path) => parse(files[path]));

const organizations = load(
  import.meta.glob('/src/content/organizations/*.json', { eager: true, import: 'default' }),
  (data) => organizationSchema.parse(data),
) as Organization[];
const standards = load(
  import.meta.glob('/src/content/standards/*.json', { eager: true, import: 'default' }),
  (data) => standardSchema.parse(data),
) as Standard[];
const pointStandards = load(
  import.meta.glob('/src/content/point-standards/*.json', { eager: true, import: 'default' }),
  (data) => pointsStandardSchema.parse(data),
) as PointsStandard[];
const bodyRules = load(
  import.meta.glob('/src/content/body-composition/*.json', { eager: true, import: 'default' }),
  (data) => bodyCompositionSchema.parse(data),
) as BodyCompositionStandard[];

const compare = (age: number, sex: 'male' | 'female', variant?: string) =>
  buildComparison({ organizations, standards, pointStandards, bodyRules }, { age, sex, variant });

function cell(comparison: ReturnType<typeof compare>, familyId: string, orgId: string) {
  const row = comparison.rows.find((r) => r.familyId === familyId);
  const index = comparison.columns.findIndex((c) => c.id === orgId);
  if (!row || index < 0) throw new Error(`no cell ${familyId}/${orgId}`);
  return row.cells[index] ?? [];
}

describe('describeMinimum', () => {
  it('words minimums by direction and unit', () => {
    expect(describeMinimum('reps', 'higher', 33, 'us')).toBe('at least 33 reps');
    expect(describeMinimum('reps', 'higher', 1, 'us')).toBe('at least 1 rep');
    expect(describeMinimum('seconds', 'lower', 738, 'us')).toBe('12:18 or faster');
    expect(describeMinimum('seconds', 'higher', 90, 'us')).toBe('at least 1:30');
    expect(describeMinimum('inches', 'higher', 17.5, 'us')).toBe('at least 17.5 in');
    expect(describeMinimum('pounds', 'higher', 150, 'metric')).toBe('at least 68 kg');
  });
});

describe('buildComparison', () => {
  it('groups columns into military branches, then federal agencies', () => {
    const comparison = compare(25, 'male');
    expect(comparison.columns.map((c) => c.id)).toEqual([
      'air-force',
      'army',
      'marine-corps',
      'navy',
      'space-force',
      'atf',
      'dea',
      'fbi',
      'ice-hsi',
      'usms',
      'usss',
    ]);
    expect(comparison.groups).toEqual([
      { kind: 'military', label: 'Military branches', span: 5 },
      { kind: 'federal', label: 'Federal agencies', span: 6 },
    ]);
  });

  it('lists organizations without verified numbers, by group', () => {
    const { missing } = compare(25, 'male');
    expect(missing).toEqual([
      { kind: 'military', label: 'Military branches', names: ['Coast Guard'] },
    ]);
  });

  it('lists organizations that are shown only in part, with what is missing', () => {
    const { partial } = compare(25, 'male');
    expect(partial.map((p) => p.name)).toEqual(['Marine Corps', 'Space Force']);
    expect(partial.find((p) => p.name === 'Space Force')?.items[0]).toMatch(/myFitness/);
    expect(partial.find((p) => p.name === 'Marine Corps')?.items[0]).toMatch(/MCO 6110.3A/);
  });

  it('scores Marine Corps combat arms with the male minimums and lists the Air Force walk', () => {
    const combat = compare(25, 'female', 'combat');
    expect(cell(combat, 'pull-ups', 'marine-corps')[0]?.minimum).toBe('at least 5 reps');
    expect(cell(compare(25, 'female'), 'pull-ups', 'marine-corps')[0]?.minimum).toBe(
      'at least 3 reps',
    );
    const comparison = compare(25, 'male');
    expect(cell(comparison, 'walk-2km', 'air-force')[0]?.minimum).toBe('16:16 or faster');
    const at = (id: string) => comparison.columns.findIndex((c) => c.id === id);
    expect(comparison.otherRule[at('marine-corps')]).toMatch(/at least 210 points/);
  });

  it('shows the Marine Corps minimums from the order, by age and sex', () => {
    const male = compare(25, 'male');
    expect(cell(male, 'pull-ups', 'marine-corps')[0]?.minimum).toBe('at least 5 reps');
    expect(cell(male, 'push-ups', 'marine-corps')[0]?.minimum).toBe('at least 40 reps');
    expect(cell(male, 'plank', 'marine-corps')[0]?.minimum).toBe('at least 1:10');
    expect(cell(male, 'run-3-mile', 'marine-corps')[0]?.minimum).toBe('27:40 or faster');
    const female = compare(25, 'female');
    expect(cell(female, 'pull-ups', 'marine-corps')[0]?.minimum).toBe('at least 3 reps');
    expect(cell(female, 'run-3-mile', 'marine-corps')[0]?.minimum).toBe('30:50 or faster');
    // The official order lists 4 pull-ups for men 46-50 (Military.com says 5).
    expect(cell(compare(48, 'male'), 'pull-ups', 'marine-corps')[0]?.minimum).toBe(
      'at least 4 reps',
    );
  });

  it('lists every Air Force alternative with its component minimum', () => {
    const male = compare(25, 'male');
    const pushUps = cell(male, 'push-ups', 'air-force');
    expect(pushUps.map((e) => e.minimum)).toEqual(['at least 28 reps', 'at least 25 reps']);
    expect(cell(male, 'sit-ups', 'air-force')[0]?.minimum).toBe('at least 31 reps');
    expect(cell(male, 'reverse-crunch', 'air-force')[0]?.minimum).toBe('at least 33 reps');
    expect(cell(male, 'plank', 'air-force')[0]?.minimum).toBe('at least 1:30');
    expect(cell(male, 'run-2-mile', 'air-force')[0]?.minimum).toBe('19:55 or faster');
    expect(cell(male, 'hamr', 'air-force')[0]?.minimum).toBe('at least 42 reps');
    expect(cell(compare(25, 'female'), 'run-2-mile', 'air-force')[0]?.minimum).toBe(
      '25:40 or faster',
    );
    // The same chart row for members under 25.
    expect(cell(compare(20, 'male'), 'push-ups', 'air-force')[0]?.minimum).toBe('at least 30 reps');
    expect(
      compare(25, 'male').otherRule[
        compare(25, 'male').columns.findIndex((c) => c.id === 'air-force')
      ],
    ).toMatch(/composite score of at least 75/);
  });

  it('shows the Space Force walk standard and body composition rule', () => {
    const comparison = compare(25, 'male');
    const at = (id: string) => comparison.columns.findIndex((c) => c.id === id);
    expect(cell(comparison, 'walk-2km', 'space-force')[0]?.minimum).toBe('16:16 or faster');
    expect(cell(compare(65, 'female'), 'walk-2km', 'space-force')[0]?.minimum).toBe(
      '18:53 or faster',
    );
    expect(comparison.bodyRule[at('space-force')]).toBe(
      'Waist-to-height ratio below 0.55 (ratio rounded down to 2 decimals)',
    );
    // The Space Force has no fitness-test rows beyond the walk until its charts are available.
    expect(cell(comparison, 'run-2-mile', 'space-force')).toEqual([]);
  });

  it('puts the same kind of effort on one row with each minimum in words', () => {
    const comparison = compare(25, 'male');
    expect(cell(comparison, 'run-1-5-mile', 'atf')[0]?.minimum).toBe('12:18 or faster');
    expect(cell(comparison, 'run-1-5-mile', 'navy')[0]?.minimum).toBe('14:00 or faster');
    expect(cell(comparison, 'run-1-5-mile', 'ice-hsi')[0]?.minimum).toBe('14:25 or faster');
    expect(cell(comparison, 'push-ups', 'army')[0]).toEqual({
      name: 'Hand-release push-ups (2 min)',
      minimum: 'at least 14 reps',
    });
    expect(cell(comparison, 'push-ups', 'usms')[0]?.minimum).toBe('at least 33 reps');
  });

  it('shows the one-point level for tests scored in points', () => {
    const comparison = compare(25, 'male');
    expect(cell(comparison, 'push-ups', 'fbi')[0]).toEqual({
      name: 'Push-ups (untimed)',
      minimum: 'at least 30 reps',
      note: 'Worth 1 point; the total also counts',
    });
    expect(cell(comparison, 'push-ups', 'dea')[0]?.minimum).toBe('at least 30 reps');
    expect(cell(comparison, 'push-ups', 'usss')[0]?.minimum).toBe('at least 15 reps');
    expect(cell(comparison, 'pull-ups', 'fbi')[0]?.minimum).toBe('at least 2 reps');
    expect(cell(comparison, 'sit-ups', 'dea')[0]?.minimum).toBe('at least 38 reps');
    expect(cell(comparison, 'run-1-5-mile', 'fbi')[0]?.minimum).toBe('12:24 or faster');
    expect(cell(comparison, 'run-1-5-mile', 'usss')[0]?.minimum).toBe('19:40 or faster');
    expect(cell(comparison, 'sprint', 'fbi')[0]?.minimum).toBe('0:52.40 or faster');
    expect(cell(comparison, 'agility-run', 'usss')[0]?.minimum).toBe('0:23.88 or faster');
  });

  it('uses the female scale for points tests when asked', () => {
    const comparison = compare(25, 'female');
    expect(cell(comparison, 'pull-ups', 'fbi')[0]?.minimum).toBe('at least 1 rep');
    expect(cell(comparison, 'push-ups', 'fbi')[0]?.minimum).toBe('at least 14 reps');
    expect(cell(comparison, 'run-1-5-mile', 'dea')[0]?.minimum).toBe('13:59 or faster');
    // The Secret Service uses one scale for everyone.
    expect(cell(comparison, 'push-ups', 'usss')[0]?.minimum).toBe('at least 15 reps');
  });

  it('leaves a cell empty where a test has no event of that kind', () => {
    const comparison = compare(25, 'male');
    expect(cell(comparison, 'run-1-5-mile', 'army')).toEqual([]);
    expect(cell(comparison, 'deadlift', 'navy')).toEqual([]);
    expect(cell(comparison, 'pull-ups', 'dea')).toEqual([]);
  });

  it('uses the female column and the combat variant when asked', () => {
    expect(cell(compare(25, 'female'), 'push-ups', 'army')[0]?.minimum).toBe('at least 11 reps');
    expect(cell(compare(25, 'female', 'combat'), 'push-ups', 'army')[0]?.minimum).toBe(
      'at least 14 reps',
    );
    // The combat variant only exists for the Army; other columns keep the female minimums.
    expect(cell(compare(25, 'female', 'combat'), 'push-ups', 'atf')[0]?.minimum).toBe(
      'at least 16 reps',
    );
  });

  it('marks ages outside a published band instead of guessing', () => {
    const comparison = compare(19, 'male');
    expect(cell(comparison, 'run-1-5-mile', 'atf')[0]?.minimum).toBeUndefined();
    expect(cell(comparison, 'run-1-5-mile', 'usms')[0]?.minimum).toBeUndefined();
    expect(cell(comparison, 'run-1-5-mile', 'navy')[0]?.minimum).toBe('12:45 or faster');
    // Points tests have no age bands, so they still show a value.
    expect(cell(comparison, 'run-1-5-mile', 'fbi')[0]?.minimum).toBe('12:24 or faster');
  });

  it('shows the waist-to-height rule and other rules per organization', () => {
    const comparison = compare(25, 'male');
    const at = (id: string) => comparison.columns.findIndex((c) => c.id === id);
    expect(comparison.bodyRule[at('army')]).toBe('Waist-to-height ratio below 0.55');
    expect(comparison.bodyRule[at('navy')]).toBe(
      'Waist-to-height ratio below 0.55 (ratio rounded down to 4 decimals)',
    );
    expect(comparison.bodyRule[at('marine-corps')]).toBe(
      'Waist-to-height ratio 0.52 or less (waist and height rounded down to 1/2 inch)',
    );
    expect(comparison.bodyRule[at('air-force')]).toBe(
      'Waist-to-height ratio 0.55 or less (ratio rounded down to 2 decimals; waist rounded down to 1/2 inch)',
    );
    expect(comparison.bodyRule[at('atf')]).toBeUndefined();
    expect(comparison.otherRule[at('army')]).toMatch(/total score/);
    expect(comparison.otherRule[at('atf')]).toBeUndefined();
    expect(comparison.otherRule[at('fbi')]).toBe(
      'Needs 10 points in total, and at least 1 point in each event.',
    );
    expect(comparison.otherRule[at('dea')]).toBe(
      'Needs 12 points in total (1.5-mile run points count twice), and at least 1 point in each event.',
    );
    expect(comparison.otherRule[at('usss')]).toBe(
      'Needs 20 points in total, and at least 1 point in each event.',
    );
  });

  it('lists the source of every column', () => {
    const comparison = compare(25, 'male');
    expect(comparison.sources.map((s) => s.org.id)).toEqual(comparison.columns.map((c) => c.id));
    expect(
      comparison.sources.every(
        (s) => s.standards.length + s.pointStandards.length + s.bodyRules.length > 0,
      ),
    ).toBe(true);
  });
});
