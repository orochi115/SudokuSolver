/**
 * Simple Coloring (T4, difficulty 60).
 * Single-digit strong link 2-coloring: trap (same color sees elim), wrap (opposite colors conjugate).
 */
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { CELLS, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // Build strong links for this digit (conjugate pairs in units)
      const links: Link[] = [];
      const colors = new Map<number, number>(); // cell -> color 0/1
      // TODO: full graph coloring; placeholder returns null for now (M3 stub)
    }
    return null;
  },
};
