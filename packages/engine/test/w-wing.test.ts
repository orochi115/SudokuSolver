import { describe, expect, it } from 'vitest';
import { wWing } from '../src/strategies/w-wing.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('w-wing strategy', () => {
  it('eliminates from common peers of twin bivalue cells', () => {
    const grid = makeCandidateGrid({
      0: [1, 2],
      20: [1, 2],
      1: [1, 4],
      19: [1, 5],
      10: [2, 6],
    });

    const step = wWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('w-wing');
    expect(step!.eliminations).toEqual([{ cell: 10, digit: 2 }]);
  });
});
