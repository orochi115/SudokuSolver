import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from '../src/strategies/finned-fish.js';
import { turbotFish, xyChain, niceLoop } from '../src/strategies/chains.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from '../src/strategies/uniqueness.js';
const P0_IDS = [
  'finned-x-wing',
  'finned-swordfish',
  'finned-jellyfish',
  'nice-loop',
  'xy-chain',
  'turbot-fish',
  'hidden-unique-rectangle',
  'unique-rectangle-type-3',
  'unique-rectangle-type-5',
  'unique-rectangle-type-6',
] as const;

function candidateMask(...digits: number[]): number {
  return digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
}

function gridFromState(puzzle: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(puzzle);
  grid.candidates.set(candidateMasks);
  return grid;
}

function assertSound(puzzle: string, step: NonNullable<ReturnType<typeof finnedXWing.apply>>): void {
  const solution = solveBruteforce(puzzle);
  expect(solution).not.toBeNull();
  const result = checkTraceSoundness({ initial: puzzle, steps: [step], outcome: 'stuck', final: puzzle }, solution!);
  expect(result.sound).toBe(true);
}

describe('P0 strategy registry', () => {
  it('registers all required P0 strategy ids', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    for (const id of P0_IDS) expect(ids.has(id), id).toBe(true);
  });
});

describe('finned fish', () => {
  it('finned x-wing eliminates peer cover cells seeing the fin box', () => {
    const puzzle = '000100000100000000000000004020000000000000005030000000040000003050000002000000000';
    const step = finnedXWing.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('finned-x-wing');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });

  it('finned sashimi swordfish fires on digit 7 (SudokuWiki Example 2)', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
    const step = finnedSwordfish.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('finned-swordfish');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });

  it('finned jellyfish detects size-4 finned pattern', () => {
    const masks = Array<number>(81).fill(0);
    for (const cell of [0, 1, 9, 11, 19, 21, 28, 30, 36, 37]) masks[cell] = candidateMask(5);
    const step = finnedJellyfish.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('finned-jellyfish');
    expect(step?.eliminations.length).toBeGreaterThan(0);
  });
});

describe('xy-chain', () => {
  it('closed bivalue loop eliminates off-chain candidates (SudokuWiki closed XYC)', () => {
    const puzzle = '002000376010030500000000090900850001000304000200097003080000000003040060147000200';
    const step = xyChain.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('xy-chain');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });
});

describe('nice-loop', () => {
  it('continuous loop eliminates off-chain 8s (SudokuWiki X-Cycles Fig 4)', () => {
    const puzzle = '003000100500670000700009006034705600000000000008406930900300002000052009001000500';
    const step = niceLoop.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('nice-loop');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });
});

describe('turbot-fish', () => {
  it('does not modify grid', () => {
    const puzzle = '000000000001902060000006790902000600370000950005000004140003005709024000000800000';
    const g = Grid.fromString(puzzle);
    const before = g.toString();
    turbotFish.apply(g);
    expect(g.toString()).toBe(before);
  });
});

describe('UR extensions (shared ur-engine)', () => {
  it('hidden unique rectangle eliminates opposite corner', () => {
    // R1C1,R1C4,R2C1,R2C4 — valid 2-box UR; start R1C1 {1,2}, diagonal opposite R2C4 {1,2,5}
    const masks = Array<number>(81).fill(0);
    masks[0] = candidateMask(1, 2);
    masks[3] = candidateMask(1, 2);
    masks[9] = candidateMask(1, 2, 7);
    masks[12] = candidateMask(1, 2, 5);
    const step = hiddenUniqueRectangle.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('hidden-unique-rectangle');
    expect(step?.eliminations).toContainEqual({ cell: 12, digit: 2 });
  });

  it('unique rectangle type 3 naked subset off roofs', () => {
    // Roofs R1C4/R2C4 share col 4; virtual {3,4,5} + R3C4 {3,4} + R4C4 {5} naked triple
    const masks = Array<number>(81).fill(0);
    masks[0] = candidateMask(1, 2);
    masks[3] = candidateMask(1, 2, 3, 4);
    masks[9] = candidateMask(1, 2);
    masks[12] = candidateMask(1, 2, 3, 5);
    masks[21] = candidateMask(3, 4);
    masks[30] = candidateMask(5);
    masks[39] = candidateMask(3, 4, 5, 6);
    const step = uniqueRectangleType3.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-3');
    expect(step?.eliminations).toContainEqual({ cell: 39, digit: 3 });
  });

  it('unique rectangle type 5 diagonal extra digit', () => {
    const masks = Array<number>(81).fill(0);
    masks[0] = candidateMask(1, 2, 3);
    masks[12] = candidateMask(1, 2, 3);
    masks[3] = candidateMask(1, 2);
    masks[9] = candidateMask(1, 2);
    masks[4] = candidateMask(3);
    const step = uniqueRectangleType5.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-5');
    expect(step?.eliminations).toContainEqual({ cell: 4, digit: 3 });
  });

  it('unique rectangle type 6 x-wing lock on roof', () => {
    const masks = Array<number>(81).fill(0);
    masks[0] = candidateMask(1, 2, 3);
    masks[12] = candidateMask(1, 2, 3);
    masks[3] = candidateMask(1, 2);
    masks[9] = candidateMask(1, 2);
    const step = uniqueRectangleType6.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-6');
    expect(step?.eliminations.length).toBeGreaterThan(0);
  });
});

describe('ground-truth soundness with P0 strategies', () => {
  it('full human-default solve traces have zero violations on ground-truth sample', () => {
    const sample = [
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
      '300002500000080060080700041700001300000070000008200005510008020030090000004500009',
    ];
    for (const puzzle of sample) {
      const solution = solveBruteforce(puzzle)!;
      const trace = solve(Grid.fromString(puzzle), STRATEGIES);
      const result = checkTraceSoundness(trace, solution);
      expect(result.sound, result.violations.join('; ')).toBe(true);
    }
  });
});