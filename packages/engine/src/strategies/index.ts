/**
 * Strategy registry.
 *
 * Strategies are registered here ordered by `difficulty` (cheapest first). The
 * solver sorts defensively, but ordering here documents the "systematised flow"
 * (FR-7): singles → intersections → subsets → fish → single-digit patterns →
 * wings → coloring → AIC → ALS → uniqueness → exotic → forcing. Each entry is a
 * pure module implementing the Strategy contract.
 *
 * The grouped ids required by M2/M3 (full-house, hidden-single, locked-candidates,
 * naked-subset, hidden-subset, basic-fish, single-digit-patterns, xy-wing,
 * xyz-wing, w-wing, simple-coloring, aic, als, uniqueness, sue-de-coq,
 * forcing-chain) each cover their sub-techniques internally — e.g. `aic`
 * subsumes X-Chain/XY-Chain/Nice Loops, `als` covers ALS-XZ/chain/Death Blossom,
 * `uniqueness` covers UR/AR/BUG+1.
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
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { als } from './als.js';
import { uniqueness } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { forcingChain } from './forcing-chain.js';

export const STRATEGIES: readonly Strategy[] = [
  fullHouse, // 5
  nakedSingle, // 10
  hiddenSingle, // 10
  lockedCandidates, // 20
  nakedSubset, // 30
  hiddenSubset, // 35
  basicFish, // 40
  singleDigitPatterns, // 45
  wWing, // 50
  xyWing, // 50
  xyzWing, // 55
  simpleColoring, // 60
  aic, // 70
  als, // 80
  uniqueness, // 90
  sueDeCoq, // 95
  forcingChain, // 100
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
  simpleColoring,
  aic,
  als,
  uniqueness,
  sueDeCoq,
  forcingChain,
};
