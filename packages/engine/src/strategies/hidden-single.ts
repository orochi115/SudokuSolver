import { HOUSES } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, cellName, houseName } from './common.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid): Step | null {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      for (let digit = 1; digit <= 9; digit++) {
        const cells = candidateCells(grid, HOUSES[houseIndex]!, digit);
        if (cells.length !== 1) continue;
        const cell = cells[0]!;
        const label = houseName(houseIndex);
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: [cell, ...HOUSES[houseIndex]!], candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `${label.zh} 中只有 ${cellName(cell)} 可以填 ${digit}，因此填入 ${digit}（隐性唯一）。`,
            en: `In ${label.en}, only ${cellName(cell)} can contain ${digit}, so place ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
