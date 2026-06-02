/**
 * Unit tests for M3 strategies (T4 advanced).
 *
 * Each test verifies:
 *   1. Stable strategy id and difficulty band
 *   2. Grid is not mutated
 *   3. Returned eliminations/placements are actually present in the grid
 *   4. Soundness: step is consistent with brute-force solution
 */

import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { aic, makeAic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { uniqueness } from '../src/strategies/uniqueness.js';
import { sueDeCoq } from '../src/strategies/sue-de-coq.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';

// ============================================================
// Helpers
// ============================================================

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function gridFromState(s: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(s);
  grid.candidates.set(candidateMasks);
  return grid;
}

function assertSoundStep(
  puzzleStr: string,
  step: NonNullable<ReturnType<typeof simpleColoring.apply>>,
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
  if (!result.sound) {
    console.error('Soundness violations:', result.violations);
  }
  expect(result.sound).toBe(true);
}

function assertNoMutation(puzzleStr: string, strategy: { apply: (g: Grid) => unknown }): void {
  const g = gridFrom(puzzleStr);
  const before = g.toString();
  strategy.apply(g);
  expect(g.toString()).toBe(before);
}

function assertElimsPresent(
  puzzleStr: string,
  step: NonNullable<ReturnType<typeof simpleColoring.apply>>,
): void {
  const g = gridFrom(puzzleStr);
  for (const e of step.eliminations) {
    expect(g.hasCandidate(e.cell, e.digit), `cell ${e.cell} digit ${e.digit} should be a candidate`).toBe(true);
  }
}

// Hard/diabolical puzzles that require T4 strategies
const HARD_PUZZLES = [
  '000089021009250000004107000500070008020000090800090004000306500000015400750940000',
  '003004050260080340040000001400090000090608010000070009100000070089010026050200100',
  '308100000240009000700230500004002000020010090000500700007026003000400062000001807',
  '000003106500000000030100780002009807070020030805600400059008070000000005703200000',
  '004006070500070000003290508300000400059060720002000005405039200000040007020100300',
];

// ============================================================
// Simple Coloring
// ============================================================

describe('simple-coloring', () => {
  it('has stable id and difficulty in band 60', () => {
    expect(simpleColoring.id).toBe('simple-coloring');
    expect(simpleColoring.difficulty).toBeGreaterThanOrEqual(55);
    expect(simpleColoring.difficulty).toBeLessThanOrEqual(65);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, simpleColoring);
    }
  });

  it('eliminations are present in grid when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = simpleColoring.apply(g);
      if (step) assertElimsPresent(puzzle, step);
    }
  });

  it('is sound when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = simpleColoring.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });

  it('step has valid highlights structure', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = simpleColoring.apply(g);
      if (step) {
        expect(step.strategyId).toBe('simple-coloring');
        expect(step.highlights.cells.length).toBeGreaterThan(0);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
        expect(step.placements.length + step.eliminations.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================
// AIC (Alternating Inference Chains)
// ============================================================

describe('aic', () => {
  it('has stable id and difficulty in band 70', () => {
    expect(aic.id).toBe('aic');
    expect(aic.difficulty).toBeGreaterThanOrEqual(65);
    expect(aic.difficulty).toBeLessThanOrEqual(75);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, aic);
    }
  });

  it('eliminations are present in grid when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = aic.apply(g);
      if (step) assertElimsPresent(puzzle, step);
    }
  });

  it('is sound when it fires on initial grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = aic.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });

  it('detects grouped X-Chain eliminations from restored divergence states', () => {
    const cases = [
      {
        grid: '000010000053204960600050002000000000000908000039020480800030004046000310305401800',
        masks: [330, 450, 202, 228, 0, 356, 80, 92, 212, 65, 0, 0, 0, 192, 0, 0, 0, 193, 0, 449, 201, 196, 0, 324, 65, 76, 0, 91, 227, 203, 117, 104, 116, 115, 338, 369, 91, 99, 75, 0, 104, 0, 115, 86, 117, 81, 0, 0, 113, 0, 112, 0, 0, 113, 0, 323, 67, 112, 0, 114, 114, 338, 0, 322, 0, 0, 208, 448, 82, 0, 0, 336, 0, 322, 0, 0, 352, 0, 0, 322, 352],
        expectedEliminations: [{ cell: 80, digit: 6 }],
      },
      {
        grid: '900000006004907800070000950100000009007196500095080200000302100010509030300010005',
        masks: [0, 146, 135, 138, 30, 153, 76, 74, 0, 50, 54, 0, 0, 54, 0, 0, 3, 7, 162, 0, 167, 170, 46, 141, 0, 0, 14, 0, 172, 164, 74, 94, 28, 108, 232, 0, 138, 142, 0, 0, 0, 0, 0, 136, 140, 40, 0, 0, 72, 0, 12, 0, 105, 77, 248, 184, 416, 0, 104, 0, 0, 488, 200, 234, 0, 162, 0, 104, 0, 104, 0, 202, 0, 42, 290, 232, 0, 136, 104, 362, 0],
        expectedEliminations: [{ cell: 33, digit: 7 }, { cell: 34, digit: 7 }, { cell: 48, digit: 7 }],
      },
      {
        grid: '300200108000018300861359400048000031003001500610003840089730610036100000100006003',
        masks: [0, 272, 24, 0, 104, 72, 0, 304, 0, 346, 338, 90, 40, 0, 0, 0, 304, 304, 0, 0, 0, 0, 0, 0, 0, 66, 66, 338, 0, 0, 304, 354, 82, 322, 0, 0, 322, 322, 0, 136, 136, 0, 0, 354, 354, 0, 0, 82, 272, 322, 0, 0, 0, 322, 26, 0, 0, 0, 0, 26, 0, 0, 26, 90, 0, 0, 0, 394, 26, 322, 466, 346, 0, 82, 90, 408, 394, 0, 322, 466, 0],
        expectedEliminations: [{ cell: 2, digit: 4 }],
      },
    ];

    for (const item of cases) {
      const step = aic.apply(gridFromState(item.grid, item.masks));
      expect(step?.strategyId).toBe('aic');
      for (const expected of item.expectedEliminations) {
        expect(step?.eliminations).toContainEqual(expected);
      }
      expect(step?.explanation.en).toMatch(/X-Chain|AIC/);
    }
  });

  it('falls back to legacy AIC search when grouped search is bounded out', () => {
    const legacyOnlyAic = makeAic({
      maxChainLength: 1,
      maxForcingWidth: 2,
      allowCellForcing: true,
      allowDigitForcing: true,
      allowNets: false,
      allowUniqueness: true,
    });

    const step = legacyOnlyAic.apply(gridFrom('000089021009250000004107000500070008020000090800090004000306500000015400750940000'));

    expect(step?.strategyId).toBe('aic');
    expect(step?.placements.length || step?.eliminations.length).toBeGreaterThan(0);
  });

  it('full solve trace is sound for diabolical puzzles', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const trace = solve(g, STRATEGIES);
      const result = checkTraceSoundness(trace, solution);
      if (!result.sound) {
        console.error('Violations:', result.violations.slice(0, 3));
      }
      expect(result.sound).toBe(true);
    }
  });

  it('step has valid highlights with links', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = aic.apply(g);
      if (step) {
        expect(step.strategyId).toBe('aic');
        expect(step.highlights.links.length).toBeGreaterThan(0);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================
// ALS (Almost Locked Sets)
// ============================================================

describe('als', () => {
  it('has stable id and difficulty in band 80', () => {
    expect(als.id).toBe('als');
    expect(als.difficulty).toBeGreaterThanOrEqual(75);
    expect(als.difficulty).toBeLessThanOrEqual(85);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, als);
    }
  });

  it('eliminations are present in grid when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = als.apply(g);
      if (step) assertElimsPresent(puzzle, step);
    }
  });

  it('is sound when it fires on initial grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = als.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });

  it('step has valid highlights structure', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = als.apply(g);
      if (step) {
        expect(step.strategyId).toBe('als');
        expect(step.highlights.cells.length).toBeGreaterThan(0);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================
// Uniqueness
// ============================================================

describe('uniqueness', () => {
  it('has stable id and difficulty in band 90', () => {
    expect(uniqueness.id).toBe('uniqueness');
    expect(uniqueness.difficulty).toBeGreaterThanOrEqual(85);
    expect(uniqueness.difficulty).toBeLessThanOrEqual(95);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, uniqueness);
    }
  });

  it('eliminations are present in grid when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = uniqueness.apply(g);
      if (step) assertElimsPresent(puzzle, step);
    }
  });

  it('is sound when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = uniqueness.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Sue de Coq
// ============================================================

describe('sue-de-coq', () => {
  it('has stable id and difficulty in band 95', () => {
    expect(sueDeCoq.id).toBe('sue-de-coq');
    expect(sueDeCoq.difficulty).toBeGreaterThanOrEqual(92);
    expect(sueDeCoq.difficulty).toBeLessThanOrEqual(98);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, sueDeCoq);
    }
  });

  it('eliminations are present in grid when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = sueDeCoq.apply(g);
      if (step) assertElimsPresent(puzzle, step);
    }
  });

  it('is sound when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = sueDeCoq.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Forcing Chain
// ============================================================

describe('forcing-chain', () => {
  it('has stable id and difficulty 100', () => {
    expect(forcingChain.id).toBe('forcing-chain');
    expect(forcingChain.difficulty).toBe(100);
  });

  it('does not modify the grid', () => {
    for (const puzzle of HARD_PUZZLES) {
      assertNoMutation(puzzle, forcingChain);
    }
  });

  it('placements are valid candidates when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const step = forcingChain.apply(g);
      if (step) {
        for (const p of step.placements) {
          expect(g.get(p.cell)).toBe(0);
          expect(g.hasCandidate(p.cell, p.digit)).toBe(true);
        }
        for (const e of step.eliminations) {
          expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
        }
      }
    }
  });

  it('is sound when it fires', () => {
    for (const puzzle of HARD_PUZZLES) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = forcingChain.apply(g);
      if (step) assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Full solve soundness on diabolical puzzles
// ============================================================

describe('M3 full solve soundness on diabolical puzzles', () => {
  for (const puzzle of HARD_PUZZLES) {
    it(`solve trace is sound for ${puzzle.slice(0, 20)}...`, () => {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      expect(solution).not.toBeNull();
      const trace = solve(g, STRATEGIES);
      const result = checkTraceSoundness(trace, solution!);
      if (!result.sound) {
        console.error('Violations:', result.violations.slice(0, 3));
      }
      expect(result.sound).toBe(true);
    });
  }
});
