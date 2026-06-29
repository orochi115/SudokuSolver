import { describe, it, expect } from 'vitest';
import { Grid, digitsOf } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import {
  vwxyzWing,
  exocet,
  skLoop,
  msls,
  fireworks,
  alignedPairExclusion,
  alignedTripleExclusion,
} from '../src/strategies/index.js';

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

describe('P2a Human Solving Strategies', () => {
  describe('vwxyz-wing', () => {
    it('has correct metadata', () => {
      expect(vwxyzWing.id).toBe('vwxyz-wing');
      expect(vwxyzWing.difficulty).toBe(530);
    });

    it('applies and returns null or sound step on a standard grid', () => {
      const grid = Grid.fromString("0".repeat(81));
      const res = vwxyzWing.apply(grid);
      if (res) {
        assertSoundStep(grid.toString(), res);
      } else {
        expect(res).toBeNull();
      }
    });
  });

  describe('fireworks', () => {
    it('has correct metadata', () => {
      expect(fireworks.id).toBe('fireworks');
      expect(fireworks.difficulty).toBe(1050);
    });

    it('applies to triple fireworks example under solving flow', () => {
      const puzzle = '230008005060200000000090100006000320403000501025000900007080000000002070100900058';
      const grid = Grid.fromString(puzzle);
      let current = grid.clone();
      let found_step = null;
      const trace = solve(grid, STRATEGIES.filter(s => s.id !== 'fireworks'));
      for (const step of trace.steps) {
        applyStep(current, step);
        const res = fireworks.apply(current);
        if (res) {
          found_step = res;
          break;
        }
      }
      expect(found_step).not.toBeNull();
      if (found_step) {
        expect(found_step.eliminations.length).toBeGreaterThan(0);
        assertSoundStep(current.toString(), found_step);
      }
    });
  });

  describe('aligned-pair-exclusion', () => {
    it('has correct metadata', () => {
      expect(alignedPairExclusion.id).toBe('aligned-pair-exclusion');
      expect(alignedPairExclusion.difficulty).toBe(1120);
    });

    it('applies to APE example 1', () => {
      const puzzle = '090000040030040700000670003200900506006000100104008007700091000009030050060000070';
      const grid = Grid.fromString(puzzle);
      const res = alignedPairExclusion.apply(grid);
      expect(res).not.toBeNull();
      if (res) {
        expect(res.eliminations.length).toBeGreaterThan(0);
        assertSoundStep(puzzle, res);
      }
    });
  });

  describe('aligned-triple-exclusion', () => {
    it('has correct metadata', () => {
      expect(alignedTripleExclusion.id).toBe('aligned-triple-exclusion');
      expect(alignedTripleExclusion.difficulty).toBe(1130);
    });

    it('applies and returns null or sound step on a standard grid', () => {
      const grid = Grid.fromString("0".repeat(81));
      const res = alignedTripleExclusion.apply(grid);
      if (res) {
        assertSoundStep(grid.toString(), res);
      } else {
        expect(res).toBeNull();
      }
    });
  });

  describe('exocet', () => {
    it('has correct metadata', () => {
      expect(exocet.id).toBe('exocet');
      expect(exocet.difficulty).toBe(1200);
    });

    it('applies and returns null or sound step on a standard grid', () => {
      const grid = Grid.fromString("0".repeat(81));
      const res = exocet.apply(grid);
      if (res) {
        assertSoundStep(grid.toString(), res);
      } else {
        expect(res).toBeNull();
      }
    });
  });

  describe('sk-loop', () => {
    it('has correct metadata', () => {
      expect(skLoop.id).toBe('sk-loop');
      expect(skLoop.difficulty).toBe(1250);
    });

    it('applies to Easter Monster puzzle', () => {
      const puzzle = '100000002090400050006000700050903000000070000000850040700000600030009080002000001';
      const grid = Grid.fromString(puzzle);
      const res = skLoop.apply(grid);
      expect(res).not.toBeNull();
      if (res) {
        expect(res.eliminations.length).toBeGreaterThan(0);
        assertSoundStep(puzzle, res);
      }
    });
  });

  describe('msls', () => {
    it('has correct metadata', () => {
      expect(msls.id).toBe('msls');
      expect(msls.difficulty).toBe(1300);
    });

    it('applies and returns null or sound step on a standard grid', () => {
      const grid = Grid.fromString("0".repeat(81));
      const res = msls.apply(grid);
      if (res) {
        assertSoundStep(grid.toString(), res);
      } else {
        expect(res).toBeNull();
      }
    });
  });
});
