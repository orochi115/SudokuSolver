/**
 * Hidden Single (T1) — 隐性唯一.
 *
 * Within a house, if a digit can go in only one of the house's empty cells,
 * that cell must hold the digit — even if the cell still has other candidates
 * (the digit is "hidden" among them).
 */

import { HOUSES, cellsWithCandidate, cellLabel, houseLabel } from './helpers.js';
import { SIZE } from '../grid.js';
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
      for (let digit = 1; digit <= SIZE; digit++) {
        const spots = cellsWithCandidate(grid, house, digit);
        if (spots.length !== 1) continue;
        const cell = spots[0]!;
        // If it's also a naked single it's still a valid hidden single, but we
        // let it through — soundness is unaffected and ordering handles overlap.
        const hl = houseLabel(h);
        return {
          strategyId: this.id,
          placements: [{ cell, digit }],
          eliminations: [],
          highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
          explanation: {
            zh: `在${hl.zh}中，数字 ${digit} 只能放在 ${cellLabel(cell)}，因此填入 ${digit}（隐性唯一）。`,
            en: `In ${hl.en}, digit ${digit} fits only in ${cellLabel(cell)}, so place ${digit} (Hidden Single).`,
          },
        };
      }
    }
    return null;
  },
};
