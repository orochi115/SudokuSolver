/**
 * T1: Full House.
 *
 * A house (row/column/box) with exactly one empty cell left — that cell
 * must be filled with the missing digit.
 */

import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
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
      let usedMask = 0;
      for (const cell of house) {
        const v = grid.get(cell);
        if (v === 0) emptyCells.push(cell);
        else usedMask |= 1 << (v - 1);
      }
      if (emptyCells.length === 1 && popcount(~usedMask & 0x1ff) === 1) {
        const cell = emptyCells[0]!;
        const missingDigit = digitsOf(~usedMask & 0x1ff)[0]!;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;
        return {
          strategyId: this.id,
          placements: [{ cell, digit: missingDigit }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit: missingDigit }], links: [] },
          explanation: {
            zh: `R${r}C${c} 是本单元（行/列/宫）唯一的空格，填入缺失的数字 ${missingDigit}（全屋唯一）。`,
            en: `R${r}C${c} is the only empty cell in its house, so it must be ${missingDigit} (Full House).`,
          },
        };
      }
    }
    return null;
  },
};
