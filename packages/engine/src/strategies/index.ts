/**
 * Strategy registry.
 *
 * Strategies are ordered by `difficulty` (ascending), so the solver loop
 * always prefers the cheapest available deduction first (FR-7).
 */

import type { Strategy } from '../strategy.js';
import { fullHouse } from './full-house.js';
import { nakedSingle } from './naked-single.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidatesPointing, lockedCandidatesClaiming } from './locked-candidates.js';
import { nakedPair, nakedTriple, nakedQuad } from './naked-subset.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from './hidden-subset.js';
import { xWing, swordfish, jellyfish } from './basic-fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from './single-digit-patterns.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { als } from './als.js';
import { uniqueness } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { forcingChain } from './forcing-chain.js';

export const STRATEGIES: readonly Strategy[] = [
  // T1 — Singles (difficulty 4–12)
  fullHouse,          // difficulty 4
  nakedSingle,        // difficulty 10
  hiddenSingle,       // difficulty 12

  // T2 — Intersections & Subsets (difficulty 20–39)
  lockedCandidatesPointing, // difficulty 20
  lockedCandidatesClaiming, // difficulty 22
  nakedPair,          // difficulty 30
  hiddenPair,         // difficulty 32
  nakedTriple,        // difficulty 34
  hiddenTriple,       // difficulty 36
  nakedQuad,          // difficulty 38
  hiddenQuad,         // difficulty 39

  // T3 — Fish / Single-Digit Patterns / Wings (difficulty 40–58)
  xWing,              // difficulty 40
  skyscraper,         // difficulty 44
  twoStringKite,      // difficulty 46
  emptyRectangle,     // difficulty 48
  swordfish,          // difficulty 50
  xyWing,             // difficulty 52
  xyzWing,            // difficulty 54
  wWing,              // difficulty 56
  jellyfish,          // difficulty 58

  // T4 — Advanced Strategies (difficulty 60–100)
  simpleColoring,     // difficulty 60
  aic,                // difficulty 70
  als,                // difficulty 80
  uniqueness,         // difficulty 90
  sueDeCoq,           // difficulty 95
  forcingChain,       // difficulty 100
];

export {
  fullHouse,
  nakedSingle,
  hiddenSingle,
  lockedCandidatesPointing,
  lockedCandidatesClaiming,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
  hiddenQuad,
  xWing,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  swordfish,
  xyWing,
  xyzWing,
  wWing,
  jellyfish,
  simpleColoring,
  aic,
  als,
  uniqueness,
  sueDeCoq,
  forcingChain,
};
