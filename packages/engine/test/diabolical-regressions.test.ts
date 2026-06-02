import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';

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
      expect(step?.eliminations).toEqual([{ cell: 53, digit: 1 }]);
    });

    it('matches the winner common-elimination action for diabolical #103170', () => {
      const grid = gridFromState(
        '700000003032657100001000700003471900200060001010020030160040080000906000300000005',
        [0, 408, 440, 131, 385, 138, 186, 314, 0, 392, 0, 0, 0, 0, 0, 0, 264, 392, 440, 408, 0, 134, 388, 142, 0, 314, 426, 176, 144, 0, 0, 0, 0, 0, 50, 162, 0, 472, 472, 148, 0, 404, 152, 88, 0, 312, 0, 504, 144, 0, 400, 184, 0, 232, 0, 0, 320, 86, 0, 22, 6, 0, 322, 152, 218, 216, 0, 133, 0, 14, 73, 74, 0, 458, 456, 195, 129, 130, 42, 363, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 79, digit: 7 }]);
    });

    it('matches the winner contradiction action for diabolical #23835', () => {
      const grid = gridFromState(
        '065000300072935080300060002040050060206000008000106000090040020700000009600019003',
        [393, 0, 0, 202, 194, 203, 0, 329, 73, 9, 0, 0, 0, 0, 0, 41, 0, 41, 0, 129, 385, 200, 0, 201, 345, 345, 0, 385, 0, 453, 198, 0, 198, 323, 0, 65, 0, 21, 0, 76, 320, 76, 337, 341, 0, 400, 132, 452, 0, 450, 0, 330, 332, 88, 145, 0, 133, 228, 0, 196, 225, 0, 113, 0, 151, 141, 182, 130, 134, 185, 25, 0, 0, 146, 136, 210, 0, 0, 216, 88, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 29, digit: 3 }]);
    });

    it('matches the winner contradiction action for diabolical #109043', () => {
      const grid = gridFromState(
        '010705030800040005090000040157004302040000070600070401080607010061409000002050600',
        [10, 0, 40, 0, 416, 0, 386, 0, 416, 0, 70, 36, 263, 0, 35, 323, 290, 0, 86, 0, 52, 135, 165, 167, 195, 0, 224, 0, 0, 0, 384, 416, 0, 0, 416, 0, 262, 0, 388, 407, 421, 167, 400, 0, 416, 0, 6, 388, 406, 0, 134, 0, 400, 0, 284, 0, 284, 0, 6, 0, 274, 0, 268, 84, 0, 0, 0, 134, 0, 210, 146, 196, 332, 68, 0, 133, 0, 133, 0, 384, 460],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 39, digit: 8 }]);
    });

    it('matches the winner forcing action for mixed diabolical #27806', () => {
      const grid = gridFromState(
        '005700200070050080012409657009000570006175300750900006000020005000594000500607004',
        [428, 428, 0, 0, 165, 165, 0, 269, 261, 300, 0, 12, 6, 0, 39, 265, 0, 261, 132, 0, 0, 0, 132, 0, 0, 0, 0, 143, 142, 0, 134, 172, 166, 0, 0, 131, 138, 138, 0, 0, 0, 0, 0, 266, 386, 0, 0, 141, 0, 140, 134, 137, 11, 0, 429, 428, 205, 132, 0, 133, 449, 293, 0, 167, 166, 197, 0, 0, 0, 193, 39, 135, 0, 390, 133, 0, 133, 0, 385, 263, 0],
      );

      const step = forcingChain.apply(grid);

      expect(step?.strategyId).toBe('forcing-chain');
      expect(step?.placements).toEqual([]);
      expect(step?.eliminations).toEqual([{ cell: 27, digit: 3 }]);
    });
  });
});
