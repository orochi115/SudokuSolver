import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 9, // Slightly simpler/cheaper than Naked Single

  apply(grid: Grid): Step | null {
    for (let houseIdx = 0; houseIdx < HOUSES.length; houseIdx++) {
      const house = HOUSES[houseIdx]!;
      let emptyCells: number[] = [];
      for (const cell of house) {
        if (grid.get(cell) === 0) {
          emptyCells.push(cell);
        }
      }

      if (emptyCells.length === 1) {
        const cell = emptyCells[0]!;
        const mask = grid.candidatesOf(cell);
        if (popcount(mask) === 1) {
          const digit = digitsOf(mask)[0]!;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          const houseType = houseIdx < 9 ? '行' : houseIdx < 18 ? '列' : '宫';
          const houseTypeEn = houseIdx < 9 ? 'row' : houseIdx < 18 ? 'column' : 'box';
          const houseNum = (houseIdx % 9) + 1;

          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: {
              cells: [...house],
              candidates: [{ cell, digit }],
              links: [],
            },
            explanation: {
              zh: `第 ${houseNum} ${houseType} 仅剩一个空格，因此填入 ${digit}（全屋唯一）。`,
              en: `Only one cell remains empty in ${houseTypeEn} ${houseNum}, so R${r}C${c} must be ${digit} (Full House).`,
            },
          };
        }
      }
    }
    return null;
  },
};
