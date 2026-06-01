import { SIZE, CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      for (let d = 1; d <= SIZE; d++) {
        const bit = maskOf(d);
        let foundCell = -1;
        let count = 0;
        for (const c of house) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) {
            foundCell = c;
            count++;
            if (count > 1) break;
          }
        }
        if (count !== 1) continue;
        const r = ROW_OF[foundCell]! + 1;
        const c = COL_OF[foundCell]! + 1;
        return {
          strategyId: this.id,
          placements: [{ cell: foundCell, digit: d }],
          eliminations: [],
          highlights: { cells: [foundCell], candidates: [{ cell: foundCell, digit: d }], links: [] },
          explanation: {
            zh: `在 R${r}C${c} 中，数字 ${d} 是该单元中唯一可能的位置（隐性唯一）。`,
            en: `Digit ${d} has only one possible cell R${r}C${c} in this house (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};