/**
 * Strategy registry.
 *
 * Strategies are ordered by `difficulty` (ascending), so the solver loop
 * always prefers the cheapest available deduction first (FR-7).
 *
 * GLOBAL PRIORITY TABLE (Roadmap ② gate 2 — frozen canonical order).
 * The `difficulty` scalar is the engine's single, total ordering of strategies.
 * It is ranked by HUMAN recognition / learning cost (per docs/plans/diabolical-727.md),
 * NOT implementation or runtime cost. Two invariants are machine-checked
 * (test/strategy-profiles.test.ts):
 *   1. `STRATEGIES.map(s => s.id)` equals `CANONICAL_STRATEGY_ORDER` exactly —
 *      so any reordering is a deliberate edit to both, never accidental.
 *   2. No two strategies share a `difficulty` — the order is a strict total order,
 *      making default trace selection deterministic.
 * Adding a strategy therefore means: insert it at its difficulty band AND add its
 * id to CANONICAL_STRATEGY_ORDER at the same position.
 */

import type { Strategy } from '../strategy.js';
import { fullHouse } from './full-house.js';
import { nakedSingle } from './naked-single.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidatesPointing, lockedCandidatesClaiming } from './locked-candidates.js';
import { nakedPair, nakedTriple, nakedQuad } from './naked-subset.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from './hidden-subset.js';
import { xWing, swordfish, jellyfish } from './basic-fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from './single-digit-patterns.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';
import { simpleColoring } from './simple-coloring.js';
import { xChain, aic } from './aic.js';
import { alsXz, alsXzDoublyLinked, alsXyWing, deathBlossom, alsChain, ahs } from './als.js';
import { bugPlusOne, uniqueRectangleType1, uniqueRectangleType2, uniqueRectangleType4,
  hiddenUniqueRectangle, uniqueRectangleType3, uniqueRectangleType5, uniqueRectangleType6,
  extendedUniqueRectangle, uniqueLoop, bugLite, bugPlusN,
  avoidableRectangleType1, avoidableRectangleType2, avoidableRectangleType3, avoidableRectangleType4 } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { forcingChain } from './forcing-chain.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from './finned-fish.js';
import { turbotFish, remotePairs, xyChain, niceLoop } from './chain-strategies.js';
import { multiColoring, threeDMedusa } from './coloring.js';
import { wxyzWing, bentSets, brokenWing } from './wings-extra.js';
import { aicWithAls, aicWithUr } from './aic-extra.js';
import { tridagon } from './exotic.js';

export const STRATEGIES: readonly Strategy[] = [
  // Singles (1xx)
  fullHouse,          // 100
  nakedSingle,        // 150
  hiddenSingle,       // 170

  // Intersections (2xx)
  lockedCandidatesPointing, // 210
  lockedCandidatesClaiming, // 220

  // Subsets (3xx)
  nakedPair,          // 310
  hiddenPair,         // 320
  nakedTriple,        // 330
  hiddenTriple,       // 340
  nakedQuad,          // 350
  hiddenQuad,         // 360

  // Basic fish + short wings (4xx)
  xWing,              // 410
  finnedXWing,        // 415
  skyscraper,         // 420
  twoStringKite,      // 430
  emptyRectangle,     // 440
  swordfish,          // 450
  finnedSwordfish,    // 455
  xyWing,             // 460
  xyzWing,            // 470
  wWing,              // 480
  jellyfish,          // 490
  finnedJellyfish,    // 495

  // Advanced wings / single-digit (5xx)
  remotePairs,        // 505
  turbotFish,         // 510
  wxyzWing,           // 520
  bentSets,           // 540
  brokenWing,         // 560

  // Coloring (6xx)
  simpleColoring,     // 610
  multiColoring,      // 620
  threeDMedusa,       // 640

  // Chains / AIC (7xx)
  xChain,             // 710
  xyChain,            // 715
  niceLoop,           // 720
  aic,                // 750
  aicWithAls,         // 760
  aicWithUr,          // 770

  // ALS / AHS (8xx)
  alsXz,              // 810
  alsXzDoublyLinked,  // 820
  alsXyWing,          // 840
  deathBlossom,       // 860
  alsChain,           // 880
  ahs,                // 885

  // Uniqueness (9xx)
  bugPlusOne,         // 910
  uniqueRectangleType1, // 920
  uniqueRectangleType2, // 930
  hiddenUniqueRectangle, // 935
  uniqueRectangleType3, // 940
  avoidableRectangleType1, // 945
  avoidableRectangleType2, // 946
  avoidableRectangleType3, // 947
  avoidableRectangleType4, // 948
  uniqueRectangleType4, // 950
  uniqueRectangleType5, // 960
  uniqueRectangleType6, // 970
  extendedUniqueRectangle, // 980
  uniqueLoop,         // 985
  bugLite,            // 987
  bugPlusN,           // 989

  // Exotic (1xxx)
  sueDeCoq,           // 1010
  tridagon,           // 1100

  // Last-resort / red-line (9xxx) — excluded from the human-default profile
  forcingChain,       // 9000
];

/**
 * Frozen snapshot of the registry order (gate 2). MUST list every id in
 * `STRATEGIES` in the same order. Kept as an explicit constant so that a
 * reorder/insert is a visible, reviewable diff and is enforced by tests.
 */
export const CANONICAL_STRATEGY_ORDER: readonly string[] = [
  'full-house',
  'naked-single',
  'hidden-single',
  'locked-candidates-pointing',
  'locked-candidates-claiming',
  'naked-pair',
  'hidden-pair',
  'naked-triple',
  'hidden-triple',
  'naked-quad',
  'hidden-quad',
  'x-wing',
  'finned-x-wing',
  'skyscraper',
  'two-string-kite',
  'empty-rectangle',
  'swordfish',
  'finned-swordfish',
  'xy-wing',
  'xyz-wing',
  'w-wing',
  'jellyfish',
  'finned-jellyfish',
  'remote-pairs',
  'turbot-fish',
  'wxyz-wing',
  'bent-sets',
  'broken-wing',
  'simple-coloring',
  'multi-coloring',
  '3d-medusa',
  'x-chain',
  'xy-chain',
  'nice-loop',
  'aic',
  'aic-with-als',
  'aic-with-ur',
  'als-xz',
  'als-xz-doubly-linked',
  'als-xy-wing',
  'death-blossom',
  'als-chain',
  'ahs',
  'bug-plus-one',
  'unique-rectangle-type-1',
  'unique-rectangle-type-2',
  'hidden-unique-rectangle',
  'unique-rectangle-type-3',
  'avoidable-rectangle-type-1',
  'avoidable-rectangle-type-2',
  'avoidable-rectangle-type-3',
  'avoidable-rectangle-type-4',
  'unique-rectangle-type-4',
  'unique-rectangle-type-5',
  'unique-rectangle-type-6',
  'extended-unique-rectangle',
  'unique-loop',
  'bug-lite',
  'bug-plus-n',
  'sue-de-coq',
  'tridagon',
  'forcing-chain',
];

export {
  fullHouse,
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
  finnedXWing,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  swordfish,
  finnedSwordfish,
  xyWing,
  xyzWing,
  wWing,
  jellyfish,
  finnedJellyfish,
  remotePairs,
  turbotFish,
  wxyzWing,
  bentSets,
  brokenWing,
  simpleColoring,
  multiColoring,
  threeDMedusa,
  xChain,
  xyChain,
  niceLoop,
  aic,
  aicWithAls,
  aicWithUr,
  alsXz,
  alsXzDoublyLinked,
  alsXyWing,
  deathBlossom,
  alsChain,
  ahs,
  bugPlusOne,
  uniqueRectangleType1,
  uniqueRectangleType2,
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
  uniqueRectangleType4,
  uniqueRectangleType5,
  uniqueRectangleType6,
  extendedUniqueRectangle,
  uniqueLoop,
  bugLite,
  bugPlusN,
  sueDeCoq,
  tridagon,
  forcingChain,
};
