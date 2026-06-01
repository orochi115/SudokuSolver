import { ROW_OF, COL_OF, HOUSES, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const locations: number[] = [];
        for (const c of house) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            locations.push(c);
          }
        }
        if (locations.length !== 1) continue;

        const cell = locations[0]!;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;
        return {
          strategyId: this.id,
          placements: [{ cell, digit: d }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit: d }], links: [] },
          explanation: {
            zh: `在该单元中，数字 ${d} 只能出现在 R${r}C${c}，因此填入 ${d}（隐性唯一）。`,
            en: `Digit ${d} can only go in R${r}C${c} within this house, so it must be placed there (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};