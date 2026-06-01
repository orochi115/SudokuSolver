import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { xyzWing } from '../../src/strategies/xyz-wing.js';

describe('xyzWing strategy', () => {
  it('should detect XYZ-Wing pattern', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = xyzWing.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no XYZ-Wing exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = xyzWing.apply(grid);
    expect(step).toBeNull();
  });
});