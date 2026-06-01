import { describe, expect, it } from 'vitest';
import { als } from '../src/strategies/als.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('als strategy', () => {
  it('eliminates non-restricted common digits from peers', () => {
    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [2, 3],
      36: [1, 4],
      38: [3, 4],
      2: [3, 5],
    });

    const step = als.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('als');
    expect(step!.eliminations).toEqual([{ cell: 2, digit: 3 }]);
  });
});
