/**
 * T2: naked subsets (pair / triple / quad).
 *
 * N cells in a house share exactly the same N candidates (and no others) →
 * those N candidates can be eliminated from the remaining cells of the house.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubsets: Strategy = {
  id: 'naked-subsets',
  name: { zh: '显性数组', en: 'Naked Subsets' },
  difficulty: 25,

  apply(_grid: Grid): Step | null {
    // Disabled for M2 soundness guarantee
    return null;
  },
};
