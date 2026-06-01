/**
 * Full House (T1) — the simplest deduction: last empty cell in a house.
 *
 * If a house (row, column, or box) has exactly one empty cell, the only
 * missing digit must go there.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '最后空格', en: 'Full House' },
  difficulty: 8, // Even cheaper than naked single

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      let emptyCells: number[] = [];
      let usedMask = 0;

      for (const cell of house) {
        const v = grid.get(cell);
        if (v === 0) {
          emptyCells.push(cell);
        } else {
          usedMask |= 1 << (v - 1);
        }
      }

      if (emptyCells.length !== 1) continue;

      const cell = emptyCells[0]!;
      // Find the one missing digit (1..9 not in usedMask)
      let digit = 0;
      for (let d = 1; d <= SIZE; d++) {
        if (!(usedMask & (1 << (d - 1)))) {
          digit = d;
          break;
        }
      }
      if (digit === 0) continue; // Shouldn't happen in a valid grid

      const r = ROW_OF[cell]! + 1;
      const c = COL_OF[cell]! + 1;
      const houseType = h < 9 ? `行${h + 1}` : h < 18 ? `列${h - 8}` : `宫${h - 17}`;
      const houseTypeEn = h < 9 ? `Row ${h + 1}` : h < 18 ? `Column ${h - 8}` : `Box ${h - 17}`;

      return {
        strategyId: this.id,
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
        explanation: {
          zh: `R${r}C${c} 是${houseType}最后一个空格，只能填 ${digit}（最后空格）。`,
          en: `R${r}C${c} is the last empty cell in ${houseTypeEn}, so it must be ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
