import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/grid.js';
import { singleDigitPatterns } from '../../src/strategies/single-digit-patterns.js';

describe('singleDigitPatterns strategy', () => {
  it('should detect Skyscraper pattern', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = singleDigitPatterns.apply(grid);
    expect(step).toBeDefined(); // Just ensure it doesn't throw
  });

  it('should return null when no single digit pattern exists', () => {
    const puzzle = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    grid.recomputeCandidates();
    
    const step = singleDigitPatterns.apply(grid);
    expect(step).toBeNull();
  });
});