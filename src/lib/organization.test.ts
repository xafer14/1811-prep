import { describe, expect, it } from 'vitest';
import { buildOrganizationPage } from './organization';
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
const data = {
  standards: load(
    import.meta.glob('/src/content/standards/*.json', { eager: true, import: 'default' }),
    (item) => standardSchema.parse(item),
  ) as Standard[],
  pointStandards: load(
    import.meta.glob('/src/content/point-standards/*.json', { eager: true, import: 'default' }),
    (item) => pointsStandardSchema.parse(item),
  ) as PointsStandard[],
  bodyRules: load(
    import.meta.glob('/src/content/body-composition/*.json', { eager: true, import: 'default' }),
    (item) => bodyCompositionSchema.parse(item),
  ) as BodyCompositionStandard[],
};

function page(id: string) {
  const org = organizations.find((item) => item.id === id);
  if (!org) throw new Error(`no organization ${id}`);
  return buildOrganizationPage(org, data);
}

describe('buildOrganizationPage', () => {
  it('lists the Army events with the 60-point level for each age band', () => {
    const army = page('army');
    expect(army.hasData).toBe(true);
    const test = army.tests[0];
    expect(test?.kind).toBe('points');
    expect(test?.events.map((e) => e.id)).toEqual(['mdl', 'hrp', 'sdc', 'plk', '2mr']);
    const deadlift = test?.events.find((e) => e.id === 'mdl');
    expect(deadlift?.rows).toHaveLength(10);
    expect(deadlift?.rows[0]).toMatchObject({
      band: { label: '17-21' },
      men: 'at least 150 lb',
      women: 'at least 120 lb',
    });
    expect(deadlift?.rows.at(-1)?.band.label).toBe('62+');
    expect(test?.summary).toContain('300 points in total (350 for Combat MOS)');
  });

  it('shows plain minimums for a pass-or-fail test', () => {
    const atf = page('atf');
    const test = atf.tests[0];
    expect(test?.kind).toBe('minimums');
    const run = test?.events.find((e) => e.id === 'run');
    expect(run?.rows.every((row) => row.men !== undefined && row.women !== undefined)).toBe(true);
    expect(
      run?.rows.find((row) => row.band.ageMin <= 25 && (row.band.ageMax ?? 99) >= 25)?.men,
    ).toBe('12:18 or faster');
  });

  it('uses the same text for both sexes when a table is age and sex neutral', () => {
    const marine = page('marine-corps');
    const plank = marine.tests[0]?.events.find((e) => e.id === 'plank');
    expect(plank?.rows).toHaveLength(1);
    expect(plank?.rows[0]?.men).toBe('at least 1:10');
    expect(plank?.rows[0]?.women).toBe('at least 1:10');
  });

  it('includes the waist-to-height rule, the sources and what is still pending', () => {
    const marine = page('marine-corps');
    expect(marine.body[0]?.rule).toContain('0.52 or less');
    expect(marine.body[0]?.source.url).toMatch(/^https:/);
    expect(marine.tests[0]?.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(marine.pending.length).toBeGreaterThan(0);
  });

  it('handles an organization without verified numbers', () => {
    const coastGuard = page('coast-guard');
    expect(coastGuard.hasData).toBe(false);
    expect(coastGuard.tests).toEqual([]);
    expect(coastGuard.body).toEqual([]);
  });

  it('gives every organization a page model', () => {
    for (const org of organizations) {
      expect(() => buildOrganizationPage(org, data)).not.toThrow();
    }
  });
});
