import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { skyscraper, twoStringKite, emptyRectangle } from '../src/strategies/single-digit-patterns.js';
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

describe('skyscraper', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = skyscraper.apply(g);
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
      const step = skyscraper.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('skyscraper');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('摩天楼');
        expect(step.explanation.en).toContain('Skyscraper');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });

  it('returns null on a solved grid', () => {
    const solved = '123456789456789123789123456214365897365897214897214365531642978642978531978531642';
    expect(skyscraper.apply(Grid.fromString(solved))).toBeNull();
  });
});

describe('2-string kite', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = twoStringKite.apply(g);
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
      const step = twoStringKite.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('2-string-kite');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('双线风筝');
        expect(step.explanation.en).toContain('2-String Kite');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });
});

describe('empty rectangle', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = emptyRectangle.apply(g);
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
      const step = emptyRectangle.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('empty-rectangle');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('空矩形');
        expect(step.explanation.en).toContain('Empty Rectangle');
        soundnessCheck(puzzle, step);
        return;
      }
    }
  });
});
