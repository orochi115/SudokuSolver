import { CELLS, HOUSES, SIZE, ROW_OF, COL_OF, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const house = HOUSES[hi]!;
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
        const houseType = hi < 9 ? '行' : hi < 18 ? '列' : '宫';
        const houseTypeEn = hi < 9 ? 'row' : hi < 18 ? 'column' : 'box';
        return {
          strategyId: this.id,
          placements: [{ cell: foundCell, digit: d }],
          eliminations: [],
          highlights: {
            cells: [foundCell],
            candidates: [{ cell: foundCell, digit: d }],
            links: [],
          },
          explanation: {
            zh: `数字 ${d} 在所在${houseType}中仅出现在 R${r}C${c}，因此填入 ${d}（隐性唯一）。`,
            en: `Digit ${d} appears only in R${r}C${c} within its ${houseTypeEn}, so it must be ${d} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};