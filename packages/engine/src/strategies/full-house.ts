/**
 * T1 STRATEGY — full house (difficulty 10).
 *
 * When a house (row/column/box) has exactly one empty cell, fill it with
 * the only missing digit in that house.
 */

import { HOUSES, CELLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // Look for houses with exactly one empty cell
    for (const house of HOUSES) {
      let emptyCell = -1;
      let filledDigitsMask = 0;

      for (const cell of house) {
        const val = grid.get(cell);
        if (val !== 0) {
          filledDigitsMask |= 1 << (val - 1);
        } else {
          if (emptyCell !== -1) {
            // More than one empty cell in this house
            emptyCell = -2;
            break;
          }
          emptyCell = cell;
        }
      }

      // If exactly one empty cell and 8 digits are filled
      if (emptyCell !== -1 && emptyCell !== -2) {
        // Find the missing digit
        for (let digit = 1; digit <= 9; digit++) {
          if (!((filledDigitsMask >> (digit - 1)) & 1)) {
            // Found the missing digit
            const r = Math.floor(emptyCell / 9) + 1;
            const c = (emptyCell % 9) + 1;
            return {
              strategyId: this.id,
              placements: [{ cell: emptyCell, digit }],
              eliminations: [],
              highlights: { cells: [emptyCell], candidates: [{ cell: emptyCell, digit }], links: [] },
              explanation: {
                zh: `第${r}行第${c}列是该行最后一个空格，必须填入缺失的数字 ${digit}（全屋唯一）`,
                en: `R${r}C${c} is the last empty cell in its house, so it must be the missing digit ${digit} (Full House)`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};