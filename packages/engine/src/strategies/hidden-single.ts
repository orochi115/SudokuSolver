/**
 * Hidden Single (T1) — 隐性唯一
 *
 * A digit has exactly one possible cell remaining in a house (row/column/box).
 * Place it there.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const HOUSE_NAMES: Array<{ zh: (idx: number) => string; en: (idx: number) => string }> = [
  // rows 0-8
  ...Array.from({ length: 9 }, (_, i) => ({
    zh: () => `第 ${i + 1} 行`,
    en: () => `Row ${i + 1}`,
  })),
  // cols 9-17
  ...Array.from({ length: 9 }, (_, i) => ({
    zh: () => `第 ${i + 1} 列`,
    en: () => `Column ${i + 1}`,
  })),
  // boxes 18-26
  ...Array.from({ length: 9 }, (_, i) => ({
    zh: () => `第 ${i + 1} 宫`,
    en: () => `Box ${i + 1}`,
  })),
];

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // For each house, for each digit, check if it appears in exactly one cell
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      for (let d = 1; d <= 9; d++) {
        let count = 0;
        let found = -1;
        for (const cell of house) {
          if (grid.hasCandidate(cell, d)) {
            count++;
            found = cell;
            if (count > 1) break;
          }
        }
        if (count === 1 && found !== -1) {
          const cell = found;
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          const boxNum = BOX_OF[cell]! + 1;
          void boxNum; // suppress unused warning

          // Determine which kind of house this is for explanation
          let houseDesc: { zh: string; en: string };
          if (h < 9) {
            houseDesc = { zh: `第 ${h + 1} 行`, en: `Row ${h + 1}` };
          } else if (h < 18) {
            houseDesc = { zh: `第 ${h - 9 + 1} 列`, en: `Column ${h - 9 + 1}` };
          } else {
            houseDesc = { zh: `第 ${h - 18 + 1} 宫`, en: `Box ${h - 18 + 1}` };
          }

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
              zh: `R${r}C${c} 是 ${d} 在${houseDesc.zh}中唯一能放的格（隐性唯一）。`,
              en: `R${r}C${c} is the only cell for digit ${d} in ${houseDesc.en} (Hidden Single).`,
            },
          };
        }
      }
    }
    return null;
  },
};
