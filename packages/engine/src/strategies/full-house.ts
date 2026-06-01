/**
 * T1: full house.
 *
 * A house (row/column/box) with exactly one empty cell — that cell must be the
 * missing digit (Full House).  This is the simplest form of single placement.
 */

import { HOUSES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells: number[] = [];
      let filledMask = 0;
      for (const cell of house) {
        const v = grid.get(cell);
        if (v === 0) emptyCells.push(cell);
        else filledMask |= maskOf(v);
      }
      if (emptyCells.length !== 1) continue;
      const missingMask = 0x1ff & ~filledMask;
      if ((missingMask & (missingMask - 1)) !== 0) continue; // more than one missing digit

      const cell = emptyCells[0]!;
      const digit = Math.log2(missingMask) + 1;
      const r = Math.floor(cell / 9) + 1;
      const c = (cell % 9) + 1;
      return {
        strategyId: this.id,
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
        explanation: {
          zh: `第 ${r} 行第 ${c} 格是所在单元的最后一格，填入 ${digit}（全屋唯一）。`,
          en: `R${r}C${c} is the last empty cell in its house, so it must be ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};