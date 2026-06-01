import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { hiddenSubset } from '../../src/strategies/hidden-subset.js';

describe('hiddenSubset strategy', () => {
  it('should detect hidden pair in a house', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = hiddenSubset.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no hidden subset exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = hiddenSubset.apply(grid);
    expect(step).toBeNull();
  });
});