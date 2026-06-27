import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from '../src/strategies/finned-fish.js';
import { niceLoop, xyChain, turbotFish } from '../src/strategies/chain-specializations.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from '../src/strategies/uniqueness.js';

function rc(row: number, col: number): number {
  return (row - 1) * 9 + (col - 1);
}

function mask(...digits: number[]): number {
  return digits.reduce((m, d) => m | (1 << (d - 1)), 0);
}

function gridFromState(candidates: readonly number[]): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.set(candidates);
  return grid;
}

describe('P0 strategy registration', () => {
  it('registers every required P0 strategy id', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    for (const id of [
      'finned-x-wing',
      'finned-swordfish',
      'finned-jellyfish',
      'nice-loop',
      'xy-chain',
      'turbot-fish',
      'hidden-unique-rectangle',
      'unique-rectangle-type-3',
      'unique-rectangle-type-5',
      'unique-rectangle-type-6',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});

describe('P0 finned/sashimi fish', () => {
  it('finned-x-wing removes only candidates that see the fin', () => {
    const candidates = Array<number>(81).fill(0);
    for (const cell of [rc(1, 1), rc(1, 2), rc(1, 3), rc(2, 1), rc(2, 2), rc(3, 1)]) candidates[cell] = mask(9);
    const step = finnedXWing.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('finned-x-wing');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 1), digit: 9 }]);
  });

  it('finned-swordfish reports a size-3 finned fish under its strategy id', () => {
    const candidates = Array<number>(81).fill(0);
    for (const cell of [rc(1, 1), rc(1, 2), rc(1, 4), rc(2, 1), rc(2, 3), rc(3, 2), rc(3, 3), rc(4, 2)]) candidates[cell] = mask(9);
    const step = finnedSwordfish.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('finned-swordfish');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 2), digit: 9 }]);
  });

  it('finned-jellyfish removes only cover candidates that see the fin', () => {
    const candidates = Array<number>(81).fill(0);
    for (const cell of [rc(1, 1), rc(1, 2), rc(2, 1), rc(2, 3), rc(3, 2), rc(3, 4), rc(4, 1), rc(4, 4), rc(4, 5), rc(5, 5)]) {
      candidates[cell] = mask(9);
    }
    const step = finnedJellyfish.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('finned-jellyfish');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 2), digit: 9 }]);
  });
});

describe('P0 chain specializations', () => {
  it('xy-chain eliminates from cells seeing both equal end digits', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2);
    candidates[rc(1, 4)] = mask(2, 3);
    candidates[rc(2, 4)] = mask(1, 3);
    candidates[rc(2, 1)] = mask(1, 4);
    const step = xyChain.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('xy-chain');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 1), digit: 1 }]);
  });

  it('turbot-fish reports the generic single-digit strong-link chain under its strategy id', () => {
    const candidates = Array<number>(81).fill(0);
    for (const cell of [rc(1, 1), rc(4, 1), rc(4, 4), rc(2, 4), rc(1, 5)]) candidates[cell] = mask(1);
    const step = turbotFish.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('turbot-fish');
    expect(step?.eliminations).toEqual([{ cell: rc(4, 1), digit: 1 }]);
  });

  it('nice-loop reports a closed alternating loop elimination', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2);
    candidates[rc(1, 2)] = mask(2, 3);
    candidates[rc(2, 2)] = mask(1, 3);
    candidates[rc(2, 1)] = mask(1, 4);
    const step = niceLoop.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('nice-loop');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 1), digit: 1 }]);
  });
});

describe('P0 unique rectangle extensions', () => {
  it('unique-rectangle-type-3 uses the roof cells as a pseudo-cell locked set', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2);
    candidates[rc(2, 1)] = mask(1, 2);
    candidates[rc(1, 4)] = mask(1, 2, 3);
    candidates[rc(2, 4)] = mask(1, 2, 4);
    candidates[rc(1, 5)] = mask(3, 4);
    candidates[rc(1, 6)] = mask(3, 5);
    const step = uniqueRectangleType3.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('unique-rectangle-type-3');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 6), digit: 3 }]);
  });

  it('unique-rectangle-type-5 removes a diagonal extra digit from cells seeing all extra corners', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2, 3);
    candidates[rc(1, 4)] = mask(1, 2);
    candidates[rc(2, 1)] = mask(1, 2);
    candidates[rc(2, 4)] = mask(1, 2, 3);
    candidates[rc(1, 5)] = mask(3, 4);
    const step = uniqueRectangleType5.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('unique-rectangle-type-5');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 5), digit: 3 }]);
  });

  it('unique-rectangle-type-6 removes an X-Wing UR digit from diagonal roof cells', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2, 3);
    candidates[rc(1, 4)] = mask(1, 2);
    candidates[rc(2, 1)] = mask(1, 2);
    candidates[rc(2, 4)] = mask(1, 2, 4);
    const step = uniqueRectangleType6.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('unique-rectangle-type-6');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 1), digit: 1 }, { cell: rc(2, 4), digit: 1 }]);
  });

  it('hidden-unique-rectangle removes the opposite UR digit from the diagonal corner', () => {
    const candidates = Array<number>(81).fill(0);
    candidates[rc(1, 1)] = mask(1, 2);
    candidates[rc(1, 4)] = mask(1, 2, 3);
    candidates[rc(2, 1)] = mask(1, 2, 4);
    candidates[rc(2, 4)] = mask(1, 2, 5);
    const step = hiddenUniqueRectangle.apply(gridFromState(candidates));
    expect(step?.strategyId).toBe('hidden-unique-rectangle');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 4), digit: 2 }]);
  });

  it('does not emit unsound UR Type 3 pseudo-subsets with non-subset outside cells', () => {
    const puzzle = '005807300000604000000030000340000026008010500090000080000000000060502090200060004';
    const trace = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();
    const result = checkTraceSoundness(trace, solution!);
    expect(result.violations.filter((v) => v.strategyId === 'unique-rectangle-type-3')).toEqual([]);
  });
});
