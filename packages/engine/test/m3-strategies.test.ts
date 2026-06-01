import { describe, expect, it } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { aic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { sueDeCoq } from '../src/strategies/sue-de-coq.js';
import { uniqueness } from '../src/strategies/uniqueness.js';

function mask(...digits: number[]): number {
  return digits.reduce((m, d) => m | maskOf(d), 0);
}

function candidateGrid(entries: Array<[cell: number, digits: number[]]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const [cell, digits] of entries) grid.candidates[cell] = mask(...digits);
  return grid;
}

describe('M3 strategy registry', () => {
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
      'simple-coloring',
      'aic',
      'als',
      'uniqueness',
      'sue-de-coq',
      'forcing-chain',
    ]);
    expect(STRATEGIES.map((s) => s.difficulty)).toEqual([...STRATEGIES].map((s) => s.difficulty).sort((a, b) => a - b));
  });
});

describe('M3 advanced strategies', () => {
  it('simple-coloring eliminates a wrapped color from a conjugate graph', () => {
    const grid = candidateGrid([
      [0, [5, 6]],
      [1, [5, 7]],
      [9, [5, 9]],
      [10, [5, 8]],
    ]);
    const step = simpleColoring.apply(grid)!;
    expect(step.strategyId).toBe('simple-coloring');
    expect(step.eliminations).toEqual([
      { cell: 0, digit: 5 },
      { cell: 10, digit: 5 },
    ]);
    expect(step.highlights.links.map((link) => link.type).every((type) => type === 'strong')).toBe(true);
  });

  it('aic eliminates from a cell that sees both same-digit chain endpoints', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [2, 3]],
      [10, [1, 3]],
      [9, [1, 4]],
    ]);
    const step = aic.apply(grid)!;
    expect(step.strategyId).toBe('aic');
    expect(step.eliminations).toEqual([{ cell: 9, digit: 1 }]);
    expect(step.highlights.links.map((link) => link.type)).toEqual(['strong', 'weak', 'strong', 'weak', 'strong']);
  });

  it('als applies ALS-XZ with one restricted common candidate', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [1, 3]],
      [2, [3, 5]],
      [9, [2, 4]],
      [10, [3, 4]],
    ]);
    const step = als.apply(grid)!;
    expect(step.strategyId).toBe('als');
    expect(step.eliminations).toEqual([{ cell: 2, digit: 3 }]);
  });

  it('uniqueness applies a Unique Rectangle type 1 elimination', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [3, [1, 2]],
      [9, [1, 2]],
      [12, [1, 2, 3]],
    ]);
    const step = uniqueness.apply(grid)!;
    expect(step.strategyId).toBe('uniqueness');
    expect(step.eliminations).toEqual([
      { cell: 12, digit: 1 },
      { cell: 12, digit: 2 },
    ]);
  });

  it('sue-de-coq removes locked union digits from the row and box remainders', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [1, 3]],
      [9, [2, 4]],
      [10, [3, 4]],
      [3, [1, 5]],
      [11, [4, 5]],
    ]);
    const step = sueDeCoq.apply(grid)!;
    expect(step.strategyId).toBe('sue-de-coq');
    expect(step.eliminations).toEqual([
      { cell: 3, digit: 1 },
      { cell: 11, digit: 4 },
    ]);
  });

  it('forcing-chain eliminates a candidate whose single assumption immediately contradicts candidates', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [1]],
    ]);
    const step = forcingChain.apply(grid)!;
    expect(step.strategyId).toBe('forcing-chain');
    expect(step.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step.highlights.links).toEqual([{ from: { cell: 0, digit: 1 }, to: { cell: 1, digit: 1 }, type: 'weak' }]);
  });

  it('forcing-chain records a multi-step propagation path', () => {
    const grid = candidateGrid([
      [0, [1, 2]],
      [1, [1, 3]],
      [2, [3]],
    ]);
    const step = forcingChain.apply(grid)!;
    expect(step.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step.highlights.links.map((link) => link.type)).toEqual(['weak', 'strong', 'weak']);
  });
});
