import { CELLS, HOUSES, SIZE, ROW_OF, COL_OF, maskOf, ALL_CANDIDATES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const house = HOUSES[hi]!;
      let emptyCell = -1;
      let emptyCount = 0;
      let mask = 0;
      for (const c of house) {
        const v = grid.get(c);
        if (v === 0) {
          emptyCell = c;
          emptyCount++;
          if (emptyCount > 1) break;
        } else {
          mask |= maskOf(v);
        }
      }
      if (emptyCount !== 1) continue;
      const missingMask = ALL_CANDIDATES ^ mask;
      if (popcount(missingMask) !== 1) continue;
      const d = Math.log2(missingMask) + 1;
      const r = ROW_OF[emptyCell]! + 1;
      const c = COL_OF[emptyCell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell: emptyCell, digit: d }],
        eliminations: [],
        highlights: { cells: [emptyCell], candidates: [], links: [] },
        explanation: {
          zh: `R${r}C${c} 是所在行/列/宫的最后一格，因此填入 ${d}（全屋唯一）。`,
          en: `R${r}C${c} is the last empty cell in its house, so it must be ${d} (Full House).`,
        },
      };
    }
    return null;
  },
};

function popcount(x: number): number {
  x = ((x >>> 1) & 0x55555555) + (x & 0x55555555);
  x = ((x >>> 2) & 0x33333333) + (x & 0x33333333);
  x = ((x >>> 4) & 0x0f0f0f0f) + (x & 0x0f0f0f0f);
  x = ((x >>> 8) & 0x00ff00ff) + (x & 0x00ff00ff);
  x = ((x >>> 16) & 0x0000ffff) + (x & 0x0000ffff);
  return x;
}