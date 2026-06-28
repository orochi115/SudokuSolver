import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import {
  cellForcingChain,
  digitForcingChain,
  nishioForcingChain,
} from '../src/strategies/p3-last-resort.js';

function gridFromState(puzzle: string, candidateMasks: readonly number[]): Grid {
  const grid = Grid.fromString(puzzle);
  grid.candidates.set(candidateMasks);
  return grid;
}

describe('P3 last-resort forcing subtypes', () => {
  it('does not let Nishio mix in common-conclusion forcing-chain eliminations', () => {
    const grid = gridFromState(
      '060040900000369000904050206005624800600915407009783000090070050006431700001590300',
      [149, 0, 196, 131, 0, 194, 0, 197, 149, 147, 147, 194, 0, 0, 0, 17, 201, 153, 0, 133, 0, 129, 0, 192, 0, 197, 0, 69, 65, 0, 0, 0, 0, 0, 261, 261, 0, 134, 134, 0, 0, 0, 0, 6, 0, 11, 11, 0, 0, 0, 0, 49, 35, 19, 142, 0, 134, 130, 0, 162, 33, 0, 139, 146, 146, 0, 0, 0, 0, 0, 386, 386, 202, 202, 0, 0, 0, 162, 0, 170, 138],
    );

    expect(cellForcingChain.apply(grid)?.eliminations).toContainEqual({ cell: 53, digit: 1 });

    const nishio = nishioForcingChain.apply(grid);
    expect(nishio?.strategyId).toBe('nishio-forcing-chain');
    expect(nishio?.eliminations).toEqual([{ cell: 54, digit: 2 }]);
  });

  it('lets Nishio claim a contradiction forcing-chain deduction', () => {
    const grid = gridFromState(
      '065000300072935080300060002040050060206000008000106000090040020700000009600019003',
      [393, 0, 0, 202, 194, 203, 0, 329, 73, 9, 0, 0, 0, 0, 0, 41, 0, 41, 0, 129, 385, 200, 0, 201, 345, 345, 0, 385, 0, 453, 198, 0, 198, 323, 0, 65, 0, 21, 0, 76, 320, 76, 337, 341, 0, 400, 132, 452, 0, 450, 0, 330, 332, 88, 145, 0, 133, 228, 0, 196, 225, 0, 113, 0, 151, 141, 182, 130, 134, 185, 25, 0, 0, 146, 136, 210, 0, 0, 216, 88, 0],
    );

    const step = nishioForcingChain.apply(grid);

    expect(step?.strategyId).toBe('nishio-forcing-chain');
    expect(step?.eliminations).toContainEqual({ cell: 29, digit: 3 });
  });

  it('keeps digit forcing separate from contradiction forcing on a mixed fixture', () => {
    const grid = gridFromState(
      '060040900000369000904050206005624800600915407009783000090070050006431700001590300',
      [149, 0, 196, 131, 0, 194, 0, 197, 149, 147, 147, 194, 0, 0, 0, 17, 201, 153, 0, 133, 0, 129, 0, 192, 0, 197, 0, 69, 65, 0, 0, 0, 0, 0, 261, 261, 0, 134, 134, 0, 0, 0, 0, 6, 0, 11, 11, 0, 0, 0, 0, 49, 35, 19, 142, 0, 134, 130, 0, 162, 33, 0, 139, 146, 146, 0, 0, 0, 0, 0, 386, 386, 202, 202, 0, 0, 0, 162, 0, 170, 138],
    );

    expect(cellForcingChain.apply(grid)?.eliminations).toEqual([{ cell: 53, digit: 1 }]);
    expect(digitForcingChain.apply(grid)?.eliminations).toEqual([{ cell: 53, digit: 1 }]);
  });
});
