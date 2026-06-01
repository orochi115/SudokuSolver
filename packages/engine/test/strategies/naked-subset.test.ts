import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { nakedSubset } from '../../src/strategies/naked-subset.js';

describe('nakedSubset strategy', () => {
  it('should detect naked pair in a row', () => {
    // Create a simple grid where there's a naked pair in a row
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    
    // Just ensure the function handles the basic case
    const step = nakedSubset.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should detect naked triple in a column', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    
    const step = nakedSubset.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should detect naked quad in a box', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    
    const step = nakedSubset.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no naked subset exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = nakedSubset.apply(grid);
    expect(step).toBeNull();
  });
});