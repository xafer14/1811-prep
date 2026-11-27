import { describeMinimum } from './readiness/format';
import { findMinimum, scoringSex, type Profile } from './standards/evaluate';
import { EVENT_FAMILIES } from './standards/families';
import { hasScale, minimumValueForPoints, pointsScoringSex } from './standards/points';
import type {
  BodyCompositionStandard,
  Organization,
  PointsStandard,
  Standard,
} from './standards/schema';

export interface CellEvent {
  /** Event name with its details, for example "Push-ups (1 min)". */
  name: string;
  /** The minimum in words, or undefined when none is published for this age. */
  minimum: string | undefined;
  /** Extra context, for example that the number is the level worth one point. */
  note?: string | undefined;
}

export interface ComparisonRow {
  familyId: string;
  label: string;
  /** One list per column; an empty list means the test has no event of this kind. */
  cells: CellEvent[][];
}

export interface ComparisonGroup {
  kind: Organization['kind'];
  label: string;
  span: number;
}

export interface ComparisonSource {
  org: Organization;
  standards: Standard[];
  pointStandards: PointsStandard[];
  bodyRules: BodyCompositionStandard[];
}

export interface Comparison {
  columns: Organization[];
  groups: ComparisonGroup[];
  rows: ComparisonRow[];
  /** One entry per column: the waist-to-height rule in words, if the organization has one. */
  bodyRule: (string | undefined)[];
  /** One entry per column: a rule that also applies beyond the listed minimums. */
  otherRule: (string | undefined)[];
  sources: ComparisonSource[];
  /** Organizations without verified numbers yet, grouped by kind. */
  missing: { kind: Organization['kind']; label: string; names: string[] }[];
  /** Organizations shown only in part, with what is still missing. */
  partial: { name: string; items: string[] }[];
}

export interface ComparisonData {
  organizations: readonly Organization[];
  standards: readonly Standard[];
  pointStandards: readonly PointsStandard[];
  bodyRules: readonly BodyCompositionStandard[];
}

const GROUPS: { kind: Organization['kind']; label: string }[] = [
  { kind: 'military', label: 'Military branches' },
  { kind: 'federal', label: 'Federal agencies' },
  { kind: 'state', label: 'State agencies' },
];

const familyLabel = (id: string): string =>
  EVENT_FAMILIES.find((family) => family.id === id)?.label ?? id;

const stepText = (step: number): string => (step === 0.5 ? '1/2 inch' : `${step} inch`);

export function bodyRuleText(rules: BodyCompositionStandard[]): string | undefined {
  if (rules.length === 0) return undefined;
  return rules
    .map((rule) => {
      const parts: string[] = [];
      if (rule.roundDownDecimals !== undefined) {
        parts.push(`ratio rounded down to ${rule.roundDownDecimals} decimals`);
      }
      const { waistInches, heightInches } = rule.measurementRounding ?? {};
      if (waistInches !== undefined && heightInches !== undefined) {
        parts.push(`waist and height rounded down to ${stepText(waistInches)}`);
      } else if (waistInches !== undefined) {
        parts.push(`waist rounded down to ${stepText(waistInches)}`);
      } else if (heightInches !== undefined) {
        parts.push(`height rounded down to ${stepText(heightInches)}`);
      }
      const limit = rule.atLimit === 'within' ? `${rule.limit} or less` : `below ${rule.limit}`;
      const detail = parts.length > 0 ? ` (${parts.join('; ')})` : '';
      return `Waist-to-height ratio ${limit}${detail}`;
    })
    .join('; ');
}

export function pointsRuleText(standard: PointsStandard): string {
  if (standard.rule.summary) return standard.rule.summary;
  const doubled = standard.events
    .filter((event) => event.multiplier !== 1)
    .map(
      (event) =>
        `${familyLabel(event.family).toLowerCase()} points count ${event.multiplier === 2 ? 'twice' : `${event.multiplier} times`}`,
    );
  const counted = doubled.length > 0 ? ` (${doubled.join(', ')})` : '';
  const each = standard.rule.minPerEvent;
  const other = standard.variants
    .filter((variant) => variant.minTotal !== undefined)
    .map((variant) => `${variant.minTotal} for ${variant.label.split(' (')[0]}`);
  const total = other.length > 0 ? ` (${other.join(', ')})` : '';
  return `Needs ${standard.rule.minTotal} points in total${total}${counted}, and at least ${each} ${each === 1 ? 'point' : 'points'} in each event.`;
}

/** Minimums of every organization with verified data, for one age and sex. */
export function buildComparison(data: ComparisonData, profile: Profile): Comparison {
  const { organizations, standards, pointStandards, bodyRules } = data;
  const hasData = (org: Organization): boolean =>
    standards.some((s) => s.organization === org.id) ||
    pointStandards.some((s) => s.organization === org.id) ||
    bodyRules.some((b) => b.organization === org.id);

  const columns: Organization[] = [];
  const groups: ComparisonGroup[] = [];
  const missing: Comparison['missing'] = [];
  for (const group of GROUPS) {
    const inGroup = organizations.filter((org) => org.kind === group.kind);
    const withData = inGroup.filter(hasData);
    if (withData.length > 0) {
      columns.push(...withData);
      groups.push({ kind: group.kind, label: group.label, span: withData.length });
    }
    const without = inGroup.filter((org) => !hasData(org));
    if (without.length > 0) {
      missing.push({
        kind: group.kind,
        label: group.label,
        names: without.map((org) => org.shortName),
      });
    }
  }

  const standardsOf = (org: Organization): Standard[] =>
    standards.filter((s) => s.organization === org.id);
  const pointsOf = (org: Organization): PointsStandard[] =>
    pointStandards.filter((s) => s.organization === org.id);
  const bodyOf = (org: Organization): BodyCompositionStandard[] =>
    bodyRules.filter((b) => b.organization === org.id);

  const minimumCells = (org: Organization, familyId: string): CellEvent[] =>
    standardsOf(org).flatMap((standard) => {
      const sex = scoringSex(standard, {
        ...profile,
        variant: standard.variants.some((v) => v.id === profile.variant)
          ? profile.variant
          : undefined,
      });
      return standard.events
        .filter((event) => event.family === familyId)
        .map((event) => {
          const value = findMinimum(event, sex, profile.age);
          return {
            name: event.name,
            minimum:
              value === undefined
                ? undefined
                : describeMinimum(event.unit, event.better, value, 'us'),
          };
        });
    });

  const pointCells = (org: Organization, familyId: string): CellEvent[] =>
    pointsOf(org).flatMap((standard) => {
      const sex = pointsScoringSex(standard, {
        ...profile,
        variant: standard.variants.some((v) => v.id === profile.variant)
          ? profile.variant
          : undefined,
      });
      return standard.events
        .filter((event) => event.family === familyId)
        .map((event) => {
          const each = standard.rule.minPerEvent;
          const value = minimumValueForPoints(event, sex, profile.age, each);
          const covered = hasScale(event, sex, profile.age);
          return {
            name: event.name,
            minimum:
              value === undefined || !covered
                ? undefined
                : describeMinimum(event.unit, event.better, value, 'us'),
            note:
              standard.groups.length > 0
                ? 'Component minimum (scores zero below it); the total also counts'
                : `Worth ${each} ${each === 1 ? 'point' : 'points'}; the total also counts`,
          };
        });
    });

  const rows = EVENT_FAMILIES.map((family) => ({
    familyId: family.id,
    label: family.label,
    cells: columns.map((org) => [...minimumCells(org, family.id), ...pointCells(org, family.id)]),
  })).filter((row) => row.cells.some((cell) => cell.length > 0));

  return {
    columns,
    groups,
    rows,
    bodyRule: columns.map((org) => bodyRuleText(bodyOf(org))),
    otherRule: columns.map((org) => {
      const rules = [
        ...standardsOf(org)
          .filter((s) => s.completeness === 'minimums-only' && s.caveat)
          .map((s) => s.caveat as string),
        ...pointsOf(org).map(pointsRuleText),
      ];
      return rules.length > 0 ? rules.join(' ') : undefined;
    }),
    sources: columns.map((org) => ({
      org,
      standards: standardsOf(org),
      pointStandards: pointsOf(org),
      bodyRules: bodyOf(org),
    })),
    missing,
    partial: columns
      .filter((org) => org.pending.length > 0)
      .map((org) => ({ name: org.shortName, items: org.pending })),
  };
}
