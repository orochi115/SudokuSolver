import { describe, it, expect } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import {
  tridagon,
  multiColoring,
  medusa3d,
  alsChain,
  ahs,
  wxyzWing,
  remotePairs,
  bentSets,
  brokenWing,
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
  extendedUniqueRectangle,
  uniqueLoop,
  bugLite,
  bugPlusN,
  aicWithAls,
  aicWithUr,
} from '../src/strategies/index.js';
import { getGivens } from '../src/strategies/avoidable-rectangle.js';

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function assertSoundStep(puzzleStr: string, step: any): void {
  const solution = solveBruteforce(puzzleStr);
  expect(solution, `puzzle should be solvable`).not.toBeNull();
  const fakeTrace = {
    initial: puzzleStr,
    steps: [step],
    outcome: 'stuck' as const,
    final: puzzleStr,
  };
  const result = checkTraceSoundness(fakeTrace, solution!);
  expect(result.sound).toBe(true);
}

const basicStrategies = STRATEGIES.filter((s) => s.difficulty < 400);

function solveWithTarget(puzzle: string, targetStrategy: any) {
  const g = gridFrom(puzzle);
  return solve(g, [...basicStrategies, targetStrategy]);
}

describe('P1 Human Solving Strategies', () => {
  describe('tridagon', () => {
    it('has correct metadata', () => {
      expect(tridagon.id).toBe('tridagon');
      expect(tridagon.difficulty).toBe(1100);
    });

    it('applies to Loki puzzle', () => {
      const puzzle = '570000900000000008010000000001680040000002809002094160000020000060908204000410600';
      const trace = solveWithTarget(puzzle, tridagon);
      const step = trace.steps.find((s) => s.strategyId === 'tridagon');
      expect(step).toBeDefined();
      if (step) {
        expect(step.eliminations.length).toBeGreaterThan(0);
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('multi-coloring', () => {
    it('has correct metadata', () => {
      expect(multiColoring.id).toBe('multi-coloring');
      expect(multiColoring.difficulty).toBe(620);
    });

    it('applies to x-colors example 1 under solving flow', () => {
      const puzzle = '401708003000501000000002017802604071000000000140809306900200000000003000500406108';
      const trace = solveWithTarget(puzzle, multiColoring);
      const step = trace.steps.find((s) => s.strategyId === 'multi-coloring');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('3d-medusa', () => {
    it('has correct metadata', () => {
      expect(medusa3d.id).toBe('3d-medusa');
      expect(medusa3d.difficulty).toBe(640);
    });

    it('applies to rule 3 example under solving flow', () => {
      const puzzle = '290000030000020070000109402800760200600000007009045008903407000060030000050000084';
      const trace = solveWithTarget(puzzle, medusa3d);
      const step = trace.steps.find((s) => s.strategyId === '3d-medusa');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('als-chain', () => {
    it('has correct metadata', () => {
      expect(alsChain.id).toBe('als-chain');
      expect(alsChain.difficulty).toBe(880);
    });
  });

  describe('ahs', () => {
    it('has correct metadata', () => {
      expect(ahs.id).toBe('ahs');
      expect(ahs.difficulty).toBe(885);
    });

    it('applies to ahs example under solving flow', () => {
      const puzzle = '078065193930010070516739842090076010065390280040020069657142938020983050389657421';
      const trace = solveWithTarget(puzzle, ahs);
      const step = trace.steps.find((s) => s.strategyId === 'ahs');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('wxyz-wing', () => {
    it('has correct metadata', () => {
      expect(wxyzWing.id).toBe('wxyz-wing');
      expect(wxyzWing.difficulty).toBe(520);
    });

    it('applies to wxyz-wing example under solving flow', () => {
      const puzzle = '000004700500370060230000004700030840000401000084060003300000059070093002006200000';
      const trace = solveWithTarget(puzzle, wxyzWing);
      const step = trace.steps.find((s) => s.strategyId === 'wxyz-wing');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('remote-pairs', () => {
    it('has correct metadata', () => {
      expect(remotePairs.id).toBe('remote-pairs');
      expect(remotePairs.difficulty).toBe(505);
    });

    it('applies to remote-pairs example under solving flow', () => {
      const puzzle = '010200870050000001000076000800027006000000000100480003000850700700000030001000020';
      const trace = solveWithTarget(puzzle, remotePairs);
      const step = trace.steps.find((s) => s.strategyId === 'remote-pairs');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('bent-sets', () => {
    it('has correct metadata', () => {
      expect(bentSets.id).toBe('bent-sets');
      expect(bentSets.difficulty).toBe(540);
    });

    it('applies to bent-sets pair example directly', () => {
      const g = Grid.fromString('0'.repeat(81));
      for (let c = 0; c < 81; c++) {
        g.values[c] = 9; // solved to 9 (not in {3,5})
      }

      const I = [18, 19, 20];
      const L = [24];
      const B = [1];
      const targetCell = 2; // in Box 0, off row 3 and B

      const active = [...I, ...L, ...B, targetCell];
      for (const c of active) {
        g.values[c] = 0;
      }

      g.recomputeCandidates();

      g.candidates[18] = maskOf(3);
      g.candidates[19] = maskOf(3);
      g.candidates[20] = maskOf(3);

      g.candidates[24] = maskOf(3) | maskOf(5); // L
      g.candidates[1] = maskOf(3) | maskOf(5);  // B

      g.candidates[targetCell] = maskOf(5) | maskOf(8);

      const step = bentSets.apply(g);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('bent-sets');
      expect(step!.eliminations).toContainEqual({ cell: targetCell, digit: 5 });
    });
  });

  describe('broken-wing', () => {
    it('has correct metadata', () => {
      expect(brokenWing.id).toBe('broken-wing');
      expect(brokenWing.difficulty).toBe(560);
    });

    it('applies to broken-wing example under solving flow', () => {
      const puzzle = '008057600000000007040903000070590040900000001020084070000409010200000000003870500';
      const trace = solveWithTarget(puzzle, brokenWing);
      const step = trace.steps.find((s) => s.strategyId === 'broken-wing');
      expect(step).toBeDefined();
      if (step) {
        assertSoundStep(puzzle, step);
      }
    });
  });

  describe('avoidable-rectangles', () => {
    it('has correct metadata', () => {
      expect(avoidableRectangleType1.id).toBe('avoidable-rectangle-type-1');
      expect(avoidableRectangleType2.id).toBe('avoidable-rectangle-type-2');
      expect(avoidableRectangleType3.id).toBe('avoidable-rectangle-type-3');
      expect(avoidableRectangleType4.id).toBe('avoidable-rectangle-type-4');
    });

    it('applies avoidable-rectangle-type-1', () => {
      const sol = '954286137361594287287317945412953678735862491896147523345629817629781354178435296';
      const g = Grid.fromString(sol);
      g.values[9] = 7; // force r2c1 to be 7
      g.values[17] = 0; // r2c9
      g.recomputeCandidates();
      g.candidates[17] = maskOf(7) | maskOf(9) | maskOf(1);

      const givens = getGivens(g);
      givens.clear(); // treat all solved cells as non-given derived cells

      const step = avoidableRectangleType1.apply(g);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('avoidable-rectangle-type-1');
      expect(step!.eliminations).toContainEqual({ cell: 17, digit: 9 });
    });

    it('applies avoidable-rectangle-type-2', () => {
      const sol = '985321647421576938736489512192835476374162859658947123247618395819253764563794281';
      const g = Grid.fromString(sol);
      g.values[65] = 0; // r8c3
      g.values[69] = 0; // r8c7
      g.recomputeCandidates();
      g.candidates[65] = maskOf(3) | maskOf(7) | maskOf(9);
      g.candidates[69] = maskOf(3) | maskOf(7) | maskOf(9);

      // Unsolve a common peer cell and give it candidate 9 to allow elimination
      g.values[63] = 0;
      g.candidates[63] = maskOf(9);

      const givens = getGivens(g);
      givens.clear();

      const step = avoidableRectangleType2.apply(g);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('avoidable-rectangle-type-2');
    });
  });

  describe('extended-unique-rectangle', () => {
    it('has correct metadata', () => {
      expect(extendedUniqueRectangle.id).toBe('extended-unique-rectangle');
      expect(extendedUniqueRectangle.difficulty).toBe(980);
    });

    it('applies to extended unique rectangle', () => {
      const sol = '917824365842365917635917428184739652573246189269581743351492876796158234428673591';
      const g = Grid.fromString(sol);
      const config = [18, 20, 36, 38, 54, 56];
      for (const c of config) {
        g.values[c] = 0;
        g.candidates[c] = maskOf(1) | maskOf(3) | maskOf(5);
      }
      g.candidates[18] = maskOf(1) | maskOf(3) | maskOf(5) | maskOf(6); // S is 1,3,5

      const step = extendedUniqueRectangle.apply(g);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('extended-unique-rectangle');
      expect(step!.eliminations).toContainEqual({ cell: 18, digit: 1 });
      expect(step!.eliminations).toContainEqual({ cell: 18, digit: 3 });
      expect(step!.eliminations).toContainEqual({ cell: 18, digit: 5 });
    });
  });

  describe('unique-loop', () => {
    it('has correct metadata', () => {
      expect(uniqueLoop.id).toBe('unique-loop');
      expect(bugLite.id).toBe('bug-lite');
      expect(bugPlusN.id).toBe('bug-plus-n');
    });
  });

  describe('aic-extensions', () => {
    it('has correct metadata', () => {
      expect(aicWithAls.id).toBe('aic-with-als');
      expect(aicWithUr.id).toBe('aic-with-ur');
    });

    it('applies aic-with-als example directly', () => {
      const puzzle = '600070000007003900250090030005006000403000705000300800040030029002100400000040008';
      const g = gridFrom(puzzle);
      const work = g.clone();
      const ordered = [...STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
      for (let i = 0; i < 30; i++) {
        let progressed = false;
        for (const s of ordered) {
          if (s.difficulty >= 400) continue;
          const step = s.apply(work);
          if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
            applyStep(work, step);
            progressed = true;
            break;
          }
        }
        if (!progressed) break;
      }
      const step = aicWithAls.apply(work);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('aic-with-als');
      assertSoundStep(puzzle, step);
    });

    it('applies aic-with-ur example directly', () => {
      const puzzle = '010070050004000000600100003009435800020800100008002004050009030300080009000000500';
      const g = gridFrom(puzzle);
      const step = aicWithUr.apply(g);
      expect(step).not.toBeNull();
      expect(step!.strategyId).toBe('aic-with-ur');
      assertSoundStep(puzzle, step);
    });
  });
});
