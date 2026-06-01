import { describe, it, expect } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

function mask(...digits: number[]): number {
  return digits.reduce((m, d) => m | maskOf(d), 0);
}

function candidateGrid(entries: Array<[cell: number, digits: number[]]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const [cell, digits] of entries) grid.candidates[cell] = mask(...digits);
  return grid;
}

describe('M2 strategy registry', () => {
  it('registers every required strategy id in ascending difficulty', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual([
      'full-house',
      'naked-single',
      'hidden-single',
      'locked-candidates',
      'naked-subset',
      'hidden-subset',
      'basic-fish',
      'single-digit-patterns',
      'xy-wing',
      'xyz-wing',
      'w-wing',
    ]);
    expect(STRATEGIES.map((s) => s.difficulty)).toEqual([...STRATEGIES].map((s) => s.difficulty).sort((a, b) => a - b));
  });
});

describe('T1 singles', () => {
  it('full-house places the last missing digit in a house', () => {
    const grid = Grid.fromString(`${'123456780'}${'0'.repeat(72)}`);
    const step = fullHouse.apply(grid)!;
    expect(step.strategyId).toBe('full-house');
    expect(step.placements).toEqual([{ cell: 8, digit: 9 }]);
    expect(step.eliminations).toEqual([]);
    expect(step.highlights.cells).toContain(8);
    expect(step.explanation.zh).toContain('全屋唯一');
    expect(grid.get(8)).toBe(0);
  });

  it('hidden-single places a digit that appears once in a house', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [2, 3]],
      [2, [3, 4]],
    ]);
    const step = hiddenSingle.apply(grid)!;
    expect(step.strategyId).toBe('hidden-single');
    expect(step.placements).toEqual([{ cell: 0, digit: 1 }]);
    expect(step.eliminations).toEqual([]);
    expect(step.highlights.candidates).toEqual([{ cell: 0, digit: 1 }]);
  });
});

describe('T2 intersections and subsets', () => {
  it('locked-candidates eliminates a pointing candidate from the rest of the line', () => {
    const grid = candidateGrid([
      [0, [5]],
      [1, [5]],
      [3, [5]],
    ]);
    const step = lockedCandidates.apply(grid)!;
    expect(step.strategyId).toBe('locked-candidates');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([{ cell: 3, digit: 5 }]);
    expect(step.highlights.cells).toEqual(expect.arrayContaining([0, 1]));
  });

  it('naked-subset eliminates pair digits from other cells in the house', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [1, 2]],
      [2, [1, 2, 3]],
    ]);
    const step = nakedSubset.apply(grid)!;
    expect(step.strategyId).toBe('naked-subset');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([
      { cell: 2, digit: 1 },
      { cell: 2, digit: 2 },
    ]);
  });

  it('hidden-subset removes non-subset digits from hidden pair cells', () => {
    const grid = candidateGrid([
      [0, [1, 2, 3]],
      [1, [1, 2, 4]],
      [2, [3, 4, 5]],
    ]);
    const step = hiddenSubset.apply(grid)!;
    expect(step.strategyId).toBe('hidden-subset');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([
      { cell: 0, digit: 3 },
      { cell: 1, digit: 4 },
    ]);
  });
});

describe('T3 fish, single-digit patterns, and wings', () => {
  it('basic-fish finds an X-Wing as a size-2 base/cover fish', () => {
    const grid = candidateGrid([
      [0, [7]],
      [2, [7]],
      [9, [7]],
      [11, [7]],
      [18, [7]],
      [20, [7]],
    ]);
    const step = basicFish.apply(grid)!;
    expect(step.strategyId).toBe('basic-fish');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([
      { cell: 18, digit: 7 },
      { cell: 20, digit: 7 },
    ]);
  });

  it('single-digit-patterns eliminates from a short two-strong-link pattern', () => {
    const grid = candidateGrid([
      [0, [5]],
      [1, [5]],
      [9, [5]],
      [10, [5]],
      [2, [5, 6]],
    ]);
    const step = singleDigitPatterns.apply(grid)!;
    expect(step.strategyId).toBe('single-digit-patterns');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([{ cell: 2, digit: 5 }]);
    expect(step.highlights.links.map((l) => l.type)).toEqual(['strong', 'weak', 'strong']);
  });

  it('xy-wing eliminates the shared wing digit from cells seeing both pincers', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [9, [1, 3]],
      [1, [2, 3]],
      [10, [3]],
    ]);
    const step = xyWing.apply(grid)!;
    expect(step.strategyId).toBe('xy-wing');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([{ cell: 10, digit: 3 }]);
    expect(step.highlights.candidates).not.toContainEqual({ cell: 0, digit: 3 });
  });

  it('xyz-wing eliminates the shared digit from cells seeing pivot and both pincers', () => {
    const grid = candidateGrid([
      [0, [1, 2, 3]],
      [9, [1, 3]],
      [1, [2, 3]],
      [10, [3]],
    ]);
    const step = xyzWing.apply(grid)!;
    expect(step.strategyId).toBe('xyz-wing');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([{ cell: 10, digit: 3 }]);
  });

  it('w-wing eliminates the other pair digit through a bridged strong link', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [10, [1, 2]],
      [1, [1]],
      [2, [1]],
      [9, [2]],
    ]);
    const step = wWing.apply(grid)!;
    expect(step.strategyId).toBe('w-wing');
    expect(step.placements).toEqual([]);
    expect(step.eliminations).toEqual([{ cell: 9, digit: 2 }]);
  });
});
