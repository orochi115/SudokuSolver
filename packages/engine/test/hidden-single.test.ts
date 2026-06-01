import { describe, expect, it } from 'vitest';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('hidden-single strategy', () => {
  it('places a digit that appears in only one cell of a house', () => {
    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [1, 3],
      2: [2, 3],
      3: [1, 2, 3],
      4: [1, 2, 3],
      5: [1, 2, 3],
      6: [1, 2, 3],
      7: [1, 2, 3],
      8: [4],
    });

    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements).toEqual([{ cell: 8, digit: 4 }]);
  });
});
