/** Centimeters per inch (exact, by definition). */
export const CM_PER_INCH = 2.54;
/** Kilograms per pound (exact, by definition). */
export const KG_PER_POUND = 0.45359237;

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function poundsToKg(pounds: number): number {
  return pounds * KG_PER_POUND;
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number`);
  }
}

/** Waist-to-height ratio; both inputs in the same unit. */
export function waistToHeightRatio(waist: number, height: number): number {
  assertPositive('waist', waist);
  assertPositive('height', height);
  return waist / height;
}

/** Body mass index in kg/m^2. Informational only; never a verdict (see docs/SPEC.md section 5). */
export function bodyMassIndex(weightKg: number, heightCm: number): number {
  assertPositive('weightKg', weightKg);
  assertPositive('heightCm', heightCm);
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}
