/**
 * Strategy registry.
 *
 * The foundation registers only the reference strategy. Additional strategies
 * are registered here, keeping the array ordered by `difficulty`
 * (the solver sorts defensively, but ordering here documents the flow).
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
  nakedSingle,      // 10  - baseline
  fullHouse,        // 10  - baseline
  hiddenSingle,     // 20  - intersections
  lockedCandidates, // 25  - intersections
  nakedSubset,      // 30  - subsets
  hiddenSubset,     // 35  - subsets
  basicFish,        // 40  - fish
  singleDigitPatterns, // 42 - patterns
  xyWing,           // 45  - wings
  xyzWing,          // 47  - wings
  wWing,            // 45  - wings
  simpleColoring,   // 60  - coloring
  aic,              // 70  - chains / AIC
  als,              // 80  - ALS
  uniqueness,       // 90  - uniqueness (optional)
  sueDeCoq,         // 95  - exotic
  forcingChain,     // 100 - last resort
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