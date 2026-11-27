import { bodyRuleText, pointsRuleText } from './compare';
import { describeMinimum } from './readiness/format';
import { findMinimum, type Sex } from './standards/evaluate';
import { minimumValueForPoints } from './standards/points';
import type {
  BodyCompositionStandard,
  Organization,
  PointsStandard,
  Source,
  Standard,
} from './standards/schema';

export interface AgeBand {
  ageMin: number;
  ageMax: number | null;
  label: string;
}

export interface MinimumRow {
  band: AgeBand;
  men: string | undefined;
  women: string | undefined;
}

export interface EventTable {
  id: string;
  name: string;
  rows: MinimumRow[];
}

export interface TestSection {
  id: string;
  name: string;
  /** minimums = pass or fail per event; points = scored in points. */
  kind: 'minimums' | 'points';
  /** What else applies (a total, a rule), in words. */
  summary: string | undefined;
  caveat: string | undefined;
  /** Note on the minimum shown in the tables. */
  tableNote: string;
  events: EventTable[];
  source: Source;
}

export interface BodySection {
  id: string;
  name: string;
  rule: string;
  ifOver: string;
  notes: string[];
  source: Source;
}

export interface OrganizationPage {
  org: Organization;
  tests: TestSection[];
  body: BodySection[];
  pending: string[];
  /** True when the organization has at least one verified test or rule. */
  hasData: boolean;
}

export interface OrganizationData {
  standards: readonly Standard[];
  pointStandards: readonly PointsStandard[];
  bodyRules: readonly BodyCompositionStandard[];
}

const bandLabel = (ageMin: number, ageMax: number | null): string =>
  ageMax === null ? `${ageMin}+` : ageMin === ageMax ? String(ageMin) : `${ageMin}-${ageMax}`;

function bandsOf(ranges: { ageMin: number; ageMax: number | null }[]): AgeBand[] {
  const seen = new Map<string, AgeBand>();
  for (const { ageMin, ageMax } of ranges) {
    const key = `${ageMin}-${ageMax ?? ''}`;
    if (!seen.has(key)) seen.set(key, { ageMin, ageMax, label: bandLabel(ageMin, ageMax) });
  }
  return [...seen.values()].sort((a, b) => a.ageMin - b.ageMin);
}

const sexes: Sex[] = ['male', 'female'];

function minimumsSection(standard: Standard): TestSection {
  const events = standard.events.map((event): EventTable => {
    const bands = bandsOf(event.minimums);
    const text = (sex: Sex, band: AgeBand): string | undefined => {
      const value = findMinimum(event, sex, band.ageMin);
      return value === undefined
        ? undefined
        : describeMinimum(event.unit, event.better, value, 'us');
    };
    return {
      id: event.id,
      name: event.name,
      rows: bands.map((band) => ({
        band,
        men: text(sexes[0] as Sex, band),
        women: text(sexes[1] as Sex, band),
      })),
    };
  });
  return {
    id: standard.id,
    name: standard.name,
    kind: 'minimums',
    summary: undefined,
    caveat: standard.caveat,
    tableNote: 'Official minimum for each event, by age.',
    events,
    source: standard.source,
  };
}

function pointsSection(standard: PointsStandard): TestSection {
  const each = standard.rule.minPerEvent;
  const events = standard.events.map((event): EventTable => {
    const bands = bandsOf(event.scales);
    const text = (sex: Sex, band: AgeBand): string | undefined => {
      const value = minimumValueForPoints(event, sex, band.ageMin, each);
      return value === undefined
        ? undefined
        : describeMinimum(event.unit, event.better, value, 'us');
    };
    return {
      id: event.id,
      name: event.name,
      rows: bands.map((band) => ({
        band,
        men: text(sexes[0] as Sex, band),
        women: text(sexes[1] as Sex, band),
      })),
    };
  });
  return {
    id: standard.id,
    name: standard.name,
    kind: 'points',
    summary: pointsRuleText(standard),
    caveat: standard.caveat,
    tableNote: `Lowest result that still earns the ${each} ${each === 1 ? 'point' : 'points'} needed in the event. The full point scale is in the official document.`,
    events,
    source: standard.source,
  };
}

/** Everything one organization page shows, from the verified data. */
export function buildOrganizationPage(org: Organization, data: OrganizationData): OrganizationPage {
  const tests = [
    ...data.pointStandards.filter((s) => s.organization === org.id).map(pointsSection),
    ...data.standards.filter((s) => s.organization === org.id).map(minimumsSection),
  ];
  const body = data.bodyRules
    .filter((rule) => rule.organization === org.id)
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      rule: bodyRuleText([rule]) ?? '',
      ifOver: rule.ifOver,
      notes: rule.notes,
      source: rule.source,
    }));
  return { org, tests, body, pending: org.pending, hasData: tests.length > 0 || body.length > 0 };
}
