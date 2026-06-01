import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from '../src/strategies/hidden-subsets.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

// Valid puzzles from ground-truth easy set
const VALID_PUZZLES = [
  '050703060007000800000816000000030000005000100730040086906000204840572093000409000',
  '000000080900504600605000709009070000806491507000080400401000302007102006080000000',
  '004576000206400700500000800000029060302050407050730000008000004007008601000247900',
  '527000000900210070000000004051008000000675000000100360300000000090087002000000916',
  '026800900000000803843060705000203004004080500100409000408010359207000000005008270',
  '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
];

describe('hidden pair', () => {
  it('has correct step structure when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const g = Grid.fromString(puzzle);
      const solution = solveBruteforce(puzzle);
      expect(solution).not.toBeNull();
      const step = hiddenPair.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('hidden-pair');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.zh).toContain('隐性数对');
        expect(step.explanation.en).toContain('Hidden Pair');
        // All elimination cells should be from the highlighted (subset) cells
        for (const elim of step.eliminations) {
          expect(step.highlights.cells).toContain(elim.cell);
        }
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution!).sound).toBe(true);
        return;
      }
    }
  });

  it('returns null on a solved grid', () => {
    const solved = '123456789456789123789123456214365897365897214897214365531642978642978531978531642';
    expect(hiddenPair.apply(Grid.fromString(solved))).toBeNull();
  });
});

describe('hidden triple', () => {
  it('has correct strategy id when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const g = Grid.fromString(puzzle);
      const solution = solveBruteforce(puzzle)!;
      const step = hiddenTriple.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('hidden-triple');
        expect(step.placements).toHaveLength(0);
        expect(step.eliminations.length).toBeGreaterThan(0);
        expect(step.explanation.en).toContain('Hidden Triple');
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution).sound).toBe(true);
        return;
      }
    }
  });
});

describe('hidden quad', () => {
  it('has correct strategy id when it fires', () => {
    for (const puzzle of VALID_PUZZLES) {
      const g = Grid.fromString(puzzle);
      const solution = solveBruteforce(puzzle)!;
      const step = hiddenQuad.apply(g);
      if (step !== null) {
        expect(step.strategyId).toBe('hidden-quad');
        expect(step.placements).toHaveLength(0);
        const fakeTrace = { initial: puzzle, steps: [step], outcome: 'stuck' as const, final: puzzle };
        expect(checkTraceSoundness(fakeTrace, solution).sound).toBe(true);
        return;
      }
    }
  });
});
