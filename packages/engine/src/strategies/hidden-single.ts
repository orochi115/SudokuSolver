import { ROW_OF, COL_OF, HOUSES } from '../grid.js';
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
      for (let digit = 1; digit <= 9; digit++) {
        let alreadyPlaced = false;
        for (const cell of house) {
          if (grid.get(cell) === digit) {
            alreadyPlaced = true;
            break;
          }
        }
        if (alreadyPlaced) continue;

        const potentialCells: number[] = [];
        for (const cell of house) {
          if (grid.hasCandidate(cell, digit)) {
            potentialCells.push(cell);
          }
        }

        if (potentialCells.length === 1) {
          const cell = potentialCells[0]!;
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
              cells: [cell],
              candidates: [{ cell, digit }],
              links: []
            },
            explanation: {
              zh: `在${houseNameZh}中，数字 ${digit} 只能填入 R${r}C${c}（隐性唯一）。`,
              en: `In ${houseNameEn}, digit ${digit} has only one possible cell at R${r}C${c} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  }
};
