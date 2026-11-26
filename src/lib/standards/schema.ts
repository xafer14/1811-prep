import { z } from 'astro/zod';
import { TIME_PATTERN, parseTime } from '../time';
import { FAMILY_IDS } from './families';

const isoDate = z.iso.date();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use a kebab-case id');

/** Where a number comes from. `read` = taken from the official document itself. */
export const sourceSchema = z.object({
  document: z.string().min(1),
  url: z.url().optional(),
  /** Free text such as "Last Updated: October 1, 2026" or "approved 15 May 2025". */
  documentDate: z.string().optional(),
  verifiedAt: isoDate,
  evidence: z.enum(['read', 'excerpt']),
});

export const organizationSchema = z.object({
  id: slug,
  name: z.string().min(1),
  shortName: z.string().min(1),
  kind: z.enum(['military', 'federal', 'state']),
  /** Topics not shown yet for this organization, in plain words (shown to users). */
  pending: z.array(z.string().min(1)).default([]),
});

/** A minimum can be a number or a time string such as "12:18" (stored as seconds). */
const valueSchema = z.union([
  z.number().nonnegative(),
  z
    .string()
    .regex(TIME_PATTERN, 'use m:ss')
    .transform((text) => parseTime(text)),
]);

const minimumSchema = z
  .object({
    sex: z.enum(['male', 'female', 'any']),
    ageMin: z.number().int().min(10),
    /** null = no upper limit */
    ageMax: z.number().int().nullable(),
    value: valueSchema,
  })
  .refine((m) => m.ageMax === null || m.ageMax >= m.ageMin, {
    message: 'ageMax must be at least ageMin',
  });

const eventSchema = z.object({
  id: slug,
  name: z.string().min(1),
  /** Which kind of effort this is, so organizations can be compared side by side. */
  family: z.enum(FAMILY_IDS),
  unit: z.enum(['reps', 'seconds', 'pounds', 'inches']),
  /** higher = more is better (reps); lower = less is better (run time). */
  better: z.enum(['higher', 'lower']),
  minimums: z.array(minimumSchema).min(1),
});

const variantSchema = z.object({
  id: slug,
  label: z.string().min(1),
  /** A sex-neutral variant scores everyone with this sex's column. */
  useSex: z.enum(['male', 'female']),
});

interface AgeSexRange {
  sex: 'male' | 'female' | 'any';
  ageMin: number;
  ageMax: number | null;
}

function overlaps(a: AgeSexRange, b: AgeSexRange): boolean {
  const sexOverlap = a.sex === 'any' || b.sex === 'any' || a.sex === b.sex;
  const aMax = a.ageMax ?? Number.POSITIVE_INFINITY;
  const bMax = b.ageMax ?? Number.POSITIVE_INFINITY;
  return sexOverlap && a.ageMin <= bMax && b.ageMin <= aMax;
}

export const standardSchema = z
  .object({
    id: slug,
    organization: slug,
    name: z.string().min(1),
    effectiveDate: isoDate.optional(),
    source: sourceSchema,
    variants: z.array(variantSchema).default([]),
    /**
     * complete = meeting every listed minimum is the whole requirement.
     * minimums-only = another rule also applies (for example a total score); see caveat.
     */
    completeness: z.enum(['complete', 'minimums-only']),
    caveat: z.string().optional(),
    events: z.array(eventSchema).min(1),
  })
  .superRefine((standard, ctx) => {
    if (standard.completeness === 'minimums-only' && !standard.caveat) {
      ctx.addIssue({ code: 'custom', message: 'minimums-only standards need a caveat' });
    }
    const eventIds = new Set<string>();
    standard.events.forEach((event, eventIndex) => {
      if (eventIds.has(event.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate event id ${event.id}`,
          path: ['events', eventIndex, 'id'],
        });
      }
      eventIds.add(event.id);
      event.minimums.forEach((a, i) => {
        event.minimums.slice(i + 1).forEach((b, offset) => {
          if (overlaps(a, b)) {
            ctx.addIssue({
              code: 'custom',
              message: `overlapping minimums in event ${event.id}`,
              path: ['events', eventIndex, 'minimums', i + 1 + offset],
            });
          }
        });
      });
    });
  });

/**
 * One scoring step. For a `higher` event the result must be at least `value` to earn the points;
 * for a `lower` event (a time) it must be at most `value`.
 */
const stepSchema = z.object({
  points: z.number().int(),
  value: valueSchema,
});

const scaleSchema = z
  .object({
    sex: z.enum(['male', 'female', 'any']),
    ageMin: z.number().int().min(10),
    /** null = no upper limit */
    ageMax: z.number().int().nullable(),
    /** Points earned when not even the first step is reached. */
    floorPoints: z.number().int(),
    /** Steps in ascending order of points. */
    steps: z.array(stepSchema).min(1),
  })
  .refine((s) => s.ageMax === null || s.ageMax >= s.ageMin, {
    message: 'ageMax must be at least ageMin',
  });

const pointsEventSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    family: z.enum(FAMILY_IDS),
    unit: z.enum(['reps', 'seconds', 'pounds', 'inches']),
    better: z.enum(['higher', 'lower']),
    /** How many times the event's points count in the total (DEA 1.5-mile run: 2). */
    multiplier: z.number().positive().default(1),
    scales: z.array(scaleSchema).min(1),
  })
  .superRefine((event, ctx) => {
    event.scales.forEach((scale, scaleIndex) => {
      const path = ['scales', scaleIndex, 'steps'];
      scale.steps.forEach((step, i) => {
        const previous = scale.steps[i - 1];
        if (previous === undefined) {
          if (step.points <= scale.floorPoints) {
            ctx.addIssue({
              code: 'custom',
              message: 'floorPoints must be below the first step',
              path,
            });
          }
          return;
        }
        if (step.points <= previous.points) {
          ctx.addIssue({ code: 'custom', message: 'step points must rise', path: [...path, i] });
        }
        const rising =
          event.better === 'higher' ? step.value > previous.value : step.value < previous.value;
        if (!rising) {
          ctx.addIssue({
            code: 'custom',
            message: `step values must ${event.better === 'higher' ? 'rise' : 'fall'} with the points`,
            path: [...path, i],
          });
        }
      });
      event.scales.slice(scaleIndex + 1).forEach((other, offset) => {
        if (overlaps(scale, other)) {
          ctx.addIssue({
            code: 'custom',
            message: `overlapping scales in event ${event.id}`,
            path: ['scales', scaleIndex + 1 + offset],
          });
        }
      });
    });
  });

/** A test scored in points (FBI, DEA, Secret Service): a total plus a minimum in each event. */
export const pointsStandardSchema = z
  .object({
    id: slug,
    organization: slug,
    name: z.string().min(1),
    effectiveDate: isoDate.optional(),
    source: sourceSchema,
    scoring: z.literal('points'),
    rule: z.object({
      /** Points needed in total (after multipliers). */
      minTotal: z.number().positive(),
      /** Points needed in each event (before multipliers). */
      minPerEvent: z.number(),
    }),
    caveat: z.string().optional(),
    events: z.array(pointsEventSchema).min(1),
  })
  .superRefine((standard, ctx) => {
    const ids = new Set<string>();
    standard.events.forEach((event, index) => {
      if (ids.has(event.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate event id ${event.id}`,
          path: ['events', index, 'id'],
        });
      }
      ids.add(event.id);
    });
  });

/** Waist-to-height ratio rule of one organization. */
export const bodyCompositionSchema = z.object({
  id: slug,
  organization: slug,
  name: z.string().min(1),
  effectiveDate: isoDate.optional(),
  source: sourceSchema,
  method: z.literal('whtr'),
  /** The limit of the ratio. */
  limit: z.number().positive(),
  /**
   * How a ratio exactly equal to the limit counts: `over` (the ratio must be below the limit)
   * or `within` (the ratio may equal the limit).
   */
  atLimit: z.enum(['within', 'over']).default('over'),
  /** Round the ratio down to this many decimals before comparing (Navy: 4, Space Force: 2). */
  roundDownDecimals: z.number().int().min(0).max(6).optional(),
  /** Measurements are rounded down to this step, in inches, before the ratio is computed. */
  measurementRounding: z
    .object({
      waistInches: z.number().positive().optional(),
      heightInches: z.number().positive().optional(),
    })
    .optional(),
  /** What happens when the ratio is over the limit. */
  ifOver: z.string().min(1),
  notes: z.array(z.string()).default([]),
});

export type Source = z.output<typeof sourceSchema>;
export type Organization = z.output<typeof organizationSchema>;
export type Standard = z.output<typeof standardSchema>;
export type StandardEvent = Standard['events'][number];
export type BodyCompositionStandard = z.output<typeof bodyCompositionSchema>;
export type PointsStandard = z.output<typeof pointsStandardSchema>;
export type PointsEvent = PointsStandard['events'][number];
