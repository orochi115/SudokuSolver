import { describe, expect, it } from 'vitest';
import { aic } from '../src/strategies/aic.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('aic strategy', () => {
  it('finds a type-1 endpoint elimination', () => {
    const grid = makeCandidateGrid({
      0: [1],
      1: [1],
      9: [1, 2],
      10: [1, 2],
      11: [1],
    });

    const step = aic.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('aic');
    expect(step!.eliminations).toEqual([{ cell: 11, digit: 1 }]);
    expect(step!.highlights.links.length).toBeGreaterThanOrEqual(3);
  });
});
