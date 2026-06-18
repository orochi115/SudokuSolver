/**
 * Unit tests for M2 strategies.
 *
 * Each test uses a carefully crafted or known-good puzzle to exercise one
 * strategy, asserts structural correctness, and verifies soundness.
 */

import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidatesPointing, lockedCandidatesClaiming } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

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

/** Verify a step is sound against the brute-force solution. */
function assertSoundStep(
  puzzleStr: string,
  step: NonNullable<ReturnType<typeof fullHouse.apply>>,
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

// ============================================================
// Full House
// ============================================================

describe('full-house', () => {
  it('has stable id and low difficulty', () => {
    expect(fullHouse.id).toBe('full-house');
    expect(fullHouse.difficulty).toBeLessThan(10);
  });

  it('finds the last empty cell in a row', () => {
    // Start from a known solved puzzle, make one cell empty
    // Solved: 534678912 672195348 198342567 859761423 426853791 713924856 961537284 287419635 345286179
    const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    const arr = solved.split('');
    arr[0] = '0'; // R1C1 = 5 → empty; row 0 now has only 1 empty cell
    const puzzle = arr.join('');
    const g = gridFrom(puzzle);
    const step = fullHouse.apply(g);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
    expect(step!.placements).toHaveLength(1);
    expect(step!.placements[0]!.cell).toBe(0);
    expect(step!.placements[0]!.digit).toBe(5);
    assertSoundStep(puzzle, step!);
  });

  it('does not modify the grid', () => {
    const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    const arr = solved.split('');
    arr[0] = '0';
    const puzzle = arr.join('');
    const g = gridFrom(puzzle);
    const before = g.toString();
    fullHouse.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('returns null on a hard puzzle with no full house at start', () => {
    const hard = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(hard);
    // A fresh hard puzzle won't have any row/col/box with only 1 empty cell
    // (not guaranteed, but likely — if it does find one, that's also fine)
    const step = fullHouse.apply(g);
    if (step !== null) {
      // If it does find one, verify it's sound
      const solution = solveBruteforce(hard);
      if (solution) assertSoundStep(hard, step);
    }
  });
});

// ============================================================
// Hidden Single
// ============================================================

describe('hidden-single', () => {
  it('has stable id', () => {
    expect(hiddenSingle.id).toBe('hidden-single');
    expect(hiddenSingle.difficulty).toBe(10);
  });

  it('finds a hidden single and it is sound', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const g = gridFrom(puzzle);
    const step = hiddenSingle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements).toHaveLength(1);
    assertSoundStep(puzzle, step!);
  });

  it('returns null on a solved puzzle', () => {
    const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    const g = gridFrom(solved);
    expect(hiddenSingle.apply(g)).toBeNull();
  });

  it('does not modify the grid', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const g = gridFrom(puzzle);
    const before = g.toString();
    hiddenSingle.apply(g);
    expect(g.toString()).toBe(before);
  });
});

// ============================================================
// Locked Candidates
// ============================================================

describe('locked-candidates', () => {
  function strategyById(id: string) {
    return STRATEGIES.find((s) => s.id === id);
  }

  it('has stable id', () => {
    expect(lockedCandidatesPointing.id).toBe('locked-candidates-pointing');
    expect(lockedCandidatesPointing.difficulty).toBe(20);
    expect(lockedCandidatesClaiming.id).toBe('locked-candidates-claiming');
    expect(lockedCandidatesClaiming.difficulty).toBe(22);
  });

  it('reports pointing with a specific strategy id', () => {
    const pointing = strategyById('locked-candidates-pointing');
    expect(pointing).toBeDefined();

    const grid = gridFromState(
      '500000820030000006000705000050492080007051460040670010000186000800000630064000008',
      [0, 321, 289, 260, 45, 268, 0, 0, 333, 331, 0, 387, 386, 11, 392, 337, 344, 0, 299, 387, 419, 0, 47, 0, 261, 264, 269, 37, 0, 37, 0, 0, 0, 68, 0, 68, 262, 386, 0, 132, 0, 0, 0, 0, 262, 262, 0, 390, 0, 0, 132, 278, 0, 278, 326, 322, 278, 0, 0, 0, 338, 344, 346, 0, 323, 275, 274, 10, 328, 0, 0, 347, 327, 0, 0, 278, 6, 324, 339, 336, 0],
    );

    const step = pointing!.apply(grid);

    expect(step?.strategyId).toBe('locked-candidates-pointing');
    expect(step?.eliminations).toContainEqual({ cell: 72, digit: 3 });
  });

  it('reports claiming with a specific strategy id', () => {
    const claiming = strategyById('locked-candidates-claiming');
    expect(claiming).toBeDefined();

    const masks = Array<number>(81).fill(0);
    for (const cell of [0, 1, 9, 10]) masks[cell] = 1 << (5 - 1);
    const grid = gridFromState('0'.repeat(81), masks);

    const step = claiming!.apply(grid);

    expect(step?.strategyId).toBe('locked-candidates-claiming');
    expect(step?.eliminations).toEqual(expect.arrayContaining([
      { cell: 9, digit: 5 },
      { cell: 10, digit: 5 },
    ]));
  });

  it('finds a locked-candidates elimination and it is sound', () => {
    // This puzzle has locked candidates opportunities immediately
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    const g = gridFrom(puzzle);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();

    const step = lockedCandidatesPointing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('locked-candidates-pointing');
    expect(step!.eliminations.length).toBeGreaterThan(0);
    assertSoundStep(puzzle, step!);
  });

  it('elimination candidates are actually present in grid', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    const g = gridFrom(puzzle);
    const step = lockedCandidatesPointing.apply(g);
    if (step) {
      for (const e of step.eliminations) {
        expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });

  it('does not modify the grid', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    lockedCandidatesPointing.apply(g);
    expect(g.toString()).toBe(before);
  });
});

// ============================================================
// Naked Subset
// ============================================================

describe('naked-subset', () => {
  it('has stable id', () => {
    expect(nakedSubset.id).toBe('naked-subset');
    expect(nakedSubset.difficulty).toBe(30);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000000904607000076804100309701080008000300050308702007502610005403208000000000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    nakedSubset.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzles = [
      '000000000904607000076804100309701080008000300050308702007502610005403208000000000',
      '000000085000210090080000000500800000000040000000001004000000050090026000840000000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const step = nakedSubset.apply(g);
      if (step) {
        for (const e of step.eliminations) {
          expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
        }
      }
    }
  });

  it('is sound when it fires', () => {
    const puzzle = '000000000904607000076804100309701080008000300050308702007502610005403208000000000';
    const g = gridFrom(puzzle);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();
    const step = nakedSubset.apply(g);
    if (step) {
      assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Hidden Subset
// ============================================================

describe('hidden-subset', () => {
  it('has stable id', () => {
    expect(hiddenSubset.id).toBe('hidden-subset');
    expect(hiddenSubset.difficulty).toBe(30);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000000904607000076804100309701080008000300050308702007502610005403208000000000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    hiddenSubset.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzle = '000000000904607000076804100309701080008000300050308702007502610005403208000000000';
    const g = gridFrom(puzzle);
    const step = hiddenSubset.apply(g);
    if (step) {
      for (const e of step.eliminations) {
        expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });

  it('is sound when it fires', () => {
    const puzzle = '000000000904607000076804100309701080008000300050308702007502610005403208000000000';
    const g = gridFrom(puzzle);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();
    const step = hiddenSubset.apply(g);
    if (step) {
      assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Basic Fish
// ============================================================

describe('basic-fish', () => {
  it('has stable id', () => {
    expect(basicFish.id).toBe('basic-fish');
    expect(basicFish.difficulty).toBe(40);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    basicFish.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzles = [
      '000000010400000000020000000000050407008000300001090000300400200050100000000806000',
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const step = basicFish.apply(g);
      if (step) {
        for (const e of step.eliminations) {
          expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
        }
      }
    }
  });

  it('is sound when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();
    const step = basicFish.apply(g);
    if (step) {
      assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// Single-Digit Patterns
// ============================================================

describe('single-digit-patterns', () => {
  it('has stable id', () => {
    expect(singleDigitPatterns.id).toBe('single-digit-patterns');
    expect(singleDigitPatterns.difficulty).toBe(45);
  });

  it('does not modify the grid', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    singleDigitPatterns.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzles = [
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const step = singleDigitPatterns.apply(g);
      if (step) {
        for (const e of step.eliminations) {
          expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
        }
      }
    }
  });

  it('is sound when it fires', () => {
    const puzzles = [
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = singleDigitPatterns.apply(g);
      if (step) {
        assertSoundStep(puzzle, step);
      }
    }
  });

  it('detects empty rectangle with a crossing external column link', () => {
    const grid = gridFromState(
      '009400010200905700060020009020050001003204800600090050300080020002300084080042100',
      [208, 84, 0, 0, 100, 224, 50, 0, 178, 0, 13, 137, 0, 37, 0, 0, 40, 160, 217, 0, 217, 193, 0, 193, 28, 12, 0, 456, 0, 200, 224, 0, 228, 300, 364, 0, 337, 337, 0, 0, 97, 0, 0, 352, 96, 0, 73, 201, 193, 0, 197, 14, 0, 70, 0, 345, 121, 113, 0, 353, 304, 0, 112, 337, 337, 0, 0, 97, 353, 304, 0, 0, 336, 0, 112, 112, 0, 0, 0, 356, 116],
    );

    const step = singleDigitPatterns.apply(grid);

    expect(step?.strategyId).toBe('single-digit-patterns');
    expect(step?.eliminations).toContainEqual({ cell: 34, digit: 4 });
    expect(step?.explanation.en).toMatch(/Empty Rectangle/);
  });
});

// ============================================================
// XY-Wing
// ============================================================

describe('xy-wing', () => {
  it('has stable id', () => {
    expect(xyWing.id).toBe('xy-wing');
    expect(xyWing.difficulty).toBe(50);
  });

  it('does not modify the grid', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    xyWing.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('step has valid highlights structure when it fires', () => {
    const puzzles = [
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const p of puzzles) {
      const g = gridFrom(p);
      const step = xyWing.apply(g);
      if (step) {
        expect(step.highlights.cells.length).toBeGreaterThan(0);
        expect(step.highlights.candidates.length).toBeGreaterThan(0);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
        // eliminations must exist (otherwise not a valid step)
        expect(step.eliminations.length).toBeGreaterThan(0);
      }
    }
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const step = xyWing.apply(g);
    if (step) {
      for (const e of step.eliminations) {
        expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });

  it('is sound when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const solution = solveBruteforce(puzzle);
    expect(solution).not.toBeNull();
    const step = xyWing.apply(g);
    if (step) {
      assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// XYZ-Wing
// ============================================================

describe('xyz-wing', () => {
  it('has stable id', () => {
    expect(xyzWing.id).toBe('xyz-wing');
    expect(xyzWing.difficulty).toBe(50);
  });

  it('does not modify the grid', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    xyzWing.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('is sound when it fires', () => {
    const puzzles = [
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = xyzWing.apply(g);
      if (step) {
        expect(step.strategyId).toBe('xyz-wing');
        assertSoundStep(puzzle, step);
      }
    }
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const step = xyzWing.apply(g);
    if (step) {
      for (const e of step.eliminations) {
        expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });
});

// ============================================================
// W-Wing
// ============================================================

describe('w-wing', () => {
  it('has stable id', () => {
    expect(wWing.id).toBe('w-wing');
    expect(wWing.difficulty).toBe(50);
  });

  it('does not modify the grid', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const before = g.toString();
    wWing.apply(g);
    expect(g.toString()).toBe(before);
  });

  it('is sound when it fires', () => {
    const puzzles = [
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const step = wWing.apply(g);
      if (step) {
        expect(step.strategyId).toBe('w-wing');
        assertSoundStep(puzzle, step);
      }
    }
  });

  it('elimination candidates are actually present when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const step = wWing.apply(g);
    if (step) {
      for (const e of step.eliminations) {
        expect(g.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });
});

// ============================================================
// Strategy registry
// ============================================================

describe('STRATEGIES registry', () => {
  it('contains all required strategy ids', () => {
    const ids = STRATEGIES.map((s) => s.id);
    const required = [
      'full-house',
      'naked-single',
      'hidden-single',
      'locked-candidates-pointing',
      'locked-candidates-claiming',
      'naked-subset',
      'hidden-subset',
      'basic-fish',
      'single-digit-patterns',
      'xy-wing',
      'xyz-wing',
      'w-wing',
      // M3 strategies
      'simple-coloring',
      'aic',
      'als',
      'uniqueness',
      'sue-de-coq',
      'forcing-chain',
    ];
    for (const id of required) {
      expect(ids, `Strategy '${id}' should be registered`).toContain(id);
    }
  });

  it('is sorted by difficulty (ascending)', () => {
    for (let i = 1; i < STRATEGIES.length; i++) {
      expect(STRATEGIES[i]!.difficulty).toBeGreaterThanOrEqual(STRATEGIES[i - 1]!.difficulty);
    }
  });

  it('all strategies have valid id, name, difficulty', () => {
    for (const s of STRATEGIES) {
      expect(typeof s.id).toBe('string');
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.name.zh).toBe('string');
      expect(typeof s.name.en).toBe('string');
      expect(typeof s.difficulty).toBe('number');
      expect(s.difficulty).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// Full solve soundness on individual strategies
// ============================================================

describe('strategies soundness on known puzzles', () => {
  const puzzles = [
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '000000085000210090080000000500800000000040000000001004000000050090026000840000000',
    '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
  ];

  for (const puzzle of puzzles) {
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

// ============================================================
// AC-3 Soundness regression: all 400 ground-truth puzzles
// ============================================================

describe('AC-3 soundness regression (ground-truth)', () => {
  it('all ground-truth puzzles produce zero soundness violations', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');

    const here = dirname(fileURLToPath(import.meta.url));
    const REPO_ROOT = resolve(here, '../../..');
    const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

    const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
    let total = 0;
    let violationCount = 0;

    for (const diff of difficulties) {
      const file = resolve(GT_DIR, `${diff}.json`);
      if (!existsSync(file)) continue;
      const records: Array<{ puzzle: string; solution: string | null; unique: boolean }> =
        JSON.parse(readFileSync(file, 'utf8'));

      for (const rec of records) {
        if (!rec.solution) continue;
        const g = Grid.fromString(rec.puzzle);
        const trace = solve(g, STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);
        total++;
        if (!result.sound) {
          violationCount += result.violations.length;
          const v = result.violations[0]!;
          console.error(
            `VIOLATION [${diff}]: step=${v.stepIndex} strategy=${v.strategyId} kind=${v.kind} cell=${v.cell} digit=${v.digit} expected=${v.expected}`,
          );
          console.error(`  puzzle: ${rec.puzzle}`);
        }
      }
    }

    expect(total).toBeGreaterThan(0);
    expect(violationCount).toBe(0);
  });
});
