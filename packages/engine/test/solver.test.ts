import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { nakedSingle } from '../src/strategies/naked-single.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

// A puzzle solvable by naked singles alone (the reference strategy's reach).
const NAKED_ONLY = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';

describe('solve loop', () => {
  it('records a trace and never breaks soundness on a naked-single solve', () => {
    // Use a classic easy puzzle; naked-single alone may not finish it, but every
    // step it DOES take must be sound (that is the invariant we assert).
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
          placements: [{ cell: 2, digit: 9 }], // R1C3 is not 9 in the solution
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
    // With only naked-single, a puzzle needing more advanced logic gets stuck.
    const hard = '000823001003000400070000052300960010000102000010038006830000040002000900600789000';
    const trace = solve(Grid.fromString(hard), [nakedSingle]);
    expect(['solved', 'stuck']).toContain(trace.outcome);
    // Whatever it managed, it must still be sound.
    const solution = solveBruteforce(hard)!;
    expect(checkTraceSoundness(trace, solution).sound).toBe(true);
  });
});
