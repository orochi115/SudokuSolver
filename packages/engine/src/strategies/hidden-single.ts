import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { ALL_HOUSES, candidatesInHouse, cellName, houseName } from './_common.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of ALL_HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const cells = candidatesInHouse(grid, house.cells, digit);
        if (cells.length !== 1) continue;
        const cell = cells[0]!;
        if (grid.get(cell) !== 0) continue;

        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: house.cells.slice(), candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `在 ${houseName(house)} 中，数字 ${digit} 只能放在 ${cellName(cell)}，因此填入 ${digit}（隐性唯一）。`,
            en: `In ${houseName(house)}, digit ${digit} can only go in ${cellName(cell)}, so place ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
