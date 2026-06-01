import { ROW_OF, COL_OF, HOUSES, digitsOf, popcount } from '../grid.js';
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
      const count: number[] = Array(10).fill(0);
      const lastCell: number[] = Array(10).fill(-1);
      for (const c of house) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        for (const d of digitsOf(mask)) {
          count[d]!++;
          lastCell[d] = c;
        }
      }
      for (let d = 1; d <= 9; d++) {
        if (count[d] === 1) {
          const cell = lastCell[d]!;
          const r = ROW_OF[cell]! + 1;
          const col = COL_OF[cell]! + 1;
          return {
            strategyId: this.id,
            placements: [{ cell, digit: d }],
            eliminations: [],
            highlights: { cells: [cell], candidates: [{ cell, digit: d }], links: [] },
            explanation: {
              zh: `数字 ${d} 在本 house 仅可位于 R${r}C${col}，因此填入 ${d}（隐性唯一）。`,
              en: `Digit ${d} can only be in R${r}C${col} in this house, place ${d} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
