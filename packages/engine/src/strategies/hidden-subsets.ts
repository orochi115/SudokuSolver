/**
 * T2: hidden subsets (pair / triple / quad).
 *
 * N digits appear in only N cells of a house → those N cells cannot hold any other digits.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSubsets: Strategy = {
  id: 'hidden-subsets',
  name: { zh: '隐性数组', en: 'Hidden Subsets' },
  difficulty: 30,

  apply(_grid: Grid): Step | null {
    // Disabled for M2 soundness guarantee
    return null;
  },
};
