import { describe, expect, it } from 'vitest';
import { buildComparison } from './compare';
import { describeMinimum } from './readiness/format';
import {
  bodyCompositionSchema,
  organizationSchema,
  standardSchema,
  type BodyCompositionStandard,
  type Organization,
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
const bodyRules = load(
  import.meta.glob('/src/content/body-composition/*.json', { eager: true, import: 'default' }),
  (data) => bodyCompositionSchema.parse(data),
) as BodyCompositionStandard[];

const compare = (age: number, sex: 'male' | 'female', variant?: string) =>
  buildComparison(organizations, standards, bodyRules, { age, sex, variant });

function cell(comparison: ReturnType<typeof compare>, familyId: string, orgId: string) {
  const row = comparison.rows.find((r) => r.familyId === familyId);
  const index = comparison.columns.findIndex((c) => c.id === orgId);
  if (!row || index < 0) throw new Error(`no cell ${familyId}/${orgId}`);
  return row.cells[index] ?? [];
}

describe('describeMinimum', () => {
  it('words minimums by direction and unit', () => {
    expect(describeMinimum('reps', 'higher', 33, 'us')).toBe('at least 33 reps');
    expect(describeMinimum('seconds', 'lower', 738, 'us')).toBe('12:18 or faster');
    expect(describeMinimum('seconds', 'higher', 90, 'us')).toBe('at least 1:30');
    expect(describeMinimum('inches', 'higher', 17.5, 'us')).toBe('at least 17.5 in');
    expect(describeMinimum('pounds', 'higher', 150, 'metric')).toBe('at least 68 kg');
  });
});

describe('buildComparison', () => {
  it('groups columns into military branches, then federal agencies', () => {
    const comparison = compare(25, 'male');
    expect(comparison.columns.map((c) => c.id)).toEqual(['army', 'navy', 'atf', 'ice-hsi', 'usms']);
    expect(comparison.groups).toEqual([
      { kind: 'military', label: 'Military branches', span: 2 },
      { kind: 'federal', label: 'Federal agencies', span: 3 },
    ]);
  });

  it('lists organizations without verified numbers, by group', () => {
    const { missing } = compare(25, 'male');
    expect(missing.find((m) => m.kind === 'military')?.names).toEqual([
      'Air Force',
      'Coast Guard',
      'Marine Corps',
      'Space Force',
    ]);
    expect(missing.find((m) => m.kind === 'federal')?.names).toEqual([
      'DEA',
      'FBI',
      'Secret Service',
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

  it('leaves a cell empty where a test has no event of that kind', () => {
    const comparison = compare(25, 'male');
    expect(cell(comparison, 'run-1-5-mile', 'army')).toEqual([]);
    expect(cell(comparison, 'deadlift', 'navy')).toEqual([]);
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
  });

  it('lists the source of every column', () => {
    const comparison = compare(25, 'male');
    expect(comparison.sources.map((s) => s.org.id)).toEqual(comparison.columns.map((c) => c.id));
    expect(comparison.sources.every((s) => s.standards.length > 0 || s.bodyRules.length > 0)).toBe(
      true,
    );
  });
});
