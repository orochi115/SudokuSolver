/**
 * WXYZ-Wing (P1) — WXYZ 翼
 *
 * A size-4 wing: a pivot cell with four candidates {w,x,y,z}, plus three
 * bivalue pincer cells that each see the pivot and are respectively {w,z},
 * {x,z} and {y,z}. Then z must appear in one of the pincers, so cells
 * seeing all three pincers lose z.
 */

import { makeNWingStrategy } from './n-wing.js';

export const wxyzWing = makeNWingStrategy({
  id: 'wxyz-wing',
  name: { zh: 'WXYZ-Wing', en: 'WXYZ-Wing' },
  difficulty: 520,
  size: 4,
});
