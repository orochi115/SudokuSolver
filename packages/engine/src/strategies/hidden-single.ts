import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';
import { DIGITS, HOUSE_REFS, candidatesInHouse, cellName, houseName } from './_utils.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (const house of HOUSE_REFS) {
      for (const digit of DIGITS) {
        const spots = candidatesInHouse(grid, house.cells, digit);
        if (spots.length !== 1) continue;
        const cell = spots[0]!;
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `${houseName(house.kind, house.index)} 内数字 ${digit} 只能放在 ${cellName(cell)}，因此填入 ${digit}（隐性唯一）。`,
            en: `In ${houseName(house.kind, house.index)}, digit ${digit} can only go in ${cellName(cell)}, so place ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
