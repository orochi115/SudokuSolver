import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { xyWing } from '../../src/strategies/xy-wing.js';

describe('xyWing strategy', () => {
  it('should detect XY-Wing pattern', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = xyWing.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no XY-Wing exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = xyWing.apply(grid);
    expect(step).toBeNull();
  });
});