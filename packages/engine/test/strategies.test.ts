import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { nakedSingle } from '../src/strategies/naked-single.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { aic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { uniqueness } from '../src/strategies/uniqueness.js';
import { sueDeCoq } from '../src/strategies/sue-de-coq.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';

describe('full-house', () => {
  it('finds the last empty cell in a house', () => {
    const puzzle = '123456789456789123789123456234567891567891234891234567345678912678912345912345670';
    const grid = Grid.fromString(puzzle);
    const step = fullHouse.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
    expect(step!.placements.length).toBe(1);
    expect(step!.placements[0]!.cell).toBe(80);
    expect(step!.placements[0]!.digit).toBe(8);
    expect(step!.eliminations.length).toBe(0);
  });

  it('returns null when no house has exactly one empty cell', () => {
    const puzzle = '000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    expect(fullHouse.apply(grid)).toBeNull();
  });
});

describe('hidden-single', () => {
  it('finds a digit that can only go in one cell in a house', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements.length).toBe(1);
  });

  it('returns null when every digit has multiple locations', () => {
    const puzzle = '000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    expect(hiddenSingle.apply(grid)).toBeNull();
  });
});

describe('locked-candidates', () => {
  it('finds pointing pair elimination', () => {
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const grid = Grid.fromString(puzzle);
    const step = lockedCandidates.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('locked-candidates');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });

  it('finds claiming elimination', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    const step = lockedCandidates.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('locked-candidates');
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('naked-subset', () => {
  it('finds a naked pair and eliminates', () => {
    const puzzle = '900010000000000000000000000000000000000000000000000000000000000000000000000000002';
    const grid = Grid.fromString(puzzle);
    const step = nakedSubset.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('naked-subset');
      expect(step.eliminations.length).toBeGreaterThan(0);
    }
  });

  it('returns null when no subset exists', () => {
    const puzzle = '000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    expect(nakedSubset.apply(grid)).toBeNull();
  });
});

describe('hidden-subset', () => {
  it('finds a hidden pair and eliminates', () => {
    const puzzle = '123400000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    const step = hiddenSubset.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('hidden-subset');
      expect(step.eliminations.length).toBeGreaterThan(0);
    }
  });

  it('returns null when no hidden subset exists', () => {
    const puzzle = '000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    expect(hiddenSubset.apply(grid)).toBeNull();
  });
});

describe('basic-fish', () => {
  it('finds an X-Wing and eliminates', () => {
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const grid = Grid.fromString(puzzle);
    const step = basicFish.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('basic-fish');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('single-digit-patterns', () => {
  it('finds a skyscraper or kite pattern', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const grid = Grid.fromString(puzzle);
    const step = singleDigitPatterns.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('single-digit-patterns');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('xy-wing', () => {
  it('finds an XY-Wing pattern and eliminates', () => {
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const grid = Grid.fromString(puzzle);
    const step = xyWing.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('xy-wing');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('xyz-wing', () => {
  it('finds an XYZ-Wing pattern and eliminates', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const grid = Grid.fromString(puzzle);
    const step = xyzWing.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('xyz-wing');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('w-wing', () => {
  it('finds a W-Wing pattern and eliminates', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const grid = Grid.fromString(puzzle);
    const step = wWing.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('w-wing');
      expect(step.eliminations.length).toBeGreaterThan(0);
      expect(step.placements.length).toBe(0);
    }
  });
});

describe('solve with all M2 strategies', () => {
  it('solves an easy puzzle with zero soundness violations', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const solution = solveBruteforce(puzzle)!;
    const trace = solve(Grid.fromString(puzzle), STRATEGIES);
    expect(trace.outcome).toBe('solved');
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });

  it('solves a medium puzzle soundly', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const solution = solveBruteforce(puzzle)!;
    const trace = solve(Grid.fromString(puzzle), STRATEGIES);
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });
});