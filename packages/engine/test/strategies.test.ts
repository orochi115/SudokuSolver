import { describe, it, expect } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { pointing } from '../src/strategies/pointing.js';
import { claiming } from '../src/strategies/claiming.js';
import { nakedPair, nakedTriple, nakedQuad } from '../src/strategies/naked-subset.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from '../src/strategies/hidden-subset.js';
import { xWing, swordfish, jellyfish } from '../src/strategies/fish.js';
import { skyscraper } from '../src/strategies/skyscraper.js';
import { twoStringKite } from '../src/strategies/two-string-kite.js';
import { emptyRectangle } from '../src/strategies/empty-rectangle.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

describe('human strategy unit tests', () => {
  it('fullHouse identifies the last remaining cell in a house', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    for (let i = 0; i < 8; i++) {
      grid.values[i] = i + 1;
    }
    grid.candidates[8] = maskOf(9);

    const step = fullHouse.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
    expect(step!.placements).toEqual([{ cell: 8, digit: 9 }]);
  });

  it('hiddenSingle identifies a digit with only one placement in a house', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(9) | maskOf(2) | maskOf(3);
    for (let i = 1; i < 9; i++) {
      grid.candidates[i] = maskOf(2) | maskOf(3);
    }

    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements).toEqual([{ cell: 0, digit: 9 }]);
  });

  it('pointing eliminates candidates aligned in a box along a line', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    // Box 0, cells 0, 1 contain candidate 9
    grid.candidates[0] = maskOf(9);
    grid.candidates[1] = maskOf(9);
    // Peer cell in Row 1 has candidate 9
    grid.candidates[3] = maskOf(9) | maskOf(4);

    const step = pointing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('pointing');
    expect(step!.eliminations).toEqual([{ cell: 3, digit: 9 }]);
  });

  it('claiming eliminates candidates confined inside a box from a line', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    // Row 1 has candidate 9 only in Box 0 at cells 0, 1
    grid.candidates[0] = maskOf(9);
    grid.candidates[1] = maskOf(9);
    // Another cell in Box 0 has candidate 9
    grid.candidates[9] = maskOf(9) | maskOf(5);

    const step = claiming.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('claiming');
    expect(step!.eliminations).toEqual([{ cell: 9, digit: 9 }]);
  });

  it('nakedPair eliminates subset candidate values from other cells in a house', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3);
    grid.candidates[1] = maskOf(2) | maskOf(3);
    grid.candidates[2] = maskOf(2) | maskOf(4);
    grid.candidates[3] = maskOf(3) | maskOf(5);

    const step = nakedPair.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('naked-pair');
    expect(step!.eliminations).toEqual([
      { cell: 2, digit: 2 },
      { cell: 3, digit: 3 },
    ]);
  });

  it('hiddenPair restricts candidates inside subset cells', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3) | maskOf(4) | maskOf(5);
    grid.candidates[1] = maskOf(2) | maskOf(3) | maskOf(6) | maskOf(7);
    grid.candidates[2] = maskOf(4) | maskOf(5);
    grid.candidates[3] = maskOf(6) | maskOf(7);

    const step = hiddenPair.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-pair');
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 4 },
      { cell: 0, digit: 5 },
      { cell: 1, digit: 6 },
      { cell: 1, digit: 7 },
    ]);
  });

  it('nakedTriple eliminates candidates in row', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3);
    grid.candidates[1] = maskOf(3) | maskOf(4);
    grid.candidates[2] = maskOf(2) | maskOf(4);
    grid.candidates[3] = maskOf(2) | maskOf(5);

    const step = nakedTriple.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('naked-triple');
    expect(step!.eliminations).toEqual([{ cell: 3, digit: 2 }]);
  });

  it('hiddenTriple eliminates non-subset candidates in row', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3) | maskOf(8);
    grid.candidates[1] = maskOf(3) | maskOf(4) | maskOf(8);
    grid.candidates[2] = maskOf(2) | maskOf(4) | maskOf(8);
    grid.candidates[3] = maskOf(8) | maskOf(5); // Other cells must not contain 2, 3, or 4

    const step = hiddenTriple.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-triple');
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 8 },
      { cell: 1, digit: 8 },
      { cell: 2, digit: 8 },
    ]);
  });

  it('xWing eliminates candidate outside base rows', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[1] = maskOf(9);
    grid.candidates[5] = maskOf(9);
    grid.candidates[37] = maskOf(9);
    grid.candidates[41] = maskOf(9);
    grid.candidates[19] = maskOf(9) | maskOf(4);

    const step = xWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('x-wing');
    expect(step!.eliminations).toEqual([{ cell: 19, digit: 9 }]);
  });

  it('skyscraper eliminates candidate seeing both tops', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[1] = maskOf(9); // base
    grid.candidates[2] = maskOf(9); // base
    grid.candidates[10] = maskOf(9); // top 1
    grid.candidates[20] = maskOf(9); // top 2
    grid.candidates[9] = maskOf(9) | maskOf(4); // elimination cell

    const step = skyscraper.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('skyscraper');
    expect(step!.eliminations).toEqual([{ cell: 9, digit: 9 }]);
  });

  it('twoStringKite eliminates candidate at intersection', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[1] = maskOf(9);
    grid.candidates[8] = maskOf(9);
    grid.candidates[11] = maskOf(9);
    grid.candidates[74] = maskOf(9);
    grid.candidates[80] = maskOf(9) | maskOf(5);

    const step = twoStringKite.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('two-string-kite');
    expect(step!.eliminations).toEqual([{ cell: 80, digit: 9 }]);
  });

  it('emptyRectangle eliminates candidate at external intersection', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[1] = maskOf(9);
    grid.candidates[2] = maskOf(9);
    grid.candidates[20] = maskOf(9);
    grid.candidates[5] = maskOf(9);
    grid.candidates[77] = maskOf(9);
    grid.candidates[74] = maskOf(9) | maskOf(5);

    const step = emptyRectangle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('empty-rectangle');
    expect(step!.eliminations).toEqual([{ cell: 74, digit: 9 }]);
  });

  it('xyWing eliminates candidate seeing both pincers', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3);
    grid.candidates[1] = maskOf(2) | maskOf(4);
    grid.candidates[9] = maskOf(3) | maskOf(4);
    grid.candidates[10] = maskOf(4) | maskOf(5);

    const step = xyWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xy-wing');
    expect(step!.eliminations).toEqual([{ cell: 10, digit: 4 }]);
  });

  it('xyzWing eliminates candidate seeing pivot and both pincers', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3) | maskOf(4);
    grid.candidates[1] = maskOf(2) | maskOf(4);
    grid.candidates[9] = maskOf(3) | maskOf(4);
    grid.candidates[10] = maskOf(4) | maskOf(5);

    const step = xyzWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xyz-wing');
    expect(step!.eliminations).toEqual([{ cell: 10, digit: 4 }]);
  });

  it('wWing eliminates candidate bridged by external strong link', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.candidates.fill(0);
    grid.candidates[0] = maskOf(2) | maskOf(3);
    grid.candidates[80] = maskOf(2) | maskOf(3);
    grid.candidates[4] = maskOf(2);
    grid.candidates[76] = maskOf(2);
    grid.candidates[72] = maskOf(3) | maskOf(5);

    const step = wWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('w-wing');
    expect(step!.eliminations).toEqual([{ cell: 72, digit: 3 }]);
  });
});
