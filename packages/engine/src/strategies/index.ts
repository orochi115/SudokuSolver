/**
 * Strategy registry.
 *
 * The foundation registers only the reference strategy. Additional strategies
 * are registered here, keeping the array ordered by `difficulty`
 * (the solver sorts defensively, but ordering here documents the flow).
 */

import type { Strategy } from '../strategy.js';
import { fullHouse } from './full-house.js';
import { nakedSingle } from './naked-single.js';
import { hiddenSingle } from './hidden-single.js';
import { pointing } from './pointing.js';
import { claiming } from './claiming.js';
import { nakedPair, nakedTriple, nakedQuad } from './naked-subsets.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from './hidden-subsets.js';
import { xWing, swordfish, jellyfish } from './fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from './single-digit-patterns.js';
import { xyWing, xyzWing, wWing } from './wings.js';

export const STRATEGIES: readonly Strategy[] = [
  fullHouse,
  nakedSingle,
  hiddenSingle,
  pointing,
  claiming,
  nakedPair,
  nakedTriple,
  nakedQuad,
  hiddenPair,
  hiddenTriple,
  hiddenQuad,
  xWing,
  swordfish,
  jellyfish,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  xyWing,
  xyzWing,
  wWing,
];

export {
  fullHouse,
  nakedSingle,
  hiddenSingle,
  pointing,
  claiming,
  nakedPair,
  nakedTriple,
  nakedQuad,
  hiddenPair,
  hiddenTriple,
  hiddenQuad,
  xWing,
  swordfish,
  jellyfish,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  xyWing,
  xyzWing,
  wWing,
};
