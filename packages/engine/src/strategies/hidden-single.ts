/**
 * Hidden Single (T1) — a digit has only one possible cell in a house.
 *
 * For each house (row, column, box) and each unsolved digit, if only one
 * empty cell in that house still contains the digit as a candidate, that
 * cell must hold that digit.
 */

import { HOUSES, SIZE, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;

      for (let d = 1; d <= SIZE; d++) {
        const bit = maskOf(d);
        let count = 0;
        let lastCell = -1;

        for (const cell of house) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            count++;
            lastCell = cell;
            if (count > 1) break;
          }
        }

        if (count !== 1) continue;

        const cell = lastCell;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;
        const houseType = h < 9 ? `行${h + 1}` : h < 18 ? `列${h - 8}` : `宫${h - 17}`;
        const houseTypeEn = h < 9 ? `Row ${h + 1}` : h < 18 ? `Column ${h - 8}` : `Box ${h - 17}`;

        return {
          strategyId: this.id,
          placements: [{ cell, digit: d }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit: d }], links: [] },
          explanation: {
            zh: `数字 ${d} 在${houseType}中只有 R${r}C${c} 一个候选位置，因此填入 ${d}（隐性唯一）。`,
            en: `Digit ${d} has only one candidate position in ${houseTypeEn}: R${r}C${c}, so it must be ${d} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
