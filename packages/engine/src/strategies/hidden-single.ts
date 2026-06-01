/**
 * T1: hidden single.
 */

import { HOUSES, popcount, digitsOf, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        let count = 0;
        let target = -1;
        for (const cell of house) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            count++;
            target = cell;
          }
        }
        if (count === 1) {
          const r = ROW_OF[target]! + 1;
          const c = COL_OF[target]! + 1;
          return {
            strategyId: this.id,
            placements: [{ cell: target, digit: d }],
            eliminations: [],
            highlights: { cells: [target], candidates: [{ cell: target, digit: d }], links: [] },
            explanation: {
              zh: `宫/行/列中 ${d} 只出现在 R${r}C${c}，因此填入 ${d}（隐性唯一）。`,
              en: `Digit ${d} appears in only one cell R${r}C${c} in its house, so it must be ${d} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
