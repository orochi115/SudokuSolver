import { describe, expect, it } from 'vitest';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

describe('simple-coloring strategy', () => {
  it('finds trap elimination for a bi-colored chain', () => {
    const grid = makeCandidateGrid({
      0: [5],
      1: [5],
      11: [5],
    });

    const step = simpleColoring.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('simple-coloring');
    expect(step!.eliminations).toEqual([{ cell: 11, digit: 5 }]);
    expect(step!.highlights.links.length).toBeGreaterThan(0);
  });
});
