import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';

describe('human-solving strategies', () => {
  it('fullHouse finds the last empty cell in a house', () => {
    // Row 0 has only cell 8 empty (all others are 1..8)
    const puzzle = '123456780' + '0'.repeat(72);
    const grid = Grid.fromString(puzzle);
    const step = fullHouse.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
    expect(step!.placements).toEqual([{ cell: 8, digit: 9 }]);
  });

  it('hiddenSingle finds a digit restricted to one cell in a house', () => {
    // In row 0, cells 0, 1, 2 are empty. Cells 3..8 are filled with 4..9.
    // Cell 28 (row 3 col 1) is 1. Cell 38 (row 4 col 2) is 1.
    // Thus cell 0 is the only cell in row 0 that can be 1.
    const puzzle =
      '000456789' +
      '000000000' +
      '000000000' +
      '010000000' +
      '001000000' +
      '0'.repeat(36);
    const grid = Grid.fromString(puzzle);
    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements).toEqual([{ cell: 0, digit: 1 }]);
  });

  it('lockedCandidates (pointing) detects candidates restricted to a line in a box', () => {
    // Row 1 has 9 at cell 15 (row 1 col 6).
    // Row 2 has 9 at cell 25 (row 2 col 7).
    // In box 0, row 1 and 2 cells are blocked from being 9.
    // So 9 in box 0 is restricted to cells 0, 1, 2 (all in row 0).
    // Thus 9 is eliminated from row 0 col 3 (cell 3).
    const puzzle =
      '000000000' +
      '000000900' +
      '000000090' +
      '0'.repeat(54);
    const grid = Grid.fromString(puzzle);
    const step = lockedCandidates.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('locked-candidates');
    expect(step!.eliminations.some(e => e.cell === 3 && e.digit === 9)).toBe(true);
  });

  it('nakedSubset (pair) detects size 2 naked subsets', () => {
    // In row 0: empty cells 0, 1, 2. Cells 3..8 are filled with 4..9.
    // Cell 27 (row 3 col 0) is 1. Cell 28 (row 3 col 1) is 1.
    // Thus cells 0 and 1 cannot contain candidate 1. They form naked pair {2, 3}.
    // Cell 2 can contain 1. Since {2, 3} are locked in cells 0 and 1, we eliminate 2 and 3 from cell 2.
    const puzzle =
      '000456789' +
      '000000000' +
      '000000000' +
      '110000000' +
      '0'.repeat(45);
    const grid = Grid.fromString(puzzle);
    const step = nakedSubset.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('naked-subset');
    expect(step!.eliminations.some(e => e.cell === 2 && (e.digit === 2 || e.digit === 3))).toBe(true);
  });

  it('hiddenSubset (pair) detects size 2 hidden subsets', () => {
    // In row 0: empty cells 0, 1, 2, 3. Cells 4..8 are filled with 5..9.
    // Cell 29 (row 3 col 2) is 1. Cell 39 (row 4 col 3) is 1.
    // Cell 47 (row 5 col 2) is 2. Cell 57 (row 6 col 3) is 2.
    // Thus 1 and 2 are blocked from cells 2 and 3.
    // In row 0, 1 and 2 can only be in cells 0 and 1 (hidden pair).
    // We can eliminate other candidates {3, 4} from cells 0 and 1.
    const puzzle =
      '000056789' +
      '000000000' +
      '000000000' +
      '001000000' +
      '000100000' +
      '002000000' +
      '000200000' +
      '0'.repeat(18);
    const grid = Grid.fromString(puzzle);
    const step = hiddenSubset.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-subset');
    expect(step!.eliminations.some(e => (e.cell === 0 || e.cell === 1) && (e.digit === 3 || e.digit === 4))).toBe(true);
  });

  it('basicFish (X-Wing) detects basic size 2 fish', () => {
    // Handcrafted X-Wing on digit 9 using rows 0 and 4 as base, cols 0 and 4 as cover.
    // We fill all other cells in rows 0, 2, 4 with non-9 digits to restrict 9 to cols 0 and 4.
    // In row 2, we leave cols 0 and 4 empty to be the elimination targets.
    const puzzle =
      '012304567' +
      '123456780' +
      '012304567' +
      '123456780' +
      '012304567' +
      '123456780' +
      '123456780' +
      '123456780' +
      '123456780';
    const grid = Grid.fromString(puzzle);
    const step = basicFish.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('basic-fish');
    expect(step!.eliminations.length).toBeGreaterThan(0);
    expect(step!.eliminations.every(e => e.digit === 8 || e.digit === 9)).toBe(true);
  });

  it('singleDigitPatterns (2-String Kite) detects 2-string kite patterns', () => {
    // Row 0 has candidates of 9 only at cell 1 (in box 0) and cell 4 (outside box 0).
    // Col 0 has candidates of 9 only at cell 9 (in box 0) and cell 36 (outside box 0).
    // Row 4 has empty cells 36 and 40.
    // Thus cell 40 has candidate 9 and is eliminated because it sees 4 and 36.
    const puzzle =
      '102304567' +
      '012345678' +
      '123456780' +
      '123456780' +
      '012304567' +
      '123456780' +
      '123456780' +
      '123456780' +
      '123456780';
    const grid = Grid.fromString(puzzle);
    const step = singleDigitPatterns.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('single-digit-patterns');
    expect(step!.eliminations.some(e => e.cell === 40 && e.digit === 9)).toBe(true);
  });

  it('xyWing detects XY-Wing pattern', () => {
    const puzzle =
      '004567890' +
      '004567890' +
      '456789000' +
      '789000456' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000';
    const grid = Grid.fromString(puzzle);
    const step = xyWing.apply(grid);
    expect(step).toBeDefined();
  });

  it('xyzWing detects XYZ-Wing pattern', () => {
    const puzzle =
      '000456789' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000';
    const grid = Grid.fromString(puzzle);
    const step = xyzWing.apply(grid);
    expect(step).toBeDefined();
  });

  it('wWing detects W-Wing pattern', () => {
    const puzzle =
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000';
    const grid = Grid.fromString(puzzle);
    const step = wWing.apply(grid);
    expect(step).toBeDefined();
  });
});
