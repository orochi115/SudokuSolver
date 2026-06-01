/**
 * Strategy registry.
 *
 * The foundation registers only the reference strategy. Additional strategies
 * are registered here, keeping the array ordered by `difficulty`
 * (the solver sorts defensively, but ordering here documents the flow).
 */

import type { Strategy } from '../strategy.js';
import { nakedSingle } from './naked-single.js';

export const STRATEGIES: readonly Strategy[] = [
  nakedSingle,
  // M2: hiddenSingle, pointing, claiming, nakedPair/Triple/Quad, hiddenPair/Triple/Quad
  // M3: xWing, swordfish, jellyfish, skyscraper, twoStringKite, emptyRectangle,
  //     xyWing, xyzWing, wWing, simpleColoring, aic, alsXz, ... uniqueRectangle, forcingChain
];

export { nakedSingle };
