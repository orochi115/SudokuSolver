import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

/**
 * Build a Grid from an explicit value array (0 = empty) and candidate masks.
 * These mid-solve states were captured from real corpus solves at the exact
 * point each T3 technique becomes the deciding deduction, so the assertions
 * pin down precise, reproducible output.
 */
function gridFrom(values: number[], masks: number[]): Grid {
  const g = Grid.fromString(values.map((v) => v).join(''));
  for (let i = 0; i < 81; i++) {
    if (values[i] === 0) g.candidates[i] = masks[i]!;
  }
  return g;
}

describe('basic-fish (X-Wing / Swordfish / Jellyfish)', () => {
  it('finds a fish eliminating the expected candidate', () => {
    const values = '000301050390000020508062703170853204035020100400106305703640502060010037050237000'
      .split('')
      .map(Number);
    const masks = [34, 10, 98, 0, 448, 0, 424, 0, 416, 0, 0, 97, 88, 192, 24, 168, 0, 161, 0, 9, 0, 264, 0, 0, 0, 265, 0, 0, 0, 288, 0, 0, 0, 0, 288, 0, 416, 0, 0, 328, 0, 264, 0, 480, 416, 0, 130, 258, 0, 320, 0, 0, 448, 0, 0, 129, 0, 0, 0, 384, 0, 385, 0, 386, 0, 266, 272, 0, 400, 392, 0, 0, 384, 0, 265, 0, 0, 0, 424, 425, 417];
    const step = basicFish.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('basic-fish');
    expect(step!.eliminations).toContainEqual({ cell: 79, digit: 1 });
  });
});

describe('single-digit-patterns (Skyscraper / Kite / Empty Rectangle)', () => {
  it('eliminates the expected candidate', () => {
    const values = '302904108001030400480107063534279681618345700297010345100480007000701000000503010'
      .split('')
      .map(Number);
    const masks = [0, 112, 0, 0, 48, 0, 0, 80, 0, 320, 112, 0, 160, 0, 162, 0, 338, 258, 0, 0, 272, 0, 18, 0, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 258, 258, 0, 0, 0, 160, 0, 160, 0, 0, 0, 0, 18, 308, 0, 0, 34, 274, 278, 0, 384, 26, 308, 0, 290, 0, 402, 278, 40, 448, 74, 288, 0, 290, 0, 386, 0, 40];
    const step = singleDigitPatterns.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('single-digit-patterns');
    expect(step!.eliminations).toContainEqual({ cell: 60, digit: 2 });
  });
});

describe('xy-wing', () => {
  it('eliminates Z from cells seeing both pincers', () => {
    const values = '910684007030957010706213409020091000697835040100062905271546893308179500009328000'
      .split('')
      .map(Number);
    const masks = [0, 0, 18, 0, 0, 0, 6, 22, 0, 136, 0, 10, 0, 0, 0, 34, 0, 162, 0, 144, 0, 0, 0, 0, 0, 144, 0, 152, 0, 28, 72, 0, 0, 100, 100, 160, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 136, 12, 72, 0, 0, 0, 196, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 34, 42, 24, 56, 0, 0, 0, 0, 97, 96, 41];
    const step = xyWing.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xy-wing');
    expect(step!.eliminations).toContainEqual({ cell: 73, digit: 5 });
    expect(step!.highlights.cells).toContain(72); // pivot
  });
});

describe('xyz-wing', () => {
  it('eliminates Z from cells seeing pivot and both pincers', () => {
    const values = '230009071900300006006002593108203657000006008060581904609100385500008709870900062'
      .split('')
      .map(Number);
    const masks = [0, 0, 24, 168, 56, 0, 136, 0, 0, 0, 153, 89, 0, 89, 88, 138, 10, 0, 72, 137, 0, 200, 65, 0, 0, 0, 0, 0, 264, 0, 0, 264, 0, 0, 0, 0, 12, 282, 26, 72, 328, 0, 3, 7, 0, 68, 0, 66, 0, 0, 0, 0, 6, 0, 0, 10, 0, 0, 74, 72, 0, 0, 0, 0, 11, 15, 40, 46, 0, 0, 9, 0, 0, 0, 13, 0, 28, 24, 9, 0, 0];
    const step = xyzWing.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xyz-wing');
    expect(step!.eliminations).toContainEqual({ cell: 65, digit: 4 });
  });
});

describe('w-wing', () => {
  it('eliminates the shared digit from common peers of the two bivalue cells', () => {
    const values = '205070084408300715170584090309045870500000043041000569050409020912057430604010957'
      .split('')
      .map(Number);
    const masks = [0, 292, 0, 289, 0, 33, 36, 0, 0, 0, 288, 0, 0, 290, 34, 0, 0, 0, 0, 0, 36, 0, 0, 0, 38, 0, 34, 0, 34, 0, 33, 0, 0, 0, 0, 3, 0, 162, 96, 353, 288, 161, 3, 0, 0, 192, 0, 0, 194, 6, 134, 0, 0, 0, 192, 0, 68, 0, 36, 0, 33, 0, 161, 0, 0, 0, 160, 0, 0, 0, 0, 160, 0, 132, 0, 130, 0, 134, 0, 0, 0];
    const step = wWing.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('w-wing');
    expect(step!.eliminations).toContainEqual({ cell: 13, digit: 9 });
  });
});
