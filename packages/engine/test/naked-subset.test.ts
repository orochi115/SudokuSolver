import { describe, expect, it } from 'vitest';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('naked-subset strategy', () => {
  it('eliminates candidates outside a naked pair', () => {
    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [1, 2],
      2: [1, 2, 3],
      3: [3, 4],
      4: [4, 5],
      5: [5, 6],
      6: [6, 7],
      7: [7, 8],
      8: [8, 9],
    });

    const step = nakedSubset.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('naked-subset');
    expect(step!.eliminations).toEqual([
      { cell: 2, digit: 1 },
      { cell: 2, digit: 2 },
    ]);
  });
});
