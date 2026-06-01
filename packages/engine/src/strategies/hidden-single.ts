/**
 * Hidden Single (T1) — a digit has only one possible cell in a house.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      // For each digit 1-9, find how many cells in the house can hold it
      for (let d = 1; d <= 9; d++) {
        let count = 0;
        let lastCell = -1;
        for (const cell of house) {
          if (grid.get(cell) !== 0) continue;
          if (grid.hasCandidate(cell, d)) {
            count++;
            lastCell = cell;
          }
        }
        if (count === 1 && lastCell !== -1) {
          const cell = lastCell;
          const digit = d;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
            explanation: {
              zh: `R${r}C${c} 是单元中唯一可以填 ${digit} 的格，因此填入 ${digit}（隐性唯一）。`,
              en: `R${r}C${c} is the only cell in its house that can be ${digit}, so it must be ${digit} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
