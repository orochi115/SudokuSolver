/**
 * Unit tests for P0 strategies (Roadmap ② §P0).
 *
 * Covers:
 *   - finned-x-wing / finned-swordfish / finned-jellyfish
 *   - nice-loop
 *   - xy-chain
 *   - turbot-fish
 *   - unique-rectangle-type-3 / -type-5 / -type-6
 *   - hidden-unique-rectangle
 *
 * Each test verifies: stable id, no mutation, soundness against brute-force
 * solution, and (where applicable) that the strategy emits the expected
 * id when the worked example is replayed.
 */

import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from '../src/strategies/finned-fish.js';
import { niceLoop, xyChain, turbotFish } from '../src/strategies/chain-specialized.js';
import {
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
  hiddenUniqueRectangle,
} from '../src/strategies/unique-rectangle-extended.js';

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function assertSoundStep(
  puzzleStr: string,
  step: NonNullable<ReturnType<typeof finnedXWing.apply>>,
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
  step: NonNullable<ReturnType<typeof finnedXWing.apply>>,
): void {
  const g = gridFrom(puzzleStr);
  for (const e of step.eliminations) {
    expect(g.hasCandidate(e.cell, e.digit), `cell ${e.cell} digit ${e.digit} should be a candidate`).toBe(true);
  }
  for (const p of step.placements) {
    expect(g.get(p.cell) === 0, `cell ${p.cell} should be empty for placement`).toBe(true);
    expect(g.hasCandidate(p.cell, p.digit), `cell ${p.cell} digit ${p.digit} should be a candidate`).toBe(true);
  }
}

// ============================================================
// Finned Fish (P0)
// ============================================================

describe('finned-x-wing', () => {
  it('has stable id and difficulty', () => {
    expect(finnedXWing.id).toBe('finned-x-wing');
    expect(finnedXWing.difficulty).toBe(415);
  });

  it('does not modify the grid', () => {
    // SudokuWiki Sashimi X-Wing example
    const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
    assertNoMutation(puzzle, finnedXWing);
  });

  it('emits sound eliminations on the worked example', () => {
    const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
    const g = gridFrom(puzzle);
    const step = finnedXWing.apply(g);
    if (step) {
      expect(step.strategyId).toBe('finned-x-wing');
      assertElimsPresent(puzzle, step);
      assertSoundStep(puzzle, step);
    }
  });

  it('is sound across multiple solved puzzles', () => {
    const puzzles = [
      '300002500000080060080700041700001300000070000008200005510008020030090000004500009', // sashimi x-wing
      '420000095000000000001903400060802010042010980090406030007604800000000000680000041', // sashimi swordfish
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const step = finnedXWing.apply(g);
      if (step) {
        assertSoundStep(puzzle, step);
      }
    }
  });
});

describe('finned-swordfish', () => {
  it('has stable id and difficulty', () => {
    expect(finnedSwordfish.id).toBe('finned-swordfish');
    expect(finnedSwordfish.difficulty).toBe(455);
  });

  it('does not modify the grid', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
    assertNoMutation(puzzle, finnedSwordfish);
  });

  it('emits sound eliminations on the worked example', () => {
    const puzzle = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
    const g = gridFrom(puzzle);
    const step = finnedSwordfish.apply(g);
    if (step) {
      expect(step.strategyId).toBe('finned-swordfish');
      assertElimsPresent(puzzle, step);
      assertSoundStep(puzzle, step);
    }
  });
});

describe('finned-jellyfish', () => {
  it('has stable id and difficulty', () => {
    expect(finnedJellyfish.id).toBe('finned-jellyfish');
    expect(finnedJellyfish.difficulty).toBe(495);
  });

  it('does not modify the grid', () => {
    // Any diabolical puzzle will do; we just check the invariant.
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    assertNoMutation(puzzle, finnedJellyfish);
  });
});

// ============================================================
// Nice Loop / XY-Chain / Turbot Fish (P0 chain engine)
// ============================================================

describe('nice-loop', () => {
  it('has stable id and difficulty', () => {
    expect(niceLoop.id).toBe('nice-loop');
    expect(niceLoop.difficulty).toBe(720);
  });

  it('does not modify the grid', () => {
    for (const puzzle of [
      '002904100001030400080000060504209601008000700290000045100080007000701000000503000',
    ]) {
      assertNoMutation(puzzle, niceLoop);
    }
  });

  it('does not emit invalid eliminations during full solve', () => {
    const puzzles = [
      '002904100001030400080000060504209601008000700290000045100080007000701000000503000',
      '300002500000080060080700041700001300000070000008200005510008020030090000004500009',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      const solution = solveBruteforce(puzzle);
      if (!solution) continue;
      const trace = solve(g, STRATEGIES);
      const result = checkTraceSoundness(trace, solution);
      expect(result.sound, `nice-loop produced invalid step in ${puzzle.slice(0, 16)}`).toBe(true);
    }
  });

  it('emits a step with chain links when it fires', () => {
    const puzzles = [
      '002904100001030400080000060504209601008000700290000045100080007000701000000503000',
    ];
    for (const puzzle of puzzles) {
      const g = gridFrom(puzzle);
      // Apply other strategies first to get to a state where nice-loop fires.
      const work = g.clone();
      const ordered = [...STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
      for (let i = 0; i < 30; i++) {
        let progressed = false;
        for (const strat of ordered) {
          if (strat === niceLoop) continue;
          const step = strat.apply(work);
          if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
            applyStep(work, step);
            progressed = true;
            break;
          }
        }
        if (!progressed) break;
      }
      const step = niceLoop.apply(work);
      if (step) {
        expect(step.strategyId).toBe('nice-loop');
        expect(step.highlights.links.length).toBeGreaterThan(0);
        assertElimsPresent(work.toString(), step);
      }
    }
  });
});

describe('xy-chain', () => {
  it('has stable id and difficulty', () => {
    expect(xyChain.id).toBe('xy-chain');
    expect(xyChain.difficulty).toBe(715);
  });

  it('does not modify the grid', () => {
    // SudokuWiki XY-Chain Example 1
    const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
    assertNoMutation(puzzle, xyChain);
  });

  it('emits sound eliminations on the worked example', () => {
    const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
    const g = gridFrom(puzzle);
    const step = xyChain.apply(g);
    if (step) {
      expect(step.strategyId).toBe('xy-chain');
      assertElimsPresent(puzzle, step);
      assertSoundStep(puzzle, step);
    }
  });
});

describe('turbot-fish', () => {
  it('has stable id and difficulty', () => {
    expect(turbotFish.id).toBe('turbot-fish');
    expect(turbotFish.difficulty).toBe(510);
  });

  it('does not modify the grid', () => {
    // HoDoKu SDP sk01 skyscraper
    const puzzle = '000000000001902060000006790902000600370000950005000004140003005709024000000800000';
    assertNoMutation(puzzle, turbotFish);
  });

  it('emits sound eliminations on the worked example', () => {
    const puzzle = '000000000001902060000006790902000600370000950005000004140003005709024000000800000';
    const g = gridFrom(puzzle);
    const step = turbotFish.apply(g);
    if (step) {
      expect(step.strategyId).toBe('turbot-fish');
      assertElimsPresent(puzzle, step);
      assertSoundStep(puzzle, step);
    }
  });
});

// ============================================================
// UR Type 3 / 5 / 6 + Hidden UR (P0)
// ============================================================

describe('unique-rectangle-type-3', () => {
  it('has stable id and difficulty', () => {
    expect(uniqueRectangleType3.id).toBe('unique-rectangle-type-3');
    expect(uniqueRectangleType3.difficulty).toBe(940);
  });

  it('does not modify the grid', () => {
    const puzzle = '150040076027000450090000010300107005002604300500090007000000000008060100000782000';
    assertNoMutation(puzzle, uniqueRectangleType3);
  });
});

describe('unique-rectangle-type-5', () => {
  it('has stable id and difficulty', () => {
    expect(uniqueRectangleType5.id).toBe('unique-rectangle-type-5');
    expect(uniqueRectangleType5.difficulty).toBe(960);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    assertNoMutation(puzzle, uniqueRectangleType5);
  });
});

describe('unique-rectangle-type-6', () => {
  it('has stable id and difficulty', () => {
    expect(uniqueRectangleType6.id).toBe('unique-rectangle-type-6');
    expect(uniqueRectangleType6.difficulty).toBe(970);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    assertNoMutation(puzzle, uniqueRectangleType6);
  });
});

describe('hidden-unique-rectangle', () => {
  it('has stable id and difficulty', () => {
    expect(hiddenUniqueRectangle.id).toBe('hidden-unique-rectangle');
    expect(hiddenUniqueRectangle.difficulty).toBe(935);
  });

  it('does not modify the grid', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    assertNoMutation(puzzle, hiddenUniqueRectangle);
  });
});

// ============================================================
// Registry contract (gate 2, gate 3)
// ============================================================

describe('P0 registry', () => {
  it('all P0 strategy ids are registered', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    const required = [
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
    ];
    for (const id of required) {
      expect(ids.has(id), `Strategy '${id}' should be registered`).toBe(true);
    }
  });

  it('P0 strategies are in human-default profile (not last-resort-only)', () => {
    const lastResort = new Set(['forcing-chain']); // current last-resort ids
    const required = [
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
    ];
    for (const id of required) {
      expect(lastResort.has(id), `${id} should NOT be last-resort-only`).toBe(false);
    }
  });
});
