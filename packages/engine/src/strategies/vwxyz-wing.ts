/**
 * VWXYZ-Wing (P2) — VWXYZ 翼
 *
 * The size-5 rung of the wing size-ladder: a pivot with five candidates and
 * four bivalue pincers, each carrying the shared non-restricted digit Z plus
 * one of the other pivot digits.
 */

import { makeNWingStrategy } from './n-wing.js';

export const vwxyzWing = makeNWingStrategy({
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ-Wing', en: 'VWXYZ-Wing' },
  difficulty: 530,
  size: 5,
});
