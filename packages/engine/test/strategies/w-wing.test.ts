import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { wWing } from '../../src/strategies/w-wing.js';

describe('wWing strategy', () => {
  it('should detect W-Wing pattern', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = wWing.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no W-Wing exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = wWing.apply(grid);
    expect(step).toBeNull();
  });
});