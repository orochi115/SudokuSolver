import { HOUSES, ROW_OF, COL_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 12, // Cheaper strategy, but slightly harder to spot than naked single

  apply(grid: Grid): Step | null {
    for (let houseIdx = 0; houseIdx < HOUSES.length; houseIdx++) {
      const house = HOUSES[houseIdx]!;
      for (let digit = 1; digit <= SIZE; digit++) {
        // If the digit is already placed in this house, skip
        let alreadyPlaced = false;
        for (const cell of house) {
          if (grid.get(cell) === digit) {
            alreadyPlaced = true;
            break;
          }
        }
        if (alreadyPlaced) continue;

        // Find empty cells that have this digit as a candidate
        let possibleCells: number[] = [];
        for (const cell of house) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }

        if (possibleCells.length === 1) {
          const cell = possibleCells[0]!;
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
              zh: `在第 ${houseNum} ${houseType} 中，候选数 ${digit} 只能填在 R${r}C${c}（隐性唯一）。`,
              en: `In ${houseTypeEn} ${houseNum}, candidate ${digit} can only be placed in R${r}C${c} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
