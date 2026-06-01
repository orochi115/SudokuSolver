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
 * T4 (difficulty 60-100): Coloring, AIC/Chains, ALS, Uniqueness, Sue de Coq
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
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { alsXZ, alsXYWing, deathBlossom } from './als.js';
import { uniqueRectangle, bugPlus1 } from './uniqueness.js';
import { sueDeCocq } from './sue-de-coq.js';

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

  // T4 — Coloring
  simpleColoring,          // difficulty 60

  // T4 — AIC / Chains
  aic,                     // difficulty 70

  // T4 — ALS
  alsXZ,                   // difficulty 80
  alsXYWing,               // difficulty 80
  deathBlossom,            // difficulty 82

  // T4 — Uniqueness (optional; valid only for puzzles with unique solutions)
  uniqueRectangle,         // difficulty 90
  bugPlus1,                // difficulty 90

  // T4 — Special
  sueDeCocq,               // difficulty 95
];

export {
  nakedSingle, fullHouse, hiddenSingle,
  lockedCandidatesPointing, lockedCandidatesClaiming,
  nakedPair, nakedTriple, nakedQuad,
  hiddenPair, hiddenTriple, hiddenQuad,
  xWing, swordfish, jellyfish,
  skyscraper, twoStringKite, emptyRectangle,
  xyWing, xyzWing, wWing,
  simpleColoring,
  aic,
  alsXZ, alsXYWing, deathBlossom,
  uniqueRectangle, bugPlus1,
  sueDeCocq,
};
