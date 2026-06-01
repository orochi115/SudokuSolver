import { HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, rc } from './common.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      for (let digit = 1; digit <= 9; digit++) {
        const cells = candidateCells(grid, house, digit);
        if (cells.length !== 1) continue;
        const cell = cells[0]!;
        const houseLabel = houseIndex < 9 ? `row ${houseIndex + 1}` : houseIndex < 18 ? `column ${houseIndex - 8}` : `box ${houseIndex - 17}`;
        const houseLabelZh = houseIndex < 9 ? `第 ${houseIndex + 1} 行` : houseIndex < 18 ? `第 ${houseIndex - 8} 列` : `第 ${houseIndex - 17} 宫`;
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: {
            cells,
            candidates: cells.map((c) => ({ cell: c, digit })),
            links: [],
          },
          explanation: {
            zh: `${houseLabelZh} 中数字 ${digit} 只可能在 ${rc(cell)}，因此填入 ${digit}（隐性唯一）。`,
            en: `In ${houseLabel}, digit ${digit} can only go in ${rc(cell)}, so place ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
