/**
 * Strategy registry.
 *
 * The foundation registers only the reference strategy. Additional strategies
 * are registered here, keeping the array ordered by `difficulty`
 * (the solver sorts defensively, but ordering here documents the flow).
 */

import type { Strategy } from '../strategy.js';
import { nakedSingle } from './naked-single.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidates } from './locked-candidates.js';
import { nakedSubsets } from './naked-subsets.js';
import { hiddenSubsets } from './hidden-subsets.js';
import { fish } from './fish.js';
import { singleDigitPatterns } from './single-digit-patterns.js';
import { wings } from './wings.js';

export const STRATEGIES: readonly Strategy[] = [
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedSubsets,
  hiddenSubsets,
  fish,
  singleDigitPatterns,
  wings,
];

export {
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedSubsets,
  hiddenSubsets,
  fish,
  singleDigitPatterns,
  wings,
};
