import { describeMinimum } from './readiness/format';
import { findMinimum, scoringSex, type Profile } from './standards/evaluate';
import { EVENT_FAMILIES } from './standards/families';
import type { BodyCompositionStandard, Organization, Standard } from './standards/schema';

export interface CellEvent {
  /** Event name with its details, for example "Push-ups (1 min)". */
  name: string;
  /** The minimum in words, or undefined when none is published for this age. */
  minimum: string | undefined;
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
}

const GROUPS: { kind: Organization['kind']; label: string }[] = [
  { kind: 'military', label: 'Military branches' },
  { kind: 'federal', label: 'Federal agencies' },
  { kind: 'state', label: 'State agencies' },
];

function bodyRuleText(rules: BodyCompositionStandard[]): string | undefined {
  if (rules.length === 0) return undefined;
  return rules
    .map((rule) => {
      const rounding =
        rule.roundDownDecimals === undefined
          ? ''
          : ` (rounded down to ${rule.roundDownDecimals} decimals)`;
      return `Waist-to-height ratio below ${rule.limit}${rounding}`;
    })
    .join('; ');
}

/** Minimums of every organization with verified data, for one age and sex. */
export function buildComparison(
  organizations: readonly Organization[],
  standards: readonly Standard[],
  bodyRules: readonly BodyCompositionStandard[],
  profile: Profile,
): Comparison {
  const hasData = (org: Organization): boolean =>
    standards.some((s) => s.organization === org.id) ||
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
  const bodyOf = (org: Organization): BodyCompositionStandard[] =>
    bodyRules.filter((b) => b.organization === org.id);

  const cellFor = (org: Organization, familyId: string): CellEvent[] =>
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

  const rows = EVENT_FAMILIES.map((family) => ({
    familyId: family.id,
    label: family.label,
    cells: columns.map((org) => cellFor(org, family.id)),
  })).filter((row) => row.cells.some((cell) => cell.length > 0));

  return {
    columns,
    groups,
    rows,
    bodyRule: columns.map((org) => bodyRuleText(bodyOf(org))),
    otherRule: columns.map((org) => {
      const caveats = standardsOf(org)
        .filter((s) => s.completeness === 'minimums-only' && s.caveat)
        .map((s) => s.caveat);
      return caveats.length > 0 ? caveats.join(' ') : undefined;
    }),
    sources: columns.map((org) => ({
      org,
      standards: standardsOf(org),
      bodyRules: bodyOf(org),
    })),
    missing,
  };
}
