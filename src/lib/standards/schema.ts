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

function overlaps(a: z.output<typeof minimumSchema>, b: z.output<typeof minimumSchema>): boolean {
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

/** Waist-to-height ratio rule of one organization. */
export const bodyCompositionSchema = z.object({
  id: slug,
  organization: slug,
  name: z.string().min(1),
  effectiveDate: isoDate.optional(),
  source: sourceSchema,
  method: z.literal('whtr'),
  /** The ratio must be strictly below this value. */
  limit: z.number().positive(),
  /** Round the ratio down to this many decimals before comparing (Navy: 4). */
  roundDownDecimals: z.number().int().min(0).max(6).optional(),
  /** What happens when the ratio is not below the limit. */
  ifOver: z.string().min(1),
  notes: z.array(z.string()).default([]),
});

export type Source = z.output<typeof sourceSchema>;
export type Organization = z.output<typeof organizationSchema>;
export type Standard = z.output<typeof standardSchema>;
export type StandardEvent = Standard['events'][number];
export type BodyCompositionStandard = z.output<typeof bodyCompositionSchema>;
