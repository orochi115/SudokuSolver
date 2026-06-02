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
  });
});
