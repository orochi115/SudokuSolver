import { CELLS, ROW_OF, COL_OF, HOUSES, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

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
        } else {
          placedMask |= 1 << (v - 1);
        }
      }
      if (emptyCount !== 1) continue;

      const missingMask = 0x1ff & ~placedMask;
      const digit = digitsOf(missingMask)[0]!;
      const r = ROW_OF[emptyCell]! + 1;
      const c = COL_OF[emptyCell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell: emptyCell, digit }],
        eliminations: [],
        highlights: { cells: [emptyCell], candidates: [{ cell: emptyCell, digit }], links: [] },
        explanation: {
          zh: `R${r}C${c} 是该单元唯一空格，必须填入 ${digit}（全屋唯一）。`,
          en: `R${r}C${c} is the last empty cell in its house, so it must be ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};