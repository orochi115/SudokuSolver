import { afterEach, describe, expect, it } from 'vitest';
import { resetStrategyOptions, setStrategyOptions } from '../src/strategy-options.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('forcing-chain strategy', () => {
  afterEach(() => {
    resetStrategyOptions();
  });

  it('eliminates a candidate when true-assumption contradicts itself', () => {
    setStrategyOptions({ forcingBoundary: { maxChainLength: 8, allowBranching: false } });

    const grid = makeCandidateGrid({
      0: [1],
      1: [1],
      10: [1],
    });

    const step = forcingChain.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('forcing-chain');
    expect(step!.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step!.highlights.links.length).toBeGreaterThanOrEqual(2);
  });
});
