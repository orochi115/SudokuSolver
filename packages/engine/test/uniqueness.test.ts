import { afterEach, describe, expect, it } from 'vitest';
import { resetStrategyOptions, setStrategyOptions } from '../src/strategy-options.js';
import { uniqueness } from '../src/strategies/uniqueness.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('uniqueness strategy', () => {
  afterEach(() => {
    resetStrategyOptions();
  });

  it('applies unique rectangle type 1 when enabled', () => {
    setStrategyOptions({ enableUniqueness: true });
    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [1, 2],
      9: [1, 2],
      10: [1, 2, 3],
    });

    const step = uniqueness.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('uniqueness');
    expect(step!.eliminations).toEqual([
      { cell: 10, digit: 1 },
      { cell: 10, digit: 2 },
    ]);
  });

  it('is disabled by default', () => {
    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [1, 2],
      9: [1, 2],
      10: [1, 2, 3],
    });
    expect(uniqueness.apply(grid)).toBeNull();
  });
});
