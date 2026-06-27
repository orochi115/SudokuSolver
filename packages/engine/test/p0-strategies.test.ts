import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { finnedXWing, finnedSwordfish } from '../src/strategies/finned-fish.js';
import { turbotFish, xyChain, niceLoop } from '../src/strategies/chains.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from '../src/strategies/uniqueness.js';
import { rc } from '../src/worked-example-verify.js';

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
  it('finned sashimi x-wing eliminates 4 from E6 and F6', () => {
    const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
    const step = finnedXWing.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('finned-x-wing');
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { cell: rc(5, 6), digit: 4 },
        { cell: rc(6, 6), digit: 4 },
      ]),
    );
    assertSound(puzzle, step!);
  });

  it('finned sashimi swordfish eliminates 7 from A6', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
    const step = finnedSwordfish.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('finned-swordfish');
    expect(step?.eliminations).toContainEqual({ cell: rc(1, 6), digit: 7 });
    assertSound(puzzle, step!);
  });
});

describe('xy-chain', () => {
  it('eliminates 5 from cells seeing both endpoints', () => {
    const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
    const step = xyChain.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('xy-chain');
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { cell: rc(1, 3), digit: 5 },
        { cell: rc(3, 7), digit: 5 },
        { cell: rc(3, 9), digit: 5 },
      ]),
    );
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

describe('ground-truth soundness with P0 strategies', () => {
  it('full human-default solve traces have zero violations on ground-truth sample', () => {
    const sample = [
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
      '300002500000080060080700041700001300000070000008200005510008020030090000004500009',
      '080103070000000000001408020570001039000609000920800051030905200000000000010702060',
    ];
    for (const puzzle of sample) {
      const solution = solveBruteforce(puzzle)!;
      const trace = solve(Grid.fromString(puzzle), STRATEGIES);
      const result = checkTraceSoundness(trace, solution);
      expect(result.sound, result.violations.join('; ')).toBe(true);
    }
  });
});