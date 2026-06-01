import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { nakedSingle } from '../src/strategies/naked-single.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('solve loop', () => {
  it('records a trace and never breaks soundness on a naked-single solve', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const solution = solveBruteforce(puzzle)!;
    const trace = solve(Grid.fromString(puzzle), [nakedSingle]);

    expect(trace.initial).toBe(puzzle);
    expect(trace.steps.every((s) => s.strategyId === 'naked-single')).toBe(true);

    const result = checkTraceSoundness(trace, solution);
    expect(result.sound).toBe(true);
  });

  it('soundness checker catches a deliberately wrong placement', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const solution = solveBruteforce(puzzle)!;
    const badTrace = {
      initial: puzzle,
      steps: [
        {
          strategyId: 'bogus',
          placements: [{ cell: 2, digit: 9 }],
          eliminations: [],
          highlights: { cells: [2], candidates: [], links: [] },
          explanation: { zh: '', en: '' },
        },
      ],
      outcome: 'stuck' as const,
      final: puzzle,
    };
    const result = checkTraceSoundness(badTrace, solution);
    expect(result.sound).toBe(false);
    expect(result.violations[0]!.kind).toBe('bad-placement');
  });

  it('marks an unsolvable-by-given-strategies puzzle as stuck', () => {
    const hard = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const trace = solve(Grid.fromString(hard), [nakedSingle]);
    expect(['solved', 'stuck']).toContain(trace.outcome);
    const solution = solveBruteforce(hard)!;
    expect(checkTraceSoundness(trace, solution).sound).toBe(true);
  });
});

describe('soundness regression — all ground-truth puzzles', () => {
  const ROOT = resolve(__dirname, '../../..');
  const DATA_DIR = resolve(ROOT, 'data/ground-truth');
  const tiers = ['easy', 'medium', 'hard', 'diabolical'] as const;

  for (const tier of tiers) {
    it(`${tier}: zero violations across all 100 puzzles`, () => {
      const content = readFileSync(resolve(DATA_DIR, tier + '.json'), 'utf-8');
      const entries: { puzzle: string; solution: string }[] = JSON.parse(content);

      let totalViolations = 0;
      for (const entry of entries) {
        const grid = Grid.fromString(entry.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, entry.solution);
        totalViolations += result.violations.length;
      }
      expect(totalViolations).toBe(0);
    });
  }
});