import { ALL_CANDIDATES, HOUSES, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { cellName, createPlacementStep, houseName } from './utils.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 9,
  apply(grid: Grid): Step | null {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      const empty = house.filter((cell) => grid.get(cell) === 0);
      if (empty.length !== 1) continue;
      const used = house.reduce((acc, cell) => {
        const value = grid.get(cell);
        return value === 0 ? acc : acc | maskOf(value);
      }, 0);
      const missing = digitsOf(ALL_CANDIDATES & ~used);
      if (missing.length !== 1) continue;
      const target = empty[0]!;
      const digit = missing[0]!;
      const label = houseName(houseIndex);
      return createPlacementStep({
        strategy: this,
        cell: target,
        digit,
        cells: [...house],
        zh: `${label.zh} 只剩 ${cellName(target)} 未填，因此填入缺少的数字 ${digit}（全屋唯一）。`,
        en: `${label.en} has only ${cellName(target)} empty, so it must contain the missing digit ${digit} (Full House).`,
      });
    }
    return null;
  },
};
