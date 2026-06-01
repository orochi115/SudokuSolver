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
import { pointing } from './pointing.js';
import { claiming } from './claiming.js';
import { nakedPair, nakedTriple, nakedQuad } from './naked-subset.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from './hidden-subset.js';
import { xWing, swordfish, jellyfish } from './fish.js';
import { skyscraper } from './skyscraper.js';
import { twoStringKite } from './two-string-kite.js';
import { emptyRectangle } from './empty-rectangle.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { als } from './als.js';
import { uniqueness } from './uniqueness.js';

export const STRATEGIES: readonly Strategy[] = [
  fullHouse,
  nakedSingle,
  hiddenSingle,
  pointing,
  claiming,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
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
  simpleColoring,
  aic,
  als,
  uniqueness,
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
  simpleColoring,
  aic,
  als,
  uniqueness,
};

