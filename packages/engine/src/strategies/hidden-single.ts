/**
 * Hidden Single (T1) — 隐性唯一
 *
 * In a house (row, column, or box), a digit appears as a candidate in exactly
 * one cell. That cell must contain that digit.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function houseLabel(houseIdx: number): string {
  if (houseIdx < 9) return `行 R${houseIdx + 1}`;
  if (houseIdx < 18) return `列 C${houseIdx - 9 + 1}`;
  return `宫 B${houseIdx - 18 + 1}`;
}

function houseLabelEn(houseIdx: number): string {
  if (houseIdx < 9) return `row R${houseIdx + 1}`;
  if (houseIdx < 18) return `column C${houseIdx - 9 + 1}`;
  return `box B${houseIdx - 18 + 1}`;
}

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 170,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;

      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        let count = 0;
        let lastCell = -1;

        for (const cell of house) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            count++;
            lastCell = cell;
          }
        }

        if (count !== 1) continue;

        const cell = lastCell;
        const r = ROW_OF[cell]! + 1;
        const c = COL_OF[cell]! + 1;
        const hl = houseLabel(h);
        const hle = houseLabelEn(h);

        return {
          strategyId: this.id,
          placements: [{ cell, digit: d }],
          eliminations: [],
          highlights: {
            cells: [cell],
            candidates: [{ cell, digit: d }],
            links: [],
          },
          explanation: {
            zh: `${hl} 中，数字 ${d} 只能填入 R${r}C${c}（隐性唯一）。`,
            en: `In ${hle}, digit ${d} can only go in R${r}C${c} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
