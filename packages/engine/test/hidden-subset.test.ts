import { describe, expect, it } from 'vitest';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('hidden-subset strategy', () => {
  it('eliminates extras from a hidden pair', () => {
    const grid = makeCandidateGrid({
      0: [1, 2, 3],
      1: [1, 2, 4],
      2: [3, 4],
      3: [3, 5],
      4: [4, 5],
      5: [5, 6],
      6: [6, 7],
      7: [7, 8],
      8: [8, 9],
    });

    const step = hiddenSubset.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-subset');
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 3 },
      { cell: 1, digit: 4 },
    ]);
  });
});
