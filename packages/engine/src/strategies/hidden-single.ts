import { ROW_OF, COL_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 12,

  apply(grid: Grid): Step | null {
    for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
      const house = HOUSES[hIdx]!;
      // Find digits not yet solved in this house
      const solvedDigits = new Set(house.map((c) => grid.get(c)).filter((d) => d !== 0));

      for (let digit = 1; digit <= 9; digit++) {
        if (solvedDigits.has(digit)) continue;

        const candidateCells = house.filter((cell) => grid.hasCandidate(cell, digit));
        if (candidateCells.length === 1) {
          const cell = candidateCells[0]!;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;

          let houseDescZh = '';
          let houseDescEn = '';
          if (hIdx < 9) {
            houseDescZh = `第 ${hIdx + 1} 行`;
            houseDescEn = `Row ${hIdx + 1}`;
          } else if (hIdx < 18) {
            houseDescZh = `第 ${hIdx - 9 + 1} 列`;
            houseDescEn = `Column ${hIdx - 9 + 1}`;
          } else {
            houseDescZh = `第 ${hIdx - 18 + 1} 宫`;
            houseDescEn = `Box ${hIdx - 18 + 1}`;
          }

          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: {
              cells: [cell],
              candidates: [{ cell, digit }],
              links: [],
            },
            explanation: {
              zh: `在${houseDescZh}中，数字 ${digit} 只能填入 R${r}C${c}（隐性唯一）。`,
              en: `In ${houseDescEn}, digit ${digit} can only be placed at R${r}C${c} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
