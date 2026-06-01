import { describe, expect, it } from 'vitest';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('xyz-wing strategy', () => {
  it('eliminates the common candidate seen by pivot and both pincers', () => {
    const grid = makeCandidateGrid({
      40: [1, 2, 3],
      13: [1, 3],
      39: [2, 3],
      31: [3, 4],
    });

    const step = xyzWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xyz-wing');
    expect(step!.eliminations).toEqual([{ cell: 31, digit: 3 }]);
  });
});
