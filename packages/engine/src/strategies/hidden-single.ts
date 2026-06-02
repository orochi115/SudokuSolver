/**
 * T1: Hidden Single.
 *
 * A digit appears only once in a house. It must be placed there.
 */

import { HOUSES, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'hidden-single';

export const hiddenSingle: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        let count = 0;
        let cell = -1;
        for (const c of house) {
          if (grid.values[c] === 0 && (grid.candidates[c]! & bit)) {
            count++;
            cell = c;
            if (count > 1) break;
          }
        }
        if (count === 1 && cell !== -1) {
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          return {
            strategyId: STRATEGY_ID,
            placements: [{ cell, digit: d }],
            eliminations: [],
            highlights: { cells: [cell], candidates: [{ cell, digit: d }], links: [] },
            explanation: {
              zh: `数字 ${d} 在该单元中只出现在 R${r}C${c}，因此填入 ${d}（隐性唯一）。`,
              en: `Digit ${d} appears only at R${r}C${c} in this house, so it must be ${d} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
