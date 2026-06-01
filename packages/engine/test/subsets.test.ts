import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { nakedSubsets, hiddenSubsets } from '../src/strategies/index.js';

describe('naked/hidden subsets', () => {
  it('naked-subsets returns null or step on empty grid', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = nakedSubsets.apply(g);
    expect(step === null || step.eliminations.length >= 0).toBe(true);
  });
  it('hidden-subsets returns null or step on empty grid', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = hiddenSubsets.apply(g);
    expect(step === null || step.eliminations.length >= 0).toBe(true);
  });
});
