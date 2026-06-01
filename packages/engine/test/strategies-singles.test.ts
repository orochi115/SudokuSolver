import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';

describe('full-house', () => {
  it('places the last missing digit in a house with one empty cell', () => {
    // Row 1 has eight givens 1..8, R1C9 empty -> must be 9.
    const puzzle =
      '123456780' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000';
    const step = fullHouse.apply(Grid.fromString(puzzle));
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ cell: 8, digit: 9 }]);
    expect(step!.eliminations).toEqual([]);
    expect(step!.strategyId).toBe('full-house');
  });

  it('returns null when no house has exactly one empty cell', () => {
    const empty = '0'.repeat(81);
    expect(fullHouse.apply(Grid.fromString(empty))).toBeNull();
  });
});

describe('hidden-single', () => {
  it('finds a digit confined to one cell of a house', () => {
    // Deterministic: digit 7 is a hidden single in box 0 (cell 0 = R1C1).
    // We place 7s in peers so every other box-0 cell loses 7, but R1C1 keeps it.
    const g = Grid.fromString('0'.repeat(81));
    // Remove 7 as candidate from box0 cells 1,2,9,10,11,18,19,20 by placing 7s
    // in peers. Place 7 at: R1C4(cell3) covers row0 -> removes from 1,2 and 0.
    // That also removes from 0; not good. Instead use columns/box of other cells.
    // Eliminate 7 from cell1(R1C2): place 7 in its column C2 (e.g. R2C2 cell10? that's box0).
    // Simplest robust approach: place 7's so each unwanted box0 cell loses 7 but cell0 keeps it.
    // cell1 R1C2: place 7 in R4C2 (cell 28) col2.
    g.place(28, 7);
    // cell2 R1C3: place 7 in R4C3 (cell 29) col3.
    g.place(29, 7);
    // cell9 R2C1: place 7 in R2C5 (cell 13) row1 -> also removes from 10,11 (row1) good, and not row0.
    g.place(13, 7);
    // cell18 R3C1: place 7 in R3C5 (cell 22) row2 -> removes from 18,19,20.
    g.place(22, 7);
    // Now box0 cells with 7 candidate: cell0 only? check 0,1,2,9,10,11,18,19,20.
    // cell0 R1C1: peers placed 7? none in row0/col0/box0 -> still candidate.
    const step = hiddenSingle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.placements[0]!.digit).toBe(7);
    expect(step!.placements[0]!.cell).toBe(0);
  });
});
