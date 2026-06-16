import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { aic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { STRATEGIES } from '../src/strategies/index.js';

function gridFromState(puzzle: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(puzzle);
  grid.candidates.set(candidateMasks);
  return grid;
}

describe('diabolical strategy regressions', () => {
  describe('forcing-chain', () => {
    it('matches the winner common-elimination action for diabolical #88102', () => {
      const grid = gridFromState(
        '060040900000369000904050206005624800600915407009783000090070050006431700001590300',
        [149, 0, 196, 131, 0, 194, 0, 197, 149, 147, 147, 194, 0, 0, 0, 17, 201, 153, 0, 133, 0, 129, 0, 192, 0, 197, 0, 69, 65, 0, 0, 0, 0, 0, 261, 261, 0, 134, 134, 0, 0, 0, 0, 6, 0, 11, 11, 0, 0, 0, 0, 49, 35, 19, 142, 0, 134, 130, 0, 162, 33, 0, 139, 146, 146, 0, 0, 0, 0, 0, 386, 386, 202, 202, 0, 0, 0, 162, 0, 170, 138],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 53, digit: 1 });
    });

    it('matches the winner common-elimination action for diabolical #103170', () => {
      const grid = gridFromState(
        '700000003032657100001000700003471900200060001010020030160040080000906000300000005',
        [0, 408, 440, 131, 385, 138, 186, 314, 0, 392, 0, 0, 0, 0, 0, 0, 264, 392, 440, 408, 0, 134, 388, 142, 0, 314, 426, 176, 144, 0, 0, 0, 0, 0, 50, 162, 0, 472, 472, 148, 0, 404, 152, 88, 0, 312, 0, 504, 144, 0, 400, 184, 0, 232, 0, 0, 320, 86, 0, 22, 6, 0, 322, 152, 218, 216, 0, 133, 0, 14, 73, 74, 0, 458, 456, 195, 129, 130, 42, 363, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 79, digit: 7 });
    });

    it('matches the winner contradiction action for diabolical #23835', () => {
      const grid = gridFromState(
        '065000300072935080300060002040050060206000008000106000090040020700000009600019003',
        [393, 0, 0, 202, 194, 203, 0, 329, 73, 9, 0, 0, 0, 0, 0, 41, 0, 41, 0, 129, 385, 200, 0, 201, 345, 345, 0, 385, 0, 453, 198, 0, 198, 323, 0, 65, 0, 21, 0, 76, 320, 76, 337, 341, 0, 400, 132, 452, 0, 450, 0, 330, 332, 88, 145, 0, 133, 228, 0, 196, 225, 0, 113, 0, 151, 141, 182, 130, 134, 185, 25, 0, 0, 146, 136, 210, 0, 0, 216, 88, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 29, digit: 3 });
    });

    it('matches the winner contradiction action for diabolical #109043', () => {
      const grid = gridFromState(
        '010705030800040005090000040157004302040000070600070401080607010061409000002050600',
        [10, 0, 40, 0, 416, 0, 386, 0, 416, 0, 70, 36, 263, 0, 35, 323, 290, 0, 86, 0, 52, 135, 165, 167, 195, 0, 224, 0, 0, 0, 384, 416, 0, 0, 416, 0, 262, 0, 388, 407, 421, 167, 400, 0, 416, 0, 6, 388, 406, 0, 134, 0, 400, 0, 284, 0, 284, 0, 6, 0, 274, 0, 268, 84, 0, 0, 0, 134, 0, 210, 146, 196, 332, 68, 0, 133, 0, 133, 0, 384, 460],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 39, digit: 8 });
    });

    it('matches the winner forcing action for mixed diabolical #27806', () => {
      const grid = gridFromState(
        '005700200070050080012409657009000570006175300750900006000020005000594000500607004',
        [428, 428, 0, 0, 165, 165, 0, 269, 261, 300, 0, 12, 6, 0, 39, 265, 0, 261, 132, 0, 0, 0, 132, 0, 0, 0, 0, 143, 142, 0, 134, 172, 166, 0, 0, 131, 138, 138, 0, 0, 0, 0, 0, 266, 386, 0, 0, 141, 0, 140, 134, 137, 11, 0, 429, 428, 205, 132, 0, 133, 449, 293, 0, 167, 166, 197, 0, 0, 0, 193, 39, 135, 0, 390, 133, 0, 133, 0, 385, 263, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 27, digit: 3 });
    });
  });

  describe('locked-candidates', () => {
    it('matches the winner pointing action for diabolical #78760', () => {
      const grid = gridFromState(
        '500000820030000006000705000050492080007051460040670010000186000800000630064000008',
        [0, 321, 289, 260, 45, 268, 0, 0, 333, 331, 0, 387, 386, 11, 392, 337, 344, 0, 299, 387, 419, 0, 47, 0, 261, 264, 269, 37, 0, 37, 0, 0, 0, 68, 0, 68, 262, 386, 0, 132, 0, 0, 0, 0, 262, 262, 0, 390, 0, 0, 132, 278, 0, 278, 326, 322, 278, 0, 0, 0, 338, 344, 346, 0, 323, 275, 274, 10, 328, 0, 0, 347, 327, 0, 0, 278, 6, 324, 339, 336, 0],
      );

      const step = lockedCandidates.apply(grid);

      expect(step?.strategyId).toBe('locked-candidates');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toContainEqual({ cell: 72, digit: 3 });
    });

    it('matches the winner pointing action for diabolical #103170', () => {
      const grid = gridFromState(
        '700000003032657100001000700003471900200060001010020030060040080000906000300000005',
        [0, 408, 440, 131, 385, 394, 186, 314, 0, 392, 0, 0, 0, 0, 0, 0, 264, 392, 440, 408, 0, 134, 388, 398, 0, 314, 426, 176, 144, 0, 0, 0, 0, 0, 50, 162, 0, 472, 472, 148, 0, 404, 152, 88, 0, 440, 0, 504, 144, 0, 400, 184, 0, 232, 273, 0, 336, 87, 0, 22, 6, 0, 322, 153, 218, 216, 0, 133, 0, 14, 75, 74, 0, 458, 456, 195, 129, 130, 42, 363, 0],
      );

      const step = lockedCandidates.apply(grid);

      expect(step?.strategyId).toBe('locked-candidates');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual(expect.arrayContaining([{ cell: 54, digit: 5 }, { cell: 56, digit: 5 }]));
    });

    it('matches the original sonnet46 pointing action for diabolical #36186', () => {
      const grid = gridFromState(
        '200900060090000500005100000306200058020030000010008237000007800002000040080004003',
        [0, 76, 205, 0, 216, 20, 77, 0, 9, 233, 0, 205, 236, 234, 38, 0, 195, 11, 232, 108, 0, 0, 234, 38, 332, 450, 266, 0, 72, 0, 0, 329, 257, 265, 0, 0, 472, 0, 456, 120, 0, 305, 297, 257, 297, 280, 0, 264, 56, 312, 0, 0, 0, 0, 313, 60, 269, 52, 307, 0, 0, 259, 307, 369, 116, 0, 180, 433, 309, 353, 0, 305, 369, 0, 321, 48, 307, 0, 353, 323, 0],
      );

      const step = lockedCandidates.apply(grid);

      expect(step?.strategyId).toBe('locked-candidates');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual(expect.arrayContaining([
        { cell: 54, digit: 5 },
        { cell: 63, digit: 5 },
        { cell: 72, digit: 5 },
        { cell: 39, digit: 6 },
        { cell: 41, digit: 6 },
        { cell: 13, digit: 2 },
        { cell: 22, digit: 2 },
      ]));
    });

    it('solves diabolical #36186 with a sound trace', () => {
      const puzzle = '200900060090000500005100000306200050000030000010008207000007800002000040080004003';
      const solution = '243985761197463582865172394376241958528739416419658237654317829732896145981524673';

      const trace = solve(Grid.fromString(puzzle), STRATEGIES);

      expect(trace.outcome).toBe('solved');
      expect(checkTraceSoundness(trace, solution).sound).toBe(true);
    });

    it('solves diabolical #38116 with a sound trace', () => {
      const puzzle = '706000304009000800800000002000169000060050070000207000007000400200405007300706008';
      const solution = '726581394149372856835694712578169243462853179913247685657928431281435967394716528';

      const trace = solve(Grid.fromString(puzzle), STRATEGIES);

      expect(trace.outcome).toBe('solved');
      expect(checkTraceSoundness(trace, solution).sound).toBe(true);
    });

    it('solves diabolical #77633 with a sound trace', () => {
      const puzzle = '010000020600040008082030460040502010000000000900060007100050002060000080020904050';
      const solution = '413685729679241538582739461847592613236417895951368247194856372765123984328974156';

      const trace = solve(Grid.fromString(puzzle), STRATEGIES);

      expect(trace.outcome).toBe('solved');
      expect(checkTraceSoundness(trace, solution).sound).toBe(true);
    });
  });

  describe('als', () => {
    it('includes the winner ALS eliminations for diabolical #38116', () => {
      const grid = gridFromState(
        '706000304009070800800000702070169000060050070000207000607000400200405007300706008',
        [0, 19, 0, 400, 387, 131, 0, 273, 0, 25, 31, 0, 52, 0, 15, 0, 49, 49, 0, 29, 29, 308, 269, 13, 0, 305, 0, 24, 0, 158, 0, 0, 0, 18, 136, 20, 265, 0, 135, 132, 0, 140, 259, 0, 261, 273, 157, 157, 0, 140, 0, 305, 136, 309, 0, 401, 0, 388, 391, 135, 0, 23, 273, 0, 385, 129, 0, 389, 0, 289, 37, 0, 0, 281, 25, 0, 259, 0, 273, 19, 0],
      );

      const step = als.apply(grid);

      expect(step?.strategyId).toBe('als');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual(expect.arrayContaining([
        { cell: 53, digit: 3 },
        { cell: 9, digit: 4 },
      ]));
    });

    it('includes the winner ALS eliminations for diabolical #77633', () => {
      const grid = gridFromState(
        '010000020600240008082030460040502010200000000900060207100050002060020080020904050',
        [92, 0, 348, 224, 448, 496, 340, 0, 276, 0, 340, 340, 0, 0, 337, 341, 324, 0, 80, 0, 0, 65, 0, 337, 0, 0, 273, 196, 0, 228, 0, 448, 0, 420, 0, 292, 0, 68, 229, 205, 449, 453, 436, 268, 316, 0, 20, 149, 141, 0, 133, 0, 12, 0, 0, 324, 332, 160, 0, 160, 324, 332, 0, 88, 0, 344, 69, 0, 69, 321, 0, 265, 196, 0, 196, 0, 65, 0, 101, 0, 37],
      );

      const step = als.apply(grid);

      expect(step?.strategyId).toBe('als');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual(expect.arrayContaining([
        { cell: 38, digit: 3 },
        { cell: 46, digit: 3 },
        { cell: 47, digit: 3 },
        { cell: 38, digit: 7 },
        { cell: 42, digit: 3 },
        { cell: 44, digit: 3 },
        { cell: 44, digit: 4 },
        { cell: 42, digit: 9 },
        { cell: 44, digit: 9 },
      ]));
    });
  });

  describe('aic', () => {
    it('matches the winner peer-endpoint elimination for diabolical #13829', () => {
      const grid = gridFromState(
        '700000500001500300000060098040027901000905000900800020680030000003002600009000034',
        [0, 294, 170, 15, 384, 397, 0, 41, 34, 138, 290, 0, 0, 448, 392, 0, 104, 98, 30, 22, 26, 79, 0, 13, 75, 0, 0, 148, 0, 176, 36, 0, 0, 0, 176, 0, 135, 103, 226, 0, 9, 0, 200, 232, 100, 0, 117, 112, 0, 9, 36, 72, 0, 116, 0, 0, 90, 73, 0, 265, 67, 81, 338, 25, 81, 0, 73, 464, 0, 0, 209, 336, 19, 83, 0, 97, 208, 161, 195, 0, 0],
      );

      const step = aic.apply(grid);

      expect(step?.strategyId).toBe('aic');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 3, digit: 1 }]);
    });

    it('matches the winner peer-endpoint elimination for diabolical #38116', () => {
      const grid = gridFromState(
        '706000304009070800800000702070169000060050070000207000607000400200405007300706008',
        [0, 19, 0, 400, 387, 131, 0, 273, 0, 25, 31, 0, 52, 0, 15, 0, 49, 49, 0, 29, 29, 308, 269, 13, 0, 305, 0, 24, 0, 158, 0, 0, 0, 18, 136, 20, 265, 0, 143, 132, 0, 140, 259, 0, 261, 281, 157, 157, 0, 140, 0, 305, 136, 309, 0, 401, 0, 388, 391, 135, 0, 23, 273, 0, 385, 129, 0, 389, 0, 289, 37, 0, 0, 281, 25, 0, 259, 0, 273, 19, 0],
      );

      const step = aic.apply(grid);

      expect(step?.strategyId).toBe('aic');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 38, digit: 4 }]);
    });

    it('matches the winner selected elimination for diabolical #77633', () => {
      const grid = gridFromState(
        '010000020600240008082030460040502010200000000900060207100050002060020080020904050',
        [92, 0, 348, 224, 448, 496, 340, 0, 276, 0, 340, 340, 0, 0, 337, 341, 324, 0, 80, 0, 0, 65, 0, 337, 0, 0, 273, 196, 0, 228, 0, 448, 0, 420, 0, 292, 0, 68, 229, 205, 449, 453, 436, 268, 316, 0, 20, 149, 141, 0, 133, 0, 12, 0, 0, 324, 460, 228, 0, 228, 324, 332, 0, 92, 0, 348, 69, 0, 69, 325, 0, 269, 196, 0, 196, 0, 193, 0, 101, 0, 37],
      );

      const step = aic.apply(grid);

      expect(step?.strategyId).toBe('aic');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 56, digit: 8 }]);
    });
  });
});
