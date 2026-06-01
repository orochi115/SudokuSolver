/**
 * Full House (T1) — the last empty cell in a house.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 5,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      let emptyCell = -1;
      let emptyCount = 0;
      for (const cell of house) {
        if (grid.get(cell) === 0) {
          emptyCell = cell;
          emptyCount++;
        }
      }
      if (emptyCount === 1 && emptyCell !== -1) {
        const cell = emptyCell;
        const mask = grid.candidatesOf(cell);
        if (popcount(mask) === 1) {
          const digit = digitsOf(mask)[0]!;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
            explanation: {
              zh: `R${r}C${c} 是所在单元中唯一的空格，因此填入 ${digit}（全屋唯一）。`,
              en: `R${r}C${c} is the only empty cell in its house, so it must be ${digit} (Full House).`,
            },
          };
        }
      }
    }
    return null;
  },
};

function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}
