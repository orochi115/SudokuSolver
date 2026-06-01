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
import { nakedPair } from './naked-pair.js';
import { nakedTriple } from './naked-triple.js';
import { nakedQuad } from './naked-quad.js';
import { hiddenPair } from './hidden-pair.js';
import { hiddenTriple } from './hidden-triple.js';
import { hiddenQuad } from './hidden-quad.js';
import { xWing } from './x-wing.js';
import { swordfish } from './swordfish.js';
import { jellyfish } from './jellyfish.js';
import { skyscraper } from './skyscraper.js';
import { twoStringKite } from './two-string-kite.js';
import { emptyRectangle } from './empty-rectangle.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';

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
  // M3: simpleColoring, aic, alsXz, ... uniqueRectangle, forcingChain
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
