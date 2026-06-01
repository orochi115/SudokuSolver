import { afterEach, describe, expect, it } from 'vitest';
import { resetStrategyOptions, setStrategyOptions } from '../src/strategy-options.js';
import { sueDeCoq } from '../src/strategies/sue-de-coq.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('sue-de-coq strategy', () => {
  afterEach(() => {
    resetStrategyOptions();
  });

  it('eliminates on both line side and box side', () => {
    setStrategyOptions({ enableSueDeCoq: true });

    const grid = makeCandidateGrid({
      0: [1, 2],
      1: [3, 4],
      3: [1, 5],
      9: [3, 6],
      4: [1, 7],
      10: [3, 8],
    });

    const step = sueDeCoq.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('sue-de-coq');
    expect(step!.eliminations).toEqual([
      { cell: 4, digit: 1 },
      { cell: 10, digit: 3 },
    ]);
  });
});
