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
import { lockedCandidates } from './locked-candidates.js';
import { nakedSubset } from './naked-subset.js';
import { hiddenSubset } from './hidden-subset.js';
import { basicFish } from './basic-fish.js';
import { singleDigitPatterns } from './single-digit-patterns.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';

export const STRATEGIES: readonly Strategy[] = [
  // T1 — Singles (difficulty 4–10)
  fullHouse,          // difficulty 4
  nakedSingle,        // difficulty 10
  hiddenSingle,       // difficulty 10

  // T2 — Intersections & Subsets (difficulty 20–30)
  lockedCandidates,   // difficulty 20
  nakedSubset,        // difficulty 30
  hiddenSubset,       // difficulty 30

  // T3 — Fish / Single-Digit Patterns / Wings (difficulty 40–50)
  basicFish,          // difficulty 40
  singleDigitPatterns, // difficulty 45
  xyWing,             // difficulty 50
  xyzWing,            // difficulty 50
  wWing,              // difficulty 50
];

export {
  fullHouse,
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedSubset,
  hiddenSubset,
  basicFish,
  singleDigitPatterns,
  xyWing,
  xyzWing,
  wWing,
};
