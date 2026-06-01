/**
 * T1: hidden single.
 *
 * A digit that appears as a candidate in only one cell of a house (row/col/box)
 * must be placed in that cell — even if the cell has other candidates.
 */

import { CELLS, ROW_OF, COL_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let houseIdx = 0; houseIdx < HOUSES.length; houseIdx++) {
      const house = HOUSES[houseIdx]!;
      // Count occurrences of each digit (1..9) across candidate masks in this house
      const count: number[] = Array(10).fill(0);
      const lastCell: number[] = Array(10).fill(-1);

      for (const cell of house) {
        if (grid.get(cell) !== 0) continue;
        const mask = grid.candidatesOf(cell);
        for (const d of digitsOf(mask)) {
          count[d]!++;
          lastCell[d] = cell;
        }
      }

      for (let d = 1; d <= 9; d++) {
        if (count[d] === 1) {
          const cell = lastCell[d]!;
          // Only report if the cell is still empty (not already placed)
          if (grid.get(cell) === 0) {
            const r = ROW_OF[cell]! + 1;
            const c = COL_OF[cell]! + 1;
            return {
              strategyId: this.id,
              placements: [{ cell, digit: d }],
              eliminations: [],
              highlights: { cells: [cell], candidates: [{ cell, digit: d }], links: [] },
              explanation: {
                zh: `R${r}C${c} 是该宫/行/列中唯一可填 ${d} 的格子，因此填入 ${d}（隐性唯一）。`,
                en: `R${r}C${c} is the only cell in its house that can hold ${d}, so it must be ${d} (Hidden Single).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
