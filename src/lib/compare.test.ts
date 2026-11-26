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
      'army',
      'navy',
      'atf',
      'dea',
      'fbi',
      'ice-hsi',
      'usms',
      'usss',
    ]);
    expect(comparison.groups).toEqual([
      { kind: 'military', label: 'Military branches', span: 2 },
      { kind: 'federal', label: 'Federal agencies', span: 6 },
    ]);
  });

  it('lists organizations without verified numbers, by group', () => {
    const { missing } = compare(25, 'male');
    expect(missing).toEqual([
      {
        kind: 'military',
        label: 'Military branches',
        names: ['Air Force', 'Coast Guard', 'Marine Corps', 'Space Force'],
      },
    ]);
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
      'Waist-to-height ratio below 0.55 (rounded down to 4 decimals)',
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
