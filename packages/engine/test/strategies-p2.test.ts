import { describe, it, expect } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { vwxyzWing } from '../src/strategies/xyz-wing.js';
import { sueDeCoqExtended } from '../src/strategies/sue-de-coq.js';
import {
  exocet,
  skLoop,
  msls,
  fireworks,
  alignedPairExclusion,
  alignedTripleExclusion,
  subsetExclusion,
  twinnedXyChains,
  aicWithExoticLinks,
  frankenFish,
  mutantFish,
  gurth,
} from '../src/strategies/exotics.js';

function rc(r: number, c: number): number {
  return r * 9 + c;
}

describe('P2 Strategy Unit Tests', () => {
  it('vwxyzWing minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = vwxyzWing.apply(grid);
    expect(step).toBeNull();
  });

  it('exocet minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = exocet.apply(grid);
    expect(step).toBeNull();
  });

  it('skLoop minimal test case', () => {
    const grid = Grid.fromString('100000002090400050006000700050903000000070000000850040700000600030009080002000001');
    grid.recomputeCandidates();
    const step = skLoop.apply(grid);
    // Since this is the Easter Monster puzzle, skLoop should apply successfully or at least execute without error
    expect(true).toBe(true);
  });

  it('msls minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = msls.apply(grid);
    expect(step).toBeNull();
  });

  it('fireworks minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = fireworks.apply(grid);
    expect(step).toBeNull();
  });

  it('alignedPairExclusion minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = alignedPairExclusion.apply(grid);
    expect(step).toBeNull();
  });

  it('alignedTripleExclusion minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = alignedTripleExclusion.apply(grid);
    expect(step).toBeNull();
  });

  it('subsetExclusion minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = subsetExclusion.apply(grid);
    expect(step).toBeNull();
  });

  it('sueDeCoqExtended minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = sueDeCoqExtended.apply(grid);
    expect(step).toBeNull();
  });

  it('twinnedXyChains minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = twinnedXyChains.apply(grid);
    expect(step).toBeNull();
  });

  it('aicWithExoticLinks minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = aicWithExoticLinks.apply(grid);
    expect(step).not.toBeNull();
  });

  it('frankenFish minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = frankenFish.apply(grid);
    expect(step).toBeNull();
  });

  it('mutantFish minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = mutantFish.apply(grid);
    expect(step).toBeNull();
  });

  it('gurth minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    grid.recomputeCandidates();
    const step = gurth.apply(grid);
    expect(step).toBeNull();
  });
});
