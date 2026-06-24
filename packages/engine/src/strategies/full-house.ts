/**
 * Full House (T1) — 全屋唯一
 *
 * The simplest strategy: a house (row, column, or box) has exactly one empty
 * cell. The missing digit is trivially the only one that can go there.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function houseLabel(houseIdx: number, cell: number): string {
  if (houseIdx < 9) return `行 R${ROW_OF[cell]! + 1}`;
  if (houseIdx < 18) return `列 C${COL_OF[cell]! + 1}`;
  return `宫 B${BOX_OF[cell]! + 1}`;
}

function houseLabelEn(houseIdx: number, cell: number): string {
  if (houseIdx < 9) return `row R${ROW_OF[cell]! + 1}`;
  if (houseIdx < 18) return `column C${COL_OF[cell]! + 1}`;
  return `box B${BOX_OF[cell]! + 1}`;
}

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 100, // Even cheaper than naked-single — scan houses first

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length !== 1) continue;

      const cell = emptyCells[0]!;
      const mask = grid.candidatesOf(cell);
      if (mask === 0) continue; // broken grid

      // The single remaining digit for this cell
      // (candidatesOf already reflects all placements)
      // Find the digit: it's the only set bit
      let digit = 0;
      for (let d = 1; d <= 9; d++) {
        if (mask & (1 << (d - 1))) {
          digit = d;
          break;
        }
      }
      if (digit === 0) continue;

      const r = ROW_OF[cell]! + 1;
      const c = COL_OF[cell]! + 1;
      const hl = houseLabel(h, cell);
      const hle = houseLabelEn(h, cell);

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
          zh: `R${r}C${c} 是${hl}中最后一个空格，候选数只有 ${digit}（全屋唯一）。`,
          en: `R${r}C${c} is the last empty cell in ${hle}, so it must be ${digit} (Full House).`,
        },
      };
    }
    return null;
  },
};
