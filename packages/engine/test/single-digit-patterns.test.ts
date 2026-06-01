import { describe, expect, it } from 'vitest';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('single-digit-patterns strategy', () => {
  it('finds a Skyscraper elimination', () => {
    const grid = makeCandidateGrid({
      1: [6],
      3: [6],
      37: [6],
      40: [6],
      13: [6],
    });

    const step = singleDigitPatterns.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('single-digit-patterns');
    expect(step!.eliminations).toEqual([{ cell: 13, digit: 6 }]);
  });
});
