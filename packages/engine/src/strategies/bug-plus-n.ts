import {
  CELLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 986,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) emptyCells.push(c);
    }

    const nonBivalue = emptyCells.filter(c => popcount(grid.candidatesOf(c)) !== 2);
    if (nonBivalue.length < 2 || nonBivalue.length > 4) return null;

    const bivalueCount = emptyCells.length - nonBivalue.length;

    for (const cell of nonBivalue) {
      const mask = grid.candidatesOf(cell);
      const digits = digitsOf(mask);

      for (const d of digits) {
        const bit = maskOf(d);
        const houses = [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!];

        for (const houseIdx of houses) {
          const house = HOUSES[houseIdx]!;
          let count = 0;
          for (const c of house) {
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) count++;
          }
          if (count !== 3) continue;

          const otherCells = house.filter(c => c !== cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
          if (otherCells.length !== 2) continue;

          if (bivalueCount >= emptyCells.length - 3) {
            if (grid.hasCandidate(cell, d)) {
              return {
                strategyId: 'bug-plus-n',
                placements: [{ cell, digit: d }],
                eliminations: [],
                highlights: {
                  cells: [cell, ...otherCells],
                  candidates: [cell, ...otherCells].map(c => ({ cell: c, digit: d })),
                  links: [],
                },
                explanation: {
                  zh: `BUG+N：${cellLabel(cell)} 中 ${d} 在宫中形成三值结构以打破BUG（${nonBivalue.length}个非双值格）；填入 ${d}。`,
                  en: `BUG+N: digit ${d} in ${cellLabel(cell)} forms a triple in house to break BUG (${nonBivalue.length} non-bivalue cells); place ${d}.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};