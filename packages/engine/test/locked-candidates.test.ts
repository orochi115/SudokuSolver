import { describe, expect, it } from 'vitest';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('locked-candidates strategy', () => {
  it('eliminates by pointing from box to row', () => {
    const grid = makeCandidateGrid({
      0: [5, 1],
      1: [5, 2],
      9: [1, 2],
      10: [2, 3],
      11: [3, 4],
      3: [5, 7],
    });

    const step = lockedCandidates.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('locked-candidates');
    expect(step!.placements).toEqual([]);
    expect(step!.eliminations).toEqual([{ cell: 3, digit: 5 }]);
  });
});
