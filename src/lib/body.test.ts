import { describe, expect, it } from 'vitest';
import { bodyMassIndex, inchesToCm, poundsToKg, waistToHeightRatio } from './body';

describe('unit conversion', () => {
  it('converts inches to centimeters', () => {
    expect(inchesToCm(10)).toBeCloseTo(25.4, 10);
  });

  it('converts pounds to kilograms', () => {
    expect(poundsToKg(100)).toBeCloseTo(45.359237, 10);
  });
});

describe('waistToHeightRatio', () => {
  it('divides waist by height', () => {
    expect(waistToHeightRatio(33, 70)).toBeCloseTo(0.4714, 4);
  });

  it.each([
    [0, 70],
    [33, 0],
    [-1, 70],
    [Number.NaN, 70],
  ])('rejects invalid input waist=%s height=%s', (waist, height) => {
    expect(() => waistToHeightRatio(waist, height)).toThrow(RangeError);
  });
});

describe('bodyMassIndex', () => {
  it('computes kg/m^2', () => {
    expect(bodyMassIndex(70, 175)).toBeCloseTo(22.857, 3);
  });

  it('rejects non-positive input', () => {
    expect(() => bodyMassIndex(0, 175)).toThrow(RangeError);
    expect(() => bodyMassIndex(70, -1)).toThrow(RangeError);
  });
});
