/**
 * Strategy registry.
 *
 * The foundation registers only the reference strategy. Additional strategies
 * are registered here, keeping the array ordered by `difficulty`
 * (the solver sorts defensively, but ordering here documents the flow).
 */

import type { Strategy } from '../strategy.js';
import { basicFish } from './basic-fish.js';
import { fullHouse } from './full-house.js';
import { hiddenSingle } from './hidden-single.js';
import { hiddenSubset } from './hidden-subset.js';
import { lockedCandidates } from './locked-candidates.js';
import { nakedSingle } from './naked-single.js';
import { nakedSubset } from './naked-subset.js';
import { singleDigitPatterns } from './single-digit-patterns.js';
import { wWing } from './w-wing.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';

export const STRATEGIES: readonly Strategy[] = [
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
];

export {
  basicFish,
  fullHouse,
  hiddenSingle,
  hiddenSubset,
  lockedCandidates,
  nakedSingle,
  nakedSubset,
  singleDigitPatterns,
  wWing,
  xyWing,
  xyzWing,
};
