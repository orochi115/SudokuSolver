import { describe, expect, it } from 'vitest';
import { basicFish } from '../src/strategies/basic-fish.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('basic-fish strategy', () => {
  it('finds an X-Wing elimination', () => {
    const grid = makeCandidateGrid({
      1: [9],
      5: [9],
      28: [9],
      32: [9],
      55: [9],
      68: [9],
    });

    const step = basicFish.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('basic-fish');
    expect(step!.eliminations).toEqual([
      { cell: 55, digit: 9 },
      { cell: 68, digit: 9 },
    ]);
  });
});
