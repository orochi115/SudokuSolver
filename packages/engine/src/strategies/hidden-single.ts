/**
 * T1: hidden single (隐性唯一).
 *
 * A digit has exactly one possible location within a house (row/column/box).
 * Unlike naked single (cell has one candidate), here the focus is on the
 * digit's distribution across a house.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function houseName(houseIdx: number): string {
  if (houseIdx < 9) return `第 ${houseIdx + 1} 行`;
  if (houseIdx < 18) return `第 ${houseIdx - 8} 列`;
  return `第 ${houseIdx - 17} 宫`;
}

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const house = HOUSES[hi]!;
      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const possibleCells: number[] = [];
        for (const cell of house) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            possibleCells.push(cell);
          }
        }
        if (possibleCells.length !== 1) continue;

        const cell = possibleCells[0]!;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `数字 ${digit} 在 ${houseName(hi)} 中只存在于 ${r} 行 ${c} 列，填入 ${digit}（隐性唯一）。`,
            en: `Digit ${digit} can only go in R${r}C${c} within ${houseName(hi)}, so it must be ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};