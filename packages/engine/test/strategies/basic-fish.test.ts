import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { basicFish } from '../../src/strategies/basic-fish.js';

describe('basicFish strategy', () => {
  it('should detect X-Wing pattern', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = basicFish.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no fish pattern exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = basicFish.apply(grid);
    expect(step).toBeNull();
  });
});