/**
 * REFERENCE STRATEGY — naked single (T1).
 *
 * This is the one strategy the foundation ships. Its purpose is twofold:
 *  1. Give the solver something real to run so the foundation is end-to-end
 *     testable (it alone solves the easiest puzzles).
 *  2. Pin down the conventions every model-branch strategy must follow:
 *     - return the FIRST applicable deduction, or null;
 *     - never mutate the grid;
 *     - fill `highlights` so the replay/tutor can render the step;
 *     - write a bilingual `explanation` using glossary terms.
 *
 * Model branches should treat this file as the template for hidden-single,
 * locked-candidates, subsets, fish, wings, AIC, ALS, etc.
 */

import { CELLS, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSingle: Strategy = {
  id: 'naked-single',
  name: { zh: '显性唯一', en: 'Naked Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const mask = grid.candidatesOf(cell);
      if (popcount(mask) !== 1) continue;

      const digit = digitsOf(mask)[0]!;
      const r = ROW_OF[cell]! + 1;
      const c = COL_OF[cell]! + 1;
      return {
        strategyId: this.id,
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
        explanation: {
          zh: `R${r}C${c} 只剩候选数 ${digit}，因此填入 ${digit}（显性唯一）。`,
          en: `R${r}C${c} has only candidate ${digit} left, so it must be ${digit} (Naked Single).`,
        },
      };
    }
    return null;
  },
};
