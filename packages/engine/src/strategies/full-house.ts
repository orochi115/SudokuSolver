import { HOUSES, maskOf } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { cellName, houseName } from './common.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid): Step | null {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      const empty = house.filter((cell) => grid.get(cell) === 0);
      if (empty.length !== 1) continue;

      let used = 0;
      for (const cell of house) {
        const digit = grid.get(cell);
        if (digit !== 0) used |= maskOf(digit);
      }
      const missing = [];
      for (let digit = 1; digit <= 9; digit++) {
        if ((used & maskOf(digit)) === 0) missing.push(digit);
      }
      if (missing.length !== 1) continue;

      const cell = empty[0]!;
      const digit = missing[0]!;
      const houseLabel = houseName(houseIndex);
      return {
        strategyId: this.id,
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: { cells: [...house], candidates: [{ cell, digit }], links: [] },
        explanation: {
          zh: `${houseLabel.zh} 只剩 ${cellName(cell)} 未填，缺少数字 ${digit}，因此填入 ${digit}（全屋唯一）。`,
          en: `${houseLabel.en} has only ${cellName(cell)} empty and is missing ${digit}, so place ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
