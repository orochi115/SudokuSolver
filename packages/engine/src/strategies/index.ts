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
import { lockedCandidatesPointing } from './locked-candidates-pointing.js';
import { lockedCandidatesClaiming } from './locked-candidates-claiming.js';
import { nakedPair } from './naked-pair.js';
import { hiddenPair } from './hidden-pair.js';
import { nakedTriple } from './naked-triple.js';
import { hiddenTriple } from './hidden-triple.js';
import { nakedQuad } from './naked-quad.js';
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
  nakedSingle,
  hiddenSingle,
  lockedCandidatesPointing,
  lockedCandidatesClaiming,
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
];

export { nakedSingle, hiddenSingle, lockedCandidatesPointing, lockedCandidatesClaiming, nakedPair, hiddenPair, nakedTriple, hiddenTriple, nakedQuad, hiddenQuad, xWing, swordfish, jellyfish, skyscraper, twoStringKite, emptyRectangle, xyWing, xyzWing, wWing };
