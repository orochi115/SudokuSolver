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
import { simpleColoring } from './simple-coloring.js';

export const STRATEGIES: readonly Strategy[] = [
  nakedSingle,
  hiddenSingle,
  // M2 placeholders would go here (pointing etc.)
  simpleColoring,
  // M3: aic, alsXz, uniqueRectangle, forcingChain etc.
];

export { nakedSingle, hiddenSingle, simpleColoring };
