/**
 * Strategy registry.
 *
 * Strategies are ordered by `difficulty` (ascending) — the solver loop tries
 * cheaper strategies first, producing the simplest available deduction.
 * This ordering IS the "systematised human solving flow" (FR-7).
 *
 * T1 (difficulty 8-10):   Full House, Naked Single, Hidden Single
 * T2 (difficulty 20-30):  Locked Candidates, Naked/Hidden Subsets
 * T3 (difficulty 40-50):  Basic Fish, Single-Digit Patterns, Wings
 */

import type { Strategy } from '../strategy.js';

import { nakedSingle } from './naked-single.js';
import { fullHouse } from './full-house.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidatesPointing, lockedCandidatesClaiming } from './locked-candidates.js';
import { nakedPair, nakedTriple, nakedQuad } from './naked-subsets.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from './hidden-subsets.js';
import { xWing, swordfish, jellyfish } from './basic-fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from './single-digit-patterns.js';
import { xyWing, xyzWing, wWing } from './wings.js';

export const STRATEGIES: readonly Strategy[] = [
  // T1 — Singles (cheapest)
  fullHouse,               // difficulty 8
  nakedSingle,             // difficulty 10
  hiddenSingle,            // difficulty 10

  // T2 — Intersections
  lockedCandidatesPointing,  // difficulty 20
  lockedCandidatesClaiming,  // difficulty 20

  // T2 — Subsets
  nakedPair,               // difficulty 30
  hiddenPair,              // difficulty 30
  nakedTriple,             // difficulty 30
  hiddenTriple,            // difficulty 30
  nakedQuad,               // difficulty 30
  hiddenQuad,              // difficulty 30

  // T3 — Basic Fish
  xWing,                   // difficulty 40
  swordfish,               // difficulty 40
  jellyfish,               // difficulty 40

  // T3 — Single-Digit Patterns
  skyscraper,              // difficulty 45
  twoStringKite,           // difficulty 45
  emptyRectangle,          // difficulty 45

  // T3 — Wings
  xyWing,                  // difficulty 50
  xyzWing,                 // difficulty 50
  wWing,                   // difficulty 50
];

export {
  nakedSingle, fullHouse, hiddenSingle,
  lockedCandidatesPointing, lockedCandidatesClaiming,
  nakedPair, nakedTriple, nakedQuad,
  hiddenPair, hiddenTriple, hiddenQuad,
  xWing, swordfish, jellyfish,
  skyscraper, twoStringKite, emptyRectangle,
  xyWing, xyzWing, wWing,
};
