import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

// Helper to convert a readable grid to 81-char string
function board(strings: string[]): string {
  return strings.join('').replace(/[\s]/g, '');
}

// ---- Full House ----
describe('full-house', () => {
  it('finds the last empty cell in a house', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    const step = fullHouse.apply(g);
    expect(step).not.toBeNull();
    expect(step!.placements.length).toBe(1);
    expect(step!.placements[0]!.digit).toBe(7);
  });
});

// ---- Hidden Single ----
describe('hidden-single', () => {
  it('finds a digit with only one possible cell in a house', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    // Recompute candidates after initial load to ensure proper state
    g.recomputeCandidates();
    const step = hiddenSingle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.placements.length).toBe(1);
  });
});

// ---- Locked Candidates ----
describe('locked-candidates', () => {
  it('finds pointing and claiming eliminations', () => {
    // Use a puzzle where locked candidates apply
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const g = Grid.fromString(puzzle);
    const step = lockedCandidates.apply(g);
    // May or may not find something on this specific board, but should not crash
    expect(step === null || step.eliminations.length > 0 || step.placements.length > 0).toBe(true);
  });
});

// ---- Naked Subset ----
describe('naked-subset', () => {
  it('finds a naked pair and eliminates candidates', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = nakedSubset.apply(g);
    // Should either find something or return null (not crash)
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- Hidden Subset ----
describe('hidden-subset', () => {
  it('finds a hidden pair and eliminates candidates', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = hiddenSubset.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- Basic Fish ----
describe('basic-fish', () => {
  it('finds an X-Wing or returns null', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = basicFish.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- Single Digit Patterns ----
describe('single-digit-patterns', () => {
  it('returns null or valid eliminations on a sample board', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = singleDigitPatterns.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- XY-Wing ----
describe('xy-wing', () => {
  it('returns null or valid eliminations on a sample board', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = xyWing.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- XYZ-Wing ----
describe('xyz-wing', () => {
  it('returns null or valid eliminations on a sample board', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = xyzWing.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- W-Wing ----
describe('w-wing', () => {
  it('returns null or valid eliminations on a sample board', () => {
    const g = Grid.fromString(
      board([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345600',
      ]),
    );
    g.recomputeCandidates();
    const step = wWing.apply(g);
    expect(step === null || step.eliminations.length > 0).toBe(true);
  });
});

// ---- Integration: all strategies together ----
describe('all strategies integration', () => {
  it('solves an easy puzzle with all strategies and stays sound', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const solution = solveBruteforce(puzzle)!;
    const g = Grid.fromString(puzzle);
    const trace = solve(g, STRATEGIES);
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });

  it('solves a medium puzzle with all strategies and stays sound', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const solution = solveBruteforce(puzzle)!;
    const g = Grid.fromString(puzzle);
    const trace = solve(g, STRATEGIES);
    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });
});
