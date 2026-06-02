/**
 * Strategy registry.
 *
 * Strategies ordered by difficulty (ascending):
 *   10 singles  ·  20 intersections  ·  30 subsets  ·  40 fish  ·
 *   45 wings  ·  60 coloring  ·  70 AIC  ·  80 ALS  ·  90 uniqueness  ·
 *   95 sue-de-coq  ·  100 forcing-chain
 */

import type { Strategy } from '../strategy.js';
import { nakedSingle } from './naked-single.js';
import { fullHouse } from './full-house.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidates } from './locked-candidates.js';
import { nakedSubset } from './naked-subset.js';
import { hiddenSubset } from './hidden-subset.js';
import { basicFish } from './basic-fish.js';
import { singleDigitPatterns } from './single-digit-patterns.js';
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
  // T1 (difficulty 10)
  nakedSingle,
  fullHouse,
  hiddenSingle,
  // T2 (difficulty 20-30)
  lockedCandidates,
  nakedSubset,
  hiddenSubset,
  // T3 (difficulty 40-50)
  basicFish,
  singleDigitPatterns,
  xyWing,
  xyzWing,
  wWing,
  // T4 (difficulty 60-100)
  simpleColoring,
  aic,
  als,
  uniqueness,
  sueDeCoq,
  forcingChain,
];

export {
  nakedSingle,
  fullHouse,
  hiddenSingle,
  lockedCandidates,
  nakedSubset,
  hiddenSubset,
  basicFish,
  singleDigitPatterns,
  xyWing,
  xyzWing,
  wWing,
  simpleColoring,
  aic,
  als,
  uniqueness,
  sueDeCoq,
  forcingChain,
};
