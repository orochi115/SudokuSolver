/**
 * P0 strategy unit tests — finned fish, chains, UR extensions.
 */

import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { finnedXWing, finnedSwordfish } from '../src/strategies/finned-fish.js';
import { niceLoop, xyChain, turbotFish } from '../src/strategies/chain-strategies.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from '../src/strategies/uniqueness.js';
import { verifyDeductions, rc } from '../src/worked-example-verify.js';

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function gridFromState(s: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(s);
  grid.candidates.set(candidateMasks);
  return grid;
}

function candidateMask(...digits: number[]): number {
  return digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
}

function assertSoundStep(puzzleStr: string, step: NonNullable<ReturnType<typeof finnedXWing.apply>>): void {
  const solution = solveBruteforce(puzzleStr);
  expect(solution).not.toBeNull();
  const result = checkTraceSoundness(
    { initial: puzzleStr, steps: [step], outcome: 'stuck', final: puzzleStr },
    solution!,
  );
  expect(result.sound).toBe(true);
}

/** Valid UR rectangle: r1c1,r1c4,r2c1,r2c4 → cells 0,3,9,12 (two boxes). */
const UR = { c00: 0, c03: 3, c10: 9, c13: 12 } as const;

describe('P0 — finned fish', () => {
  it('finned-x-wing detects sashimi eliminations (SudokuWiki card soundness)', () => {
    const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(5, 6), digit: 4 },
          { cell: rc(6, 6), digit: 4 },
        ],
      }).ok,
    ).toBe(true);
    const masks = Array<number>(81).fill(0);
    // Minimal sashimi: digit 5, base rows 1–2, cover cols 3–4, fin R1C5, eliminate R3C3/R3C4
    masks[1] = candidateMask(5);
    masks[2] = candidateMask(5);
    masks[3] = candidateMask(5);
    masks[4] = candidateMask(5);
    masks[9] = candidateMask(5);
    masks[10] = candidateMask(5);
    masks[12] = candidateMask(5);
    masks[20] = candidateMask(5);
    masks[21] = candidateMask(5);
    const step = finnedXWing.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('finned-x-wing');
    expect(step?.eliminations.length).toBeGreaterThan(0);
  });

  it('finned-swordfish card eliminations are sound', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
    expect(verifyDeductions(puzzle, { eliminations: [{ cell: rc(1, 6), digit: 7 }] }).ok).toBe(true);
  });
});

describe('P0 — xy-chain', () => {
  it('card eliminations for open XY-chain are sound', () => {
    const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
    expect(
      verifyDeductions(puzzle, {
        eliminations: [
          { cell: rc(1, 3), digit: 5 },
          { cell: rc(3, 7), digit: 5 },
          { cell: rc(3, 9), digit: 5 },
        ],
      }).ok,
    ).toBe(true);
  });

  it('fires on bivalue chain with matching end-digit', () => {
    const masks = Array<number>(81).fill(0);
    // A1{5,9}-A5{9,2}-A1{2,6}-C2{6,5} style open chain on 5
    masks[0] = candidateMask(5, 9);
    masks[4] = candidateMask(2, 9);
    masks[1] = candidateMask(2, 6);
    masks[10] = candidateMask(5, 6);
    masks[2] = candidateMask(5);
    const step = xyChain.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('xy-chain');
    expect(step?.eliminations).toContainEqual({ cell: 2, digit: 5 });
  });
});

describe('P0 — nice-loop', () => {
  it('discontinuous Rule 3 on crafted loop', () => {
    const masks = Array<number>(81).fill(0);
    // 5@A2 - 5@A7 + 7@A7 - 7@F7 + 7@F2 - 7@E2 + 5@E2 - 5@A2
    masks[1] = candidateMask(5, 7);
    masks[6] = candidateMask(5, 7);
    masks[41] = candidateMask(5, 7);
    masks[50] = candidateMask(5, 7);
    masks[40] = candidateMask(5, 7);
    const step = niceLoop.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('nice-loop');
    expect((step?.eliminations.length ?? 0) + (step?.placements.length ?? 0)).toBeGreaterThan(0);
  });
});

describe('P0 — turbot-fish', () => {
  it('detects 4-node strong-weak-strong pattern', () => {
    const masks = Array<number>(81).fill(0);
    // digit 5 cross-box skyscraper/turbot: rows 0/1 cols 0/4, elim r3c1
    for (const cell of [0, 4, 9, 13, 18]) masks[cell] = candidateMask(5);
    const step = turbotFish.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('turbot-fish');
    expect(step?.eliminations).toContainEqual({ cell: 18, digit: 5 });
  });
});

describe('P0 — UR extensions', () => {
  it('unique-rectangle-type-3 strips subset digits from shared house', () => {
    const masks = Array<number>(81).fill(0);
    masks[UR.c00] = candidateMask(1, 2);
    masks[UR.c03] = candidateMask(1, 2);
    masks[UR.c10] = candidateMask(1, 2, 3, 4);
    masks[UR.c13] = candidateMask(1, 2, 3, 4);
    masks[10] = candidateMask(3, 4);
    masks[11] = candidateMask(3, 4);
    const step = uniqueRectangleType3.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-3');
    expect(step?.eliminations).toContainEqual({ cell: 11, digit: 3 });
  });

  it('unique-rectangle-type-5 eliminates diagonal extra digit', () => {
    const masks = Array<number>(81).fill(0);
    masks[UR.c00] = candidateMask(1, 2, 3);
    masks[UR.c03] = candidateMask(1, 2);
    masks[UR.c10] = candidateMask(1, 2);
    masks[UR.c13] = candidateMask(1, 2, 3);
    masks[4] = candidateMask(3);
    const step = uniqueRectangleType5.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-5');
    expect(step?.eliminations).toContainEqual({ cell: 4, digit: 3 });
  });

  it('unique-rectangle-type-6 eliminates from diagonal extras when X-Wing holds', () => {
    const masks = Array<number>(81).fill(0);
    masks[UR.c00] = candidateMask(1, 2, 5);
    masks[UR.c03] = candidateMask(1, 2);
    masks[UR.c10] = candidateMask(1, 2);
    masks[UR.c13] = candidateMask(1, 2, 5);
    const step = uniqueRectangleType6.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('unique-rectangle-type-6');
    expect(step?.eliminations.length).toBeGreaterThan(0);
  });

  it('hidden-unique-rectangle eliminates opposite corner', () => {
    const masks = Array<number>(81).fill(0);
    masks[UR.c00] = candidateMask(1, 2);
    masks[UR.c03] = candidateMask(1, 2, 3, 4);
    masks[UR.c10] = candidateMask(1, 2, 5, 6);
    masks[UR.c13] = candidateMask(1, 2);
    const step = hiddenUniqueRectangle.apply(gridFromState('0'.repeat(81), masks));
    expect(step?.strategyId).toBe('hidden-unique-rectangle');
    expect(step?.eliminations.length).toBeGreaterThan(0);
  });
});

describe('P0 — full solve soundness', () => {
  it('ground-truth corpus stays sound with expanded registry', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const GT_DIR = resolve(here, '../../../data/ground-truth');
    let violations = 0;
    for (const diff of ['easy', 'medium', 'hard', 'diabolical']) {
      const file = resolve(GT_DIR, `${diff}.json`);
      if (!existsSync(file)) continue;
      const records: Array<{ puzzle: string; solution: string | null }> = JSON.parse(readFileSync(file, 'utf8'));
      for (const rec of records) {
        if (!rec.solution) continue;
        const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);
        if (!result.sound) violations += result.violations.length;
      }
    }
    expect(violations).toBe(0);
  });
});