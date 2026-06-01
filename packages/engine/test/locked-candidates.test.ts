import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';

describe('locked-candidates', () => {
  it('returns null or a valid step without crashing on empty grid', () => {
    const g = Grid.fromString('0'.repeat(81));
    const step = lockedCandidates.apply(g);
    expect(step === null || Array.isArray(step.eliminations)).toBe(true);
  });
});
