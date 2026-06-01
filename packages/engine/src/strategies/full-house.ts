import { CELLS, ROW_OF, COL_OF, HOUSES, popcount, digitsOf, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 8,

  apply(grid: Grid): Step | null {
    for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
      const house = HOUSES[hIdx]!;
      const emptyCells = house.filter((cell) => grid.get(cell) === 0);
      if (emptyCells.length !== 1) continue;

      const cell = emptyCells[0]!;
      // Find the missing digit in this house
      const solvedDigits = new Set(house.map((c) => grid.get(c)).filter((d) => d !== 0));
      let missingDigit = 0;
      for (let d = 1; d <= 9; d++) {
        if (!solvedDigits.has(d)) {
          missingDigit = d;
          break;
        }
      }

      if (missingDigit === 0 || !grid.hasCandidate(cell, missingDigit)) continue;

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
        placements: [{ cell, digit: missingDigit }],
        eliminations: [],
        highlights: {
          cells: [...house],
          candidates: [{ cell, digit: missingDigit }],
          links: [],
        },
        explanation: {
          zh: `${houseDescZh}还剩最后一格 R${r}C${c}，因此填入 ${missingDigit}（全屋唯一）。`,
          en: `${houseDescEn} has only one empty cell left at R${r}C${c}, so it must be ${missingDigit} (Full House).`,
        },
      };
    }
    return null;
  },
};
