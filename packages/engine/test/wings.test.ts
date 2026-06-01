import { describe, it, expect } from 'vitest';
import { Grid, ROW_OF, COL_OF, BOX_OF } from '../src/grid.js';
import { xyWing, xyzWing, wWing } from '../src/strategies/wings.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

// Valid puzzles from ground truth data
const VALID_PUZZLES = [
  '050703060007000800000816000000030000005000100730040086906000204840572093000409000',
  '000000080900504600605000709009070000806491507000080400401000302007102006080000000',
  '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
  '026800900000000803843060705000203004004080500100409000408010359207000000005008270',
  '527000000900210070000000004051008000000675000000100360300000000090087002000000916',
];

function soundnessCheck(puzzle: string, step: import('../src/trace.js').Step): void {
  const solution = solveBruteforce(puzzle);
  if (solution === null) return;
  const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
  const result = checkTraceSoundness(fakeTrace, solution);
  if (!result.sound) {
    console.error(`Unsound step (${step.strategyId}):`, result.violations[0]);
  }
  expect(result.sound).toBe(true);
}

describe('XY-Wing', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xyWing.apply(g);
      if (step !== null) {
        soundnessCheck(puzzle, step);
      }
    }
  });

  it('has correct structure when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xyWing.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('xy-wing');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.highlights.cells).toHaveLength(3); // pivot + 2 pincers
        expect(step.explanation.zh).toContain('XY翼');
        expect(step.explanation.en).toContain('XY-Wing');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });

  it('pivot must see both pincers', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xyWing.apply(g);
      if (step !== null && step.highlights.cells.length === 3) {
        const pivot = step.highlights.cells[0]!;
        const p1 = step.highlights.cells[1]!;
        const p2 = step.highlights.cells[2]!;
        const seesPivotP1 = ROW_OF[pivot] === ROW_OF[p1] || COL_OF[pivot] === COL_OF[p1] || BOX_OF[pivot] === BOX_OF[p1];
        const seesPivotP2 = ROW_OF[pivot] === ROW_OF[p2] || COL_OF[pivot] === COL_OF[p2] || BOX_OF[pivot] === BOX_OF[p2];
        expect(seesPivotP1).toBe(true);
        expect(seesPivotP2).toBe(true);
        return;
      }
    }
  });

  it('returns null on a solved grid', () => {
    const solved = '123456789456789123789123456214365897365897214897214365531642978642978531978531642';
    expect(xyWing.apply(Grid.fromString(solved))).toBeNull();
  });
});

describe('XYZ-Wing', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xyzWing.apply(g);
      if (step !== null) {
        soundnessCheck(puzzle, step);
      }
    }
  });

  it('has correct structure when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xyzWing.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('xyz-wing');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('XYZ翼');
        expect(step.explanation.en).toContain('XYZ-Wing');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });
});

describe('W-Wing', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = wWing.apply(g);
      if (step !== null) {
        soundnessCheck(puzzle, step);
      }
    }
  });

  it('has correct structure when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = wWing.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('w-wing');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('W翼');
        expect(step.explanation.en).toContain('W-Wing');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });
});
