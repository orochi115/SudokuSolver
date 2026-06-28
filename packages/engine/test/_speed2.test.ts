import { describe, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';

describe('speed check solve', () => {
  it('run all 4 puzzles', () => {
    const puzzles = [
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
      '000000085000210090080000000500800000000040000000001004000000050090026000840000000',
      '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
      '200900060090000500005100000306200050000030000010008207000007800002000040080004003',
    ];
    for (const puzzle of puzzles) {
      const start = Date.now();
      const trace = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
      const elapsed = Date.now() - start;
      console.log(puzzle.slice(0, 16) + '...', trace.outcome, trace.steps.length + ' steps', elapsed + 'ms');
    }
  });
});
