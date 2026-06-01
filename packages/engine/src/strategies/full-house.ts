import { HOUSES, SIZE, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FULL_MASK = (1 << SIZE) - 1;

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      let emptyCell = -1;
      let emptyCount = 0;
      let placedMask = 0;
      for (const c of house) {
        const v = grid.get(c);
        if (v === 0) {
          emptyCell = c;
          emptyCount++;
          if (emptyCount > 1) break;
        } else {
          placedMask |= maskOf(v);
        }
      }
      if (emptyCount !== 1) continue;
      const missingMask = FULL_MASK ^ placedMask;
      const digit = digitsOf(missingMask)[0]!;
      const r = ROW_OF[emptyCell]! + 1;
      const col = COL_OF[emptyCell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell: emptyCell, digit }],
        eliminations: [],
        highlights: { cells: [emptyCell], candidates: [{ cell: emptyCell, digit }], links: [] },
        explanation: {
          zh: `该单元只剩 R${r}C${col} 为空，填入唯一缺失的数字 ${digit}（全屋唯一）。`,
          en: `The house has only R${r}C${col} empty, so it must be ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};