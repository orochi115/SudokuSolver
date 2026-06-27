import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from '../src/strategies/finned-fish.js';
import { turbotFish } from '../src/strategies/turbot-fish.js';
import { xyChain } from '../src/strategies/xy-chain.js';
import { niceLoop } from '../src/strategies/nice-loop.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from '../src/strategies/uniqueness.js';

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function assertSoundStep(puzzleStr: string, step: ReturnType<typeof finnedXWing.apply>): void {
  expect(step).not.toBeNull();
  const solution = solveBruteforce(puzzleStr);
  expect(solution).not.toBeNull();
  const trace = { initial: puzzleStr, steps: [step!], outcome: 'stuck' as const, final: '' };
  const result = checkTraceSoundness(trace, solution!);
  expect(result.sound).toBe(true);
}

describe('finned-fish', () => {
  it('has correct ids and difficulties', () => {
    expect(finnedXWing.id).toBe('finned-x-wing');
    expect(finnedXWing.difficulty).toBe(415);
    expect(finnedSwordfish.id).toBe('finned-swordfish');
    expect(finnedSwordfish.difficulty).toBe(455);
    expect(finnedJellyfish.id).toBe('finned-jellyfish');
    expect(finnedJellyfish.difficulty).toBe(495);
  });

  it('does not mutate the grid', () => {
    const grid = gridFrom('000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    const before = grid.toString();
    finnedXWing.apply(grid);
    expect(grid.toString()).toBe(before);
  });
});

describe('turbot-fish', () => {
  it('has correct id and difficulty', () => {
    expect(turbotFish.id).toBe('turbot-fish');
    expect(turbotFish.difficulty).toBe(510);
  });

  it('does not mutate the grid', () => {
    const grid = gridFrom('000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    const before = grid.toString();
    turbotFish.apply(grid);
    expect(grid.toString()).toBe(before);
  });
});

describe('xy-chain', () => {
  it('has correct id and difficulty', () => {
    expect(xyChain.id).toBe('xy-chain');
    expect(xyChain.difficulty).toBe(715);
  });

  it('does not mutate the grid', () => {
    const grid = gridFrom('000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    const before = grid.toString();
    xyChain.apply(grid);
    expect(grid.toString()).toBe(before);
  });
});

describe('nice-loop', () => {
  it('has correct id and difficulty', () => {
    expect(niceLoop.id).toBe('nice-loop');
    expect(niceLoop.difficulty).toBe(720);
  });

  it('does not mutate the grid', () => {
    const grid = gridFrom('000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    const before = grid.toString();
    niceLoop.apply(grid);
    expect(grid.toString()).toBe(before);
  });
});

describe('ur-types', () => {
  it('hidden-unique-rectangle has correct id and difficulty', () => {
    expect(hiddenUniqueRectangle.id).toBe('hidden-unique-rectangle');
    expect(hiddenUniqueRectangle.difficulty).toBe(935);
  });

  it('unique-rectangle-type-3 has correct id and difficulty', () => {
    expect(uniqueRectangleType3.id).toBe('unique-rectangle-type-3');
    expect(uniqueRectangleType3.difficulty).toBe(940);
  });

  it('unique-rectangle-type-5 has correct id and difficulty', () => {
    expect(uniqueRectangleType5.id).toBe('unique-rectangle-type-5');
    expect(uniqueRectangleType5.difficulty).toBe(960);
  });

  it('unique-rectangle-type-6 has correct id and difficulty', () => {
    expect(uniqueRectangleType6.id).toBe('unique-rectangle-type-6');
    expect(uniqueRectangleType6.difficulty).toBe(970);
  });
});

describe('P0 strategies full-solve soundness', () => {
  const testPuzzles = [
    '006324800850090000000700000004007680300000007067400300000003000000040021008259700',
    '020000000060000794809060200700003000900102003000500008004020507682000030000000010',
    '030090000000000604906000350060180700090040020004035010048000205703000000000010030',
  ];

  for (const puzzle of testPuzzles) {
    it(`solves ${puzzle.slice(0, 20)}... soundly with all strategies`, () => {
      const grid = gridFrom(puzzle);
      const trace = solve(grid, STRATEGIES);
      const solution = solveBruteforce(puzzle);
      expect(solution).not.toBeNull();
      const result = checkTraceSoundness(trace, solution!);
      if (!result.sound) {
        console.error('Violations:', result.violations.slice(0, 3));
      }
      expect(result.sound).toBe(true);
    });
  }
});

describe('P0 strategies are registered', () => {
  const ids = new Set(STRATEGIES.map((s) => s.id));
  for (const id of [
    'finned-x-wing', 'finned-swordfish', 'finned-jellyfish',
    'nice-loop', 'xy-chain', 'turbot-fish',
    'hidden-unique-rectangle',
    'unique-rectangle-type-3', 'unique-rectangle-type-5', 'unique-rectangle-type-6',
  ]) {
    it(`${id} is registered`, () => {
      expect(ids.has(id)).toBe(true);
    });
  }
});
