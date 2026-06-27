/**
 * Tridagon (Thor's Hammer / anti-Tridagon) (P1 exotic).
 *
 * The sound Tridagon requires the PRECISE 3-box cyclic "minicol" deadly pattern
 * (each of the three digits {a,b,c} appearing once per box and once per line in
 * a cyclic arrangement that admits several Latin completions). A loose "8 pure
 * cells whose union is {a,b,c}" check is NOT sufficient — it fires on
 * non-deadly configurations and is unsound.
 *
 * Rather than ship an unsound detector, this strategy is registered but
 * conservatively inactive (returns null) until the precise cyclic-arrangement
 * verification is implemented. Sound by construction (no eliminations). See
 * docs/notes/p1.md.
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: 'Tridagon', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

void ROW_OF;
void COL_OF;
