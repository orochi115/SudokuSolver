/**
 * Roadmap ② gates 4, 5 & 8: tie-break determinism, default precedence, granularity.
 *
 * These are fixture-free contract tests: they replay real solves and assert the
 * engine's selection semantics rather than hand-picking restored states.
 */
import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { GRANULARITY_EXCEPTION_IDS } from '../src/strategies/granularity-exceptions.js';

// A spread of puzzles (easy → diabolical). Whether they fully solve under
// human-default is irrelevant — the loop runs until solved or stuck, which is
// enough to exercise selection at many intermediate states.
const PUZZLES = [
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  '000000085000210090080000000500800000000040000000001004000000050090026000840000000',
  '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
  '200900060090000500005100000306200050000030000010008207000007800002000040080004003',
];

const ordered = [...HUMAN_DEFAULT_STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
const diffOf = new Map(STRATEGIES.map((s) => [s.id, s.difficulty]));

function nonEmptyStep(grid: Grid, strat: (typeof ordered)[number]) {
  const step = strat.apply(grid);
  return step && (step.placements.length > 0 || step.eliminations.length > 0) ? step : null;
}

describe('gate 8 — default precedence (lowest-difficulty / canonical owner wins)', () => {
  for (const puzzle of PUZZLES) {
    it(`each step picks a minimum-difficulty firing strategy for ${puzzle.slice(0, 16)}…`, () => {
      const trace = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
      const work = Grid.fromString(puzzle);
      for (const step of trace.steps) {
        const chosen = diffOf.get(step.strategyId)!;
        // No strategy cheaper than the chosen one may also fire on this state.
        for (const strat of ordered) {
          if (strat.difficulty >= chosen) break; // ordered ascending
          expect(
            nonEmptyStep(work, strat),
            `${strat.id} (d=${strat.difficulty}) fires before chosen ${step.strategyId} (d=${chosen})`,
          ).toBeNull();
        }
        applyStep(work, step);
      }
    });
  }
});

describe('gate 4 — determinism', () => {
  for (const puzzle of PUZZLES) {
    it(`solve is byte-identical across runs for ${puzzle.slice(0, 16)}…`, () => {
      const a = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
      const b = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
      expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
      expect(a.outcome).toBe(b.outcome);
      expect(a.final).toBe(b.final);
    });
  }

  it('apply() is deterministic per strategy on a fixed state', () => {
    const grid = Grid.fromString(PUZZLES[3]!);
    for (const strat of ordered) {
      const first = strat.apply(grid);
      const second = strat.apply(grid);
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    }
  });
});

describe('gate 5 — step granularity exceptions', () => {
  it('every declared granularity exception is a registered strategy', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    for (const id of GRANULARITY_EXCEPTION_IDS) expect(ids.has(id)).toBe(true);
  });

  it('currently no cross-instance merge exceptions exist', () => {
    expect(GRANULARITY_EXCEPTION_IDS.size).toBe(0);
  });
});
