/**
 * Full House (T1) — 全屋唯一.
 *
 * A house (row, column, or box) with exactly one empty cell: that cell must
 * hold the single digit missing from the house. The simplest possible
 * deduction, so it runs first.
 */

import { HOUSES, digitsOf, cellLabel, houseLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 5,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      let empties = 0;
      let target = -1;
      for (const c of house) {
        if (grid.get(c) === 0) {
          empties++;
          target = c;
          if (empties > 1) break;
        }
      }
      if (empties !== 1) continue;

      const mask = grid.candidatesOf(target);
      const digits = digitsOf(mask);
      if (digits.length !== 1) continue; // broken grid; skip defensively
      const digit = digits[0]!;
      const hl = houseLabel(h);
      return {
        strategyId: this.id,
        placements: [{ cell: target, digit }],
        eliminations: [],
        highlights: { cells: [target], candidates: [{ cell: target, digit }], links: [] },
        explanation: {
          zh: `${hl.zh}只剩 ${cellLabel(target)} 一个空格，缺数字 ${digit}，因此填入 ${digit}（全屋唯一）。`,
          en: `${hl.en} has only ${cellLabel(target)} empty; the missing digit is ${digit}, so place ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
