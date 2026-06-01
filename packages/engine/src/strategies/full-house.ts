/**
 * Full House (T1) — 全屋唯一
 *
 * The last empty cell in a house: only one digit can go there.
 */

import { HOUSES, ROW_OF, COL_OF, maskOf, ALL_CANDIDATES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 9, // slightly cheaper than naked/hidden single

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      let emptyCount = 0;
      let emptyCell = -1;
      let usedMask = 0;

      for (const cell of house) {
        const v = grid.get(cell);
        if (v === 0) {
          emptyCount++;
          emptyCell = cell;
        } else {
          usedMask |= maskOf(v);
        }
      }

      if (emptyCount === 1 && emptyCell !== -1) {
        // The missing digit is the one not in usedMask
        const missingMask = ALL_CANDIDATES & ~usedMask;
        // Should be exactly one bit set
        if (missingMask === 0 || (missingMask & (missingMask - 1)) !== 0) continue;

        let digit = 0;
        for (let d = 1; d <= 9; d++) {
          if (missingMask & maskOf(d)) { digit = d; break; }
        }
        if (digit === 0) continue;

        const cell = emptyCell;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;

        let houseDesc: { zh: string; en: string };
        if (h < 9) {
          houseDesc = { zh: `第 ${h + 1} 行`, en: `Row ${h + 1}` };
        } else if (h < 18) {
          houseDesc = { zh: `第 ${h - 9 + 1} 列`, en: `Column ${h - 9 + 1}` };
        } else {
          houseDesc = { zh: `第 ${h - 18 + 1} 宫`, en: `Box ${h - 18 + 1}` };
        }

        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: {
            cells: [cell],
            candidates: [{ cell, digit }],
            links: [],
          },
          explanation: {
            zh: `R${r}C${c} 是${houseDesc.zh}最后一个空格，只能填 ${digit}（全屋唯一）。`,
            en: `R${r}C${c} is the last empty cell in ${houseDesc.en}, so it must be ${digit} (Full House).`,
          },
        };
      }
    }
    return null;
  },
};
