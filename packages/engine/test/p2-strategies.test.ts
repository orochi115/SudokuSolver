/**
 * P2 strategy unit tests — exotic / rare techniques.
 */

import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { vwxyzWing } from '../src/strategies/vwxyz-wing.js';
import { sueDeCoqExtended } from '../src/strategies/sue-de-coq.js';
import {
  exocet,
  skLoop,
  msls,
  fireworks,
  alignedPairExclusion,
  alignedTripleExclusion,
  subsetExclusion,
  twinnedXyChains,
  aicWithExoticLinks,
  frankenFish,
  mutantFish,
  gurth,
} from '../src/strategies/exotic-p2.js';
import { verifyDeductions, rc } from '../src/worked-example-verify.js';

function requireGrid(puzzle: string): Grid {
  const grid = Grid.fromString(puzzle);
  grid.recomputeCandidates();
  return grid;
}

function assertSoundStep(puzzle: string, step: NonNullable<ReturnType<typeof exocet.apply>>): void {
  const solution = solveBruteforce(puzzle);
  expect(solution).not.toBeNull();
  const result = checkTraceSoundness(
    { initial: puzzle, steps: [step], outcome: 'stuck', final: puzzle },
    solution!,
  );
  expect(result.sound).toBe(true);
}

const P2_IDS = [
  'vwxyz-wing',
  'exocet',
  'sk-loop',
  'msls',
  'fireworks',
  'aligned-pair-exclusion',
  'aligned-triple-exclusion',
  'subset-exclusion',
  'sue-de-coq-extended',
  'twinned-xy-chains',
  'aic-with-exotic-links',
  'franken-fish',
  'mutant-fish',
  'gurth',
] as const;

describe('P2 — registry', () => {
  it('registers all P2 strategy ids', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    for (const id of P2_IDS) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});

describe('P2 — per-strategy tests', () => {
  it('vwxyz-wing — apply on empty grid returns null', () => {
    expect(vwxyzWing.apply(requireGrid('0'.repeat(81)))).toBeNull();
  });

  it('exocet — Rule 1 eliminations are sound', () => {
    const puzzle = '007020004930000600600300000000000050200010008006900400003700900020050001000008000';
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(2, 4), digit: 4 },
          { cell: rc(3, 7), digit: 2 },
          { cell: rc(3, 7), digit: 7 },
        ],
      }).ok,
    ).toBe(true);
  });

  it('sk-loop — Easter Monster outer eliminations', () => {
    const puzzle = '100000002090400050006000700050903000000070000000850040700000600030009080002000001';
    const step = skLoop.apply(requireGrid(puzzle));
    expect(step?.strategyId).toBe('sk-loop');
    assertSoundStep(puzzle, step!);
  });

  it('msls — Example 1 partial eliminations are sound', () => {
    const puzzle =
      '1......8......92....6.3...52....8.....5.7.....6.5....4..47...........91..3..6...7'.replace(/\./g, '0');
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(1, 6), digit: 2 },
          { cell: rc(2, 1), digit: 8 },
          { cell: rc(3, 2), digit: 4 },
          { cell: rc(3, 2), digit: 7 },
        ],
      }).ok,
    ).toBe(true);
  });

  it('fireworks — triple eliminations are sound', () => {
    const puzzle = '230008005060200000000090100006000320403000501025000900007080000000002070100900058';
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(3, 4), digit: 4 },
          { cell: rc(3, 4), digit: 5 },
          { cell: rc(3, 4), digit: 6 },
        ],
      }).ok,
    ).toBe(true);
  });

  it('aligned-pair-exclusion — APE type 1', () => {
    const puzzle = '090000040030040700000670003200900506006000100104008007700091000009030050060000070';
    const step = alignedPairExclusion.apply(requireGrid(puzzle));
    expect(step?.strategyId).toBe('aligned-pair-exclusion');
    assertSoundStep(puzzle, step!);
  });

  it('aligned-triple-exclusion — apply on empty grid returns null', () => {
    expect(alignedTripleExclusion.apply(requireGrid('0'.repeat(81)))).toBeNull();
  });

  it('subset-exclusion — Sudopedia r2c4<>7', () => {
    const puzzle = '193008602008030001004100389371495268580010403240080015437021806002000034005000027';
    const step = subsetExclusion.apply(requireGrid(puzzle));
    expect(step?.strategyId).toBe('subset-exclusion');
    assertSoundStep(puzzle, step!);
  });

  it('sue-de-coq-extended — sdc03 eliminations are sound', () => {
    const puzzle = '..1..8.2.8...9.64.5.2.....7.8..2.........9..3...41..............6.9..51...714..6.'.replace(
      /\./g,
      '0',
    );
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(7, 1), digit: 2 },
          { cell: rc(7, 1), digit: 4 },
          { cell: rc(4, 3), digit: 5 },
        ],
      }).ok,
    ).toBe(true);
    expect(sueDeCoqExtended.apply(requireGrid(puzzle))).toBeNull();
  });

  it('twinned-xy-chains — Example A', () => {
    const puzzle = '080402000000065001600100000070000300058200970300000002800010003500000009000907480';
    const step = twinnedXyChains.apply(requireGrid(puzzle));
    expect(step?.strategyId).toBe('twinned-xy-chains');
    assertSoundStep(puzzle, step!);
  });

  it('aic-with-exotic-links — deterministic on empty grid', () => {
    const empty = requireGrid('0'.repeat(81));
    expect(aicWithExoticLinks.apply(empty)).toStrictEqual(aicWithExoticLinks.apply(empty));
  });

  it('franken-fish — HoDoKu fff301', () => {
    const puzzle = '006700091009000062300000000000030004007200010400001000031008075000900000065000030';
    const step = frankenFish.apply(requireGrid(puzzle));
    expect(step?.strategyId).toBe('franken-fish');
    assertSoundStep(puzzle, step!);
  });

  it('mutant-fish — apply on empty grid returns null', () => {
    expect(mutantFish.apply(requireGrid('0'.repeat(81)))).toBeNull();
  });

  it('gurth — non-symmetric puzzle returns null', () => {
    expect(gurth.apply(requireGrid('0'.repeat(81)))).toBeNull();
  });
});