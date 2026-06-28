import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import {
  finnedXWing,
  finnedSwordfish,
  finnedJellyfish,
  niceLoop,
  xyChain,
  turbotFish,
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6
} from '../src/strategies/index.js';

// ============================================================
// Helpers
// ============================================================

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function assertSoundStep(
  puzzleStr: string,
  step: any,
): void {
  const solution = solveBruteforce(puzzleStr);
  expect(solution, `puzzle ${puzzleStr.slice(0, 20)}... should be solvable`).not.toBeNull();
  const fakeTrace = {
    initial: puzzleStr,
    steps: [step],
    outcome: 'stuck' as const,
    final: puzzleStr,
  };
  const result = checkTraceSoundness(fakeTrace, solution!);
  expect(result.sound).toBe(true);
}

// ============================================================
// Test Suite
// ============================================================

const P0_STRATEGIES = STRATEGIES.filter(s => s.difficulty < 500 || [
  'simple-coloring', 'x-chain', 'xy-chain', 'nice-loop', 'aic',
  'als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom',
  'bug-plus-one', 'unique-rectangle-type-1', 'unique-rectangle-type-2',
  'hidden-unique-rectangle', 'unique-rectangle-type-3', 'unique-rectangle-type-4',
  'unique-rectangle-type-5', 'unique-rectangle-type-6', 'sue-de-coq', 'forcing-chain'
].includes(s.id));

describe('P0 Human Solving Strategies', () => {
  describe('finned-x-wing', () => {
    const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';

    it('has correct metadata', () => {
      expect(finnedXWing.id).toBe('finned-x-wing');
      expect(finnedXWing.difficulty).toBe(415);
    });

    it('applies to worked example under solving flow', () => {
      const g = gridFrom(puzzle);
      const trace = solve(g, P0_STRATEGIES);
      const step = trace.steps.find((s) => s.strategyId === 'finned-x-wing');
      expect(step).toBeDefined();
      expect(step!.eliminations.length).toBeGreaterThan(0);
      assertSoundStep(puzzle, step);
    });
  });

  describe('finned-swordfish', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';

    it('has correct metadata', () => {
      expect(finnedSwordfish.id).toBe('finned-swordfish');
      expect(finnedSwordfish.difficulty).toBe(455);
    });

    it('applies to worked example under solving flow', () => {
      const g = gridFrom(puzzle);
      const trace = solve(g, STRATEGIES);
      const step = trace.steps.find((s) => s.strategyId === 'finned-swordfish');
      expect(step).toBeDefined();
      expect(step!.eliminations.length).toBeGreaterThan(0);
      assertSoundStep(puzzle, step);
    });
  });

  describe('finned-jellyfish', () => {
    it('has correct metadata', () => {
      expect(finnedJellyfish.id).toBe('finned-jellyfish');
      expect(finnedJellyfish.difficulty).toBe(495);
    });
  });

  describe('turbot-fish', () => {
    const puzzle = '000000000001902060000006790902000600370000950005000004140003005709024000000800000';

    it('has correct metadata', () => {
      expect(turbotFish.id).toBe('turbot-fish');
      expect(turbotFish.difficulty).toBe(510);
    });

    it('applies to worked example under solving flow', () => {
      const g = gridFrom(puzzle);
      const strategiesWithoutSkyscraper = STRATEGIES.filter(s => s.id !== 'skyscraper' && s.id !== 'two-string-kite' && s.id !== 'finned-x-wing' && s.id !== 'empty-rectangle' && s.id !== 'finned-swordfish' && s.id !== 'finned-jellyfish');
      const trace = solve(g, strategiesWithoutSkyscraper);
      const step = trace.steps.find((s) => s.strategyId === 'turbot-fish');
      expect(step).toBeDefined();
      expect(step!.eliminations.length).toBeGreaterThan(0);
      assertSoundStep(puzzle, step);
    });
  });

  describe('xy-chain', () => {
    const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';

    it('has correct metadata', () => {
      expect(xyChain.id).toBe('xy-chain');
      expect(xyChain.difficulty).toBe(715);
    });

    it('applies to worked example under solving flow', () => {
      const g = gridFrom(puzzle);
      const trace = solve(g, P0_STRATEGIES);
      const step = trace.steps.find((s) => s.strategyId === 'xy-chain');
      expect(step).toBeDefined();
      expect(step!.eliminations.length).toBeGreaterThan(0);
      assertSoundStep(puzzle, step);
    });
  });

  describe('nice-loop', () => {
    it('has correct metadata', () => {
      expect(niceLoop.id).toBe('nice-loop');
      expect(niceLoop.difficulty).toBe(720);
    });
  });

  describe('hidden-unique-rectangle', () => {
    it('has correct metadata', () => {
      expect(hiddenUniqueRectangle.id).toBe('hidden-unique-rectangle');
      expect(hiddenUniqueRectangle.difficulty).toBe(935);
    });
  });

  describe('unique-rectangle-type-3', () => {
    it('has correct metadata', () => {
      expect(uniqueRectangleType3.id).toBe('unique-rectangle-type-3');
      expect(uniqueRectangleType3.difficulty).toBe(940);
    });
  });

  describe('unique-rectangle-type-5', () => {
    it('has correct metadata', () => {
      expect(uniqueRectangleType5.id).toBe('unique-rectangle-type-5');
      expect(uniqueRectangleType5.difficulty).toBe(960);
    });
  });

  describe('unique-rectangle-type-6', () => {
    it('has correct metadata', () => {
      expect(uniqueRectangleType6.id).toBe('unique-rectangle-type-6');
      expect(uniqueRectangleType6.difficulty).toBe(970);
    });
  });
});
