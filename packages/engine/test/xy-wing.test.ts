import { describe, expect, it } from 'vitest';
import { xyWing } from '../src/strategies/xy-wing.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('xy-wing strategy', () => {
  it('eliminates the hinge candidate seen by both pincers', () => {
    const grid = makeCandidateGrid({
      40: [1, 2],
      13: [1, 3],
      39: [2, 3],
      12: [3, 4],
    });

    const step = xyWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xy-wing');
    expect(step!.eliminations).toEqual([{ cell: 12, digit: 3 }]);
  });
});
