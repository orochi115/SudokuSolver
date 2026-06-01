import { ROW_OF, COL_OF, HOUSES, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 8,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      const emptyCells: number[] = [];
      for (const cell of house) {
        if (grid.get(cell) === 0) {
          emptyCells.push(cell);
        }
      }
      if (emptyCells.length === 1) {
        const cell = emptyCells[0]!;
        const candidates = digitsOf(grid.candidatesOf(cell));
        if (candidates.length === 1) {
          const digit = candidates[0]!;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          
          let houseNameZh = '';
          let houseNameEn = '';
          if (h < 9) {
            houseNameZh = `第 ${h + 1} 行`;
            houseNameEn = `Row ${h + 1}`;
          } else if (h < 18) {
            houseNameZh = `第 ${h - 9 + 1} 列`;
            houseNameEn = `Column ${h - 9 + 1}`;
          } else {
            houseNameZh = `第 ${h - 18 + 1} 宫`;
            houseNameEn = `Box ${h - 18 + 1}`;
          }

          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: {
              cells: [...house],
              candidates: [{ cell, digit }],
              links: []
            },
            explanation: {
              zh: `R${r}C${c} 是${houseNameZh}中唯一未填的格子，因此填入 ${digit}（全屋唯一）。`,
              en: `R${r}C${c} is the only empty cell in ${houseNameEn}, so it must be ${digit} (Full House).`,
            },
          };
        }
      }
    }
    return null;
  }
};
