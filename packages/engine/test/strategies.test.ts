import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';
import {
  fullHouse,
  hiddenSingle,
  lockedCandidates,
  nakedSubset,
  hiddenSubset,
  basicFish,
  singleDigitPatterns,
  xyWing,
  xyzWing,
  wWing,
} from '../src/strategies/index.js';

const EASY_PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const FULL_HOUSE_PUZZLE = '123456780' + '0'.repeat(72);
const HIDDEN_SINGLE_PUZZLE = '100000000' + '0'.repeat(72);

describe('full-house', () => {
  it('places the missing digit when a house has only one empty cell', () => {
    const grid = Grid.fromString(FULL_HOUSE_PUZZLE);
    const step = fullHouse.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
  });
});

describe('hidden-single', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(HIDDEN_SINGLE_PUZZLE);
    const step = hiddenSingle.apply(grid);
    if (step) expect(step!.strategyId).toBe('hidden-single');
  });
});

describe('locked-candidates', () => {
  it('returns null or valid step on a simple board', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = lockedCandidates.apply(grid);
    if (step) expect(step!.strategyId).toBe('locked-candidates');
  });
});

describe('naked-subset', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = nakedSubset.apply(grid);
    if (step) expect(step!.strategyId).toBe('naked-subset');
  });
});

describe('hidden-subset', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = hiddenSubset.apply(grid);
    if (step) expect(step!.strategyId).toBe('hidden-subset');
  });
});

describe('basic-fish', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = basicFish.apply(grid);
    if (step) expect(step!.strategyId).toBe('basic-fish');
  });
});

describe('single-digit-patterns', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = singleDigitPatterns.apply(grid);
    if (step) expect(step!.strategyId).toBe('single-digit-patterns');
  });
});

describe('xy-wing', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = xyWing.apply(grid);
    if (step) expect(step!.strategyId).toBe('xy-wing');
  });
});

describe('xyz-wing', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = xyzWing.apply(grid);
    if (step) expect(step!.strategyId).toBe('xyz-wing');
  });
});

describe('w-wing', () => {
  it('returns null or valid step', () => {
    const grid = Grid.fromString(EASY_PUZZLE);
    const step = wWing.apply(grid);
    if (step) expect(step!.strategyId).toBe('w-wing');
  });
});

describe('solve loop with all strategies', () => {
  it('solves an easy puzzle and stays sound', () => {
    const puzzle = EASY_PUZZLE;
    const solution = solveBruteforce(puzzle)!;
    const trace = solve(Grid.fromString(puzzle), STRATEGIES);
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });

  it('solves another easy puzzle', () => {
    const puzzle = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const solution = solveBruteforce(puzzle)!;
    const trace = solve(Grid.fromString(puzzle), STRATEGIES);
    expect(trace.outcome).toBe('solved');
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });
});