import { HOUSES, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { BOX_OF, COL_OF, ROW_OF } from '../grid.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      const empties: number[] = [];
      let used = 0;
      for (const cell of house) {
        const v = grid.get(cell);
        if (v === 0) empties.push(cell);
        else used |= maskOf(v);
      }
      if (empties.length !== 1) continue;
      const cell = empties[0]!;
      const missing = digitsOf((~used) & 0x1ff);
      if (missing.length !== 1) continue;
      const digit = missing[0]!;
      if (!grid.hasCandidate(cell, digit)) continue;

      const r = ROW_OF[cell]! + 1;
      const c = COL_OF[cell]! + 1;
      const b = BOX_OF[cell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: { cells: [...house], candidates: [{ cell, digit }], links: [] },
        explanation: {
          zh: `该 house 只剩 ${`R${r}C${c}`} 一个空格，缺失数字只能是 ${digit}，因此填入 ${digit}（全屋唯一）。`,
          en: `This house has one empty cell left (${`R${r}C${c}`}); the missing digit is ${digit}, so place ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
