import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { xWing, swordfish, jellyfish } from '../src/strategies/basic-fish.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

// Valid puzzles - from ground truth or well-known examples
const VALID_PUZZLES = [
  '050703060007000800000816000000030000005000100730040086906000204840572093000409000',
  '000000080900504600605000709009070000806491507000080400401000302007102006080000000',
  '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
  '100000000000000000000000000000000000000000000000000000000000000000000000000000001',
  '026800900000000803843060705000203004004080500100409000408010359207000000005008270',
  '527000000900210070000000004051008000000675000000100360300000000090087002000000916',
];

// Test with puzzle that is known to be a valid grid
function testSoundnessIfFires(puzzle: string, strategy: { id: string; apply: (g: Grid) => ReturnType<typeof xWing.apply> }): void {
  const solution = solveBruteforce(puzzle);
  if (solution === null) return; // skip invalid puzzles
  const g = Grid.fromString(puzzle);
  const step = strategy.apply(g);
  if (step !== null) {
    const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
    const result = checkTraceSoundness(fakeTrace, solution);
    if (!result.sound) {
      console.error(`Unsound ${strategy.id} step:`, result.violations[0]);
    }
    expect(result.sound).toBe(true);
  }
}

describe('X-Wing', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      testSoundnessIfFires(puzzle, xWing);
    }
  });

  it('has correct structure when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = xWing.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('basic-fish-x-wing');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('X翼');
        expect(step.explanation.en).toContain('X-Wing');
        expect(step.highlights.cells.length).toBeGreaterThanOrEqual(2);
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution).sound).toBe(true);
        return; // found one, sufficient
      }
    }
  });

  it('returns null on a solved grid', () => {
    const solved = '123456789456789123789123456214365897365897214897214365531642978642978531978531642';
    expect(xWing.apply(Grid.fromString(solved))).toBeNull();
  });
});

describe('Swordfish', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      testSoundnessIfFires(puzzle, swordfish);
    }
  });

  it('has correct strategy id when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = swordfish.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('basic-fish-swordfish');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.en).toContain('Swordfish');
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution).sound).toBe(true);
        return;
      }
    }
  });
});

describe('Jellyfish', () => {
  it('is sound on all test puzzles', () => {
    for (const puzzle of VALID_PUZZLES) {
      testSoundnessIfFires(puzzle, jellyfish);
    }
  });

  it('has correct strategy id when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const solution = solveBruteforce(puzzle);
      if (solution === null) continue;
      const g = Grid.fromString(puzzle);
      const step = jellyfish.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('basic-fish-jellyfish');
        expect(step.placements).toHaveLength(0);
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution).sound).toBe(true);
        return;
      }
    }
  });
});
