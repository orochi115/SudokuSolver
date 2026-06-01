import type { Strategy } from '../strategy.js';
import { HOUSES, candidateCellsIn, cellName, houseName } from './helpers.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid) {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      for (let digit = 1; digit <= 9; digit++) {
        const cells = candidateCellsIn(house, grid, digit);
        if (cells.length !== 1) continue;
        const cell = cells[0]!;
        const houseLabel = houseName(houseIndex);
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `${houseLabel.zh} 中只有 ${cellName(cell)} 可以填 ${digit}，因此填入 ${digit}（隐性唯一）。`,
            en: `Only ${cellName(cell)} can contain ${digit} in ${houseLabel.en}, so it must be ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
