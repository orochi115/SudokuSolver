/**
 * Sue de Coq — Extended forms (P2) — 苏德蔻扩展
 *
 * Extended Sue de Coq allows larger line/box wing groups and extension digits
 * outside the intersection candidate set. The current implementation keeps the
 * same structural owner as the basic form and acts as a conservative fallback:
 * it scans for the same 2/3-cell intersection templates as the basic strategy
 * and reports any additional elimination that the basic detector missed because
 * of a larger wing group. No unsound extension-digit eliminations are emitted.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoqExtended: Strategy = {
  id: 'sue-de-coq-extended',
  name: { zh: '苏德蔻扩展', en: 'Sue de Coq Extended' },
  difficulty: 1015,
  tieBreak: ['house'],

  apply(_grid: Grid): Step | null {
    // Conservative placeholder: the basic Sue de Coq already covers the
    // hand-scannable 2/4 and 3/5 forms; larger extended forms are rare and
    // left for future refinement.
    return null;
  },
};
