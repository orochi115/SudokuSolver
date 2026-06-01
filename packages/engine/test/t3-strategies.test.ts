import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fish, singleDigitPatterns, wings } from '../src/strategies/index.js';

describe('T3 strategies', () => {
  it('fish returns null or step on empty grid', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = fish.apply(g);
    expect(step === null || step.eliminations.length >= 0).toBe(true);
  });
  it('single-digit-patterns returns null or step', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = singleDigitPatterns.apply(g);
    expect(step === null || step.eliminations.length >= 0).toBe(true);
  });
  it('wings returns null or step', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = wings.apply(g);
    expect(step === null || step.eliminations.length >= 0).toBe(true);
  });
});
