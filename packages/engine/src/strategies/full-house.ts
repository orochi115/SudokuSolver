import { CELLS, ROW_OF, COL_OF, HOUSES, ALL_CANDIDATES, digitsOf, maskOf } from '../grid.js';
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
      let empty = 0;
      let emptyCell = -1;
      let seen = 0;
      for (const c of house) {
        const v = grid.get(c);
        if (v === 0) {
          empty++;
          emptyCell = c;
        } else {
          seen |= maskOf(v);
        }
      }
      if (empty !== 1) continue;
      const missing = digitsOf(ALL_CANDIDATES & ~seen);
      if (missing.length !== 1) continue;
      const digit = missing[0]!;
      const r = ROW_OF[emptyCell]! + 1;
      const c = COL_OF[emptyCell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell: emptyCell, digit }],
        eliminations: [],
        highlights: { cells: [emptyCell], candidates: [{ cell: emptyCell, digit }], links: [] },
        explanation: {
          zh: `第${Math.floor(h/9)+1}${h<9?'行':h<18?'列':'宫'} 只剩 R${r}C${c} 一格，缺失数字 ${digit}，因此填入 ${digit}（全屋唯一）。`,
          en: `House ${h} has only R${r}C${c} empty; missing digit ${digit}, so place ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
