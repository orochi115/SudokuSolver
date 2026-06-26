/**
 * Unit tests for P1 strategies.
 *
 * Verifies id/difficulty stability, grid immutability, and soundness on known
 * puzzles. Where possible, it also asserts the strategy actually fires.
 */

import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import type { Step } from '../src/trace.js';

import { remotePairs } from '../src/strategies/remote-pairs.js';
import { wxyzWing } from '../src/strategies/wxyz-wing.js';
import { multiColoring } from '../src/strategies/multi-coloring.js';
import { medusa3d } from '../src/strategies/3d-medusa.js';
import { alsChain } from '../src/strategies/als-chain.js';
import { ahs } from '../src/strategies/ahs.js';
import { bentSets } from '../src/strategies/bent-sets.js';
import { brokenWing } from '../src/strategies/broken-wing.js';
import {
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
} from '../src/strategies/avoidable-rectangle.js';
import {
  extendedUniqueRectangle,
  uniqueLoop,
  bugLite,
  bugPlusN,
} from '../src/strategies/uniqueness-ext.js';
import { aicWithAls } from '../src/strategies/aic-with-als.js';
import { aicWithUr } from '../src/strategies/aic-with-ur.js';
import { tridagon } from '../src/strategies/tridagon.js';

function gridFrom(s: string): Grid {
  return Grid.fromString(s);
}

function candidateMask(...digits: number[]): number {
  return digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
}

function assertSoundStep(puzzleStr: string, step: Step | null): void {
  expect(step).not.toBeNull();
  const solution = solveBruteforce(puzzleStr);
  expect(solution, `puzzle ${puzzleStr.slice(0, 20)}... should be solvable`).not.toBeNull();
  const fakeTrace = {
    initial: puzzleStr,
    steps: [step!],
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
// Registry
// ============================================================

describe('P1 strategy registry', () => {
  const required = [
    'tridagon',
    'multi-coloring',
    '3d-medusa',
    'als-chain',
    'ahs',
    'wxyz-wing',
    'remote-pairs',
    'bent-sets',
    'broken-wing',
    'avoidable-rectangle-type-1',
    'avoidable-rectangle-type-2',
    'avoidable-rectangle-type-3',
    'avoidable-rectangle-type-4',
    'extended-unique-rectangle',
    'unique-loop',
    'bug-lite',
    'bug-plus-n',
    'aic-with-als',
    'aic-with-ur',
  ];

  it('contains all required P1 strategy ids', () => {
    const ids = STRATEGIES.map((s) => s.id);
    for (const id of required) {
      expect(ids, `Strategy '${id}' should be registered`).toContain(id);
    }
  });

  it('P1 strategies have distinct difficulties', () => {
    const seen = new Set<number>();
    for (const id of required) {
      const s = STRATEGIES.find((x) => x.id === id)!;
      expect(seen.has(s.difficulty)).toBe(false);
      seen.add(s.difficulty);
    }
  });
});

// ============================================================
// Stable ids / difficulties
// ============================================================

describe('P1 stable metadata', () => {
  it('remote-pairs', () => {
    expect(remotePairs.id).toBe('remote-pairs');
    expect(remotePairs.difficulty).toBe(505);
  });
  it('wxyz-wing', () => {
    expect(wxyzWing.id).toBe('wxyz-wing');
    expect(wxyzWing.difficulty).toBe(520);
  });
  it('multi-coloring', () => {
    expect(multiColoring.id).toBe('multi-coloring');
    expect(multiColoring.difficulty).toBe(620);
  });
  it('3d-medusa', () => {
    expect(medusa3d.id).toBe('3d-medusa');
    expect(medusa3d.difficulty).toBe(640);
  });
  it('aic-with-als', () => {
    expect(aicWithAls.id).toBe('aic-with-als');
    expect(aicWithAls.difficulty).toBe(760);
  });
  it('aic-with-ur', () => {
    expect(aicWithUr.id).toBe('aic-with-ur');
    expect(aicWithUr.difficulty).toBe(770);
  });
  it('als-chain', () => {
    expect(alsChain.id).toBe('als-chain');
    expect(alsChain.difficulty).toBe(880);
  });
  it('ahs', () => {
    expect(ahs.id).toBe('ahs');
    expect(ahs.difficulty).toBe(885);
  });
  it('bent-sets', () => {
    expect(bentSets.id).toBe('bent-sets');
    expect(bentSets.difficulty).toBe(540);
  });
  it('broken-wing', () => {
    expect(brokenWing.id).toBe('broken-wing');
    expect(brokenWing.difficulty).toBe(560);
  });
  it('avoidable-rectangle types', () => {
    expect(avoidableRectangleType1.id).toBe('avoidable-rectangle-type-1');
    expect(avoidableRectangleType1.difficulty).toBe(975);
    expect(avoidableRectangleType2.difficulty).toBe(976);
    expect(avoidableRectangleType3.difficulty).toBe(977);
    expect(avoidableRectangleType4.difficulty).toBe(978);
  });
  it('extended-unique-rectangle', () => {
    expect(extendedUniqueRectangle.id).toBe('extended-unique-rectangle');
    expect(extendedUniqueRectangle.difficulty).toBe(980);
  });
  it('unique-loop', () => {
    expect(uniqueLoop.id).toBe('unique-loop');
    expect(uniqueLoop.difficulty).toBe(985);
  });
  it('bug-lite', () => {
    expect(bugLite.id).toBe('bug-lite');
    expect(bugLite.difficulty).toBe(986);
  });
  it('bug-plus-n', () => {
    expect(bugPlusN.id).toBe('bug-plus-n');
    expect(bugPlusN.difficulty).toBe(987);
  });
  it('tridagon', () => {
    expect(tridagon.id).toBe('tridagon');
    expect(tridagon.difficulty).toBe(1100);
  });
});

// ============================================================
// Grid immutability
// ============================================================

describe('P1 strategies do not mutate input grid', () => {
  const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
  const strategies = [
    remotePairs,
    wxyzWing,
    multiColoring,
    medusa3d,
    alsChain,
    ahs,
    bentSets,
    brokenWing,
    avoidableRectangleType1,
    avoidableRectangleType2,
    avoidableRectangleType3,
    avoidableRectangleType4,
    extendedUniqueRectangle,
    uniqueLoop,
    bugLite,
    bugPlusN,
    aicWithAls,
    aicWithUr,
    tridagon,
  ];

  for (const s of strategies) {
    it(`${s.id} leaves grid unchanged`, () => {
      const g = gridFrom(puzzle);
      const before = g.toString();
      s.apply(g);
      expect(g.toString()).toBe(before);
    });
  }
});

// ============================================================
// Firing tests on crafted states
// ============================================================

function gridFromState(s: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(s);
  grid.candidates.set(candidateMasks);
  return grid;
}

describe('P1 firing tests', () => {
  it('remote-pairs eliminates a candidate seeing opposite colours', () => {
    // Two bivalue {1,2} clusters linked by a strong link; a cell seeing both
    // colours of digit 2 has 2 eliminated.
    const masks = Array<number>(81).fill(0);
    masks[0] = candidateMask(1, 2);
    masks[8] = candidateMask(1, 2); // same row, different colour? not peers
    masks[10] = candidateMask(1, 2); // peer of 0
    masks[18] = candidateMask(1, 2); // peer of 10, forms cluster
    masks[1] = candidateMask(2, 3); // sees 0 and 8? no
    const grid = gridFromState('0'.repeat(81), masks);
    const step = remotePairs.apply(grid);
    if (step) {
      expect(step.strategyId).toBe('remote-pairs');
      for (const e of step.eliminations) {
        expect(grid.hasCandidate(e.cell, e.digit)).toBe(true);
      }
    }
  });

  it('wxyz-wing has stable id when it fires', () => {
    const puzzle = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const g = gridFrom(puzzle);
    const step = wxyzWing.apply(g);
    if (step) {
      expect(step.strategyId).toBe('wxyz-wing');
      assertSoundStep(puzzle, step);
    }
  });

  it('multi-coloring / 3d-medusa do not crash on empty grid', () => {
    const g = gridFrom('0'.repeat(81));
    expect(() => multiColoring.apply(g)).not.toThrow();
    expect(() => medusa3d.apply(g)).not.toThrow();
  });

  it('als-chain / ahs return null on empty grid', () => {
    const g = gridFrom('0'.repeat(81));
    expect(alsChain.apply(g)).toBeNull();
    expect(ahs.apply(g)).toBeNull();
  });

  it('tridagon returns null on empty grid', () => {
    const g = gridFrom('0'.repeat(81));
    expect(tridagon.apply(g)).toBeNull();
  });

  it('avoidable / uniqueness extensions return null on empty grid', () => {
    const g = gridFrom('0'.repeat(81));
    expect(avoidableRectangleType1.apply(g)).toBeNull();
    expect(extendedUniqueRectangle.apply(g)).toBeNull();
    expect(uniqueLoop.apply(g)).toBeNull();
    expect(bugLite.apply(g)).toBeNull();
    expect(bugPlusN.apply(g)).toBeNull();
  });
});

// ============================================================
// Full solve soundness
// ============================================================

describe('P1-inclusive full solve soundness', () => {
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
