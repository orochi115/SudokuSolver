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
import { finnedXWing, finnedSwordfish, finnedJellyfish } from './finned-fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from './single-digit-patterns.js';
import { turbotFish } from './turbot-fish.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';
import { remotePairs, wxyzWing, bentSets, brokenWing } from './advanced-wings.js';
import { simpleColoring } from './simple-coloring.js';
import { multiColoring } from './multi-coloring.js';
import { medusa3D } from './3d-medusa.js';
import { xChain, aic } from './aic.js';
import { xyChain } from './xy-chain.js';
import { niceLoop } from './nice-loop.js';
import { aicWithALS, aicWithUR } from './aic-extended.js';
import { alsXz, alsXzDoublyLinked, alsXyWing, deathBlossom } from './als.js';
import { alsChain, ahs } from './als-chain.js';
import { bugPlusOne, uniqueRectangleType1, uniqueRectangleType2, uniqueRectangleType4 } from './uniqueness.js';
import {
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from './uniqueness-extended.js';
import {
  bugLite,
  bugPlusN,
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
  extendedUniqueRectangle,
  uniqueLoop,
} from './uniqueness-p1.js';
import { sueDeCoq } from './sue-de-coq.js';
import { tridagon } from './tridagon.js';
import { forcingChain } from './forcing-chain.js';
import {
  vwxyzWing,
  twinnedXyChains,
  aicWithExoticLinks,
  gurth,
  sueDeCoqExtended,
  fireworks,
  frankenFish,
  mutantFish,
  alignedPairExclusion,
  alignedTripleExclusion,
  subsetExclusion,
  exocet,
  skLoop,
  msls,
} from './p2-stubs.js';

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

  // Basic fish + short wings (4xx)  [5xx reserved for advanced wings]
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
  vwxyzWing,          // 530
  bentSets,           // 540
  brokenWing,         // 560

  // Coloring (6xx)
  simpleColoring,     // 610
  multiColoring,      // 620
  medusa3D,           // 640

  // Chains (7xx)
  xChain,             // 710
  xyChain,            // 715
  niceLoop,           // 720
  aic,                // 750
  aicWithALS,         // 760
  aicWithUR,          // 770
  twinnedXyChains,    // 775
  aicWithExoticLinks, // 780

  // ALS (8xx)
  alsXz,              // 810
  alsXzDoublyLinked,  // 820
  alsXyWing,          // 840
  deathBlossom,       // 860
  alsChain,           // 880
  ahs,                // 885

  // Uniqueness (9xx)
  bugPlusOne,         // 910
  bugLite,            // 912
  bugPlusN,           // 914
  uniqueRectangleType1, // 920
  uniqueRectangleType2, // 930
  hiddenUniqueRectangle, // 935
  uniqueRectangleType3,  // 940
  uniqueRectangleType4,  // 950
  uniqueRectangleType5,  // 960
  uniqueRectangleType6,  // 970
  avoidableRectangleType1, // 975
  avoidableRectangleType2, // 976
  avoidableRectangleType3, // 977
  avoidableRectangleType4, // 978
  extendedUniqueRectangle, // 980
  uniqueLoop,         // 985
  gurth,              // 990

  // Exotic (1xxx)
  sueDeCoq,           // 1010
  sueDeCoqExtended,   // 1015
  fireworks,          // 1050
  frankenFish,        // 1080
  mutantFish,         // 1090
  tridagon,           // 1100
  alignedPairExclusion,    // 1120
  alignedTripleExclusion,  // 1130
  subsetExclusion,         // 1140
  exocet,             // 1200
  skLoop,             // 1250
  msls,               // 1300

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
  'vwxyz-wing',
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
  'twinned-xy-chains',
  'aic-with-exotic-links',
  'als-xz',
  'als-xz-doubly-linked',
  'als-xy-wing',
  'death-blossom',
  'als-chain',
  'ahs',
  'bug-plus-one',
  'bug-lite',
  'bug-plus-n',
  'unique-rectangle-type-1',
  'unique-rectangle-type-2',
  'hidden-unique-rectangle',
  'unique-rectangle-type-3',
  'unique-rectangle-type-4',
  'unique-rectangle-type-5',
  'unique-rectangle-type-6',
  'avoidable-rectangle-type-1',
  'avoidable-rectangle-type-2',
  'avoidable-rectangle-type-3',
  'avoidable-rectangle-type-4',
  'extended-unique-rectangle',
  'unique-loop',
  'gurth',
  'sue-de-coq',
  'sue-de-coq-extended',
  'fireworks',
  'franken-fish',
  'mutant-fish',
  'tridagon',
  'aligned-pair-exclusion',
  'aligned-triple-exclusion',
  'subset-exclusion',
  'exocet',
  'sk-loop',
  'msls',
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
  vwxyzWing,
  bentSets,
  brokenWing,
  simpleColoring,
  multiColoring,
  medusa3D,
  xChain,
  xyChain,
  niceLoop,
  aic,
  aicWithALS,
  aicWithUR,
  twinnedXyChains,
  aicWithExoticLinks,
  alsXz,
  alsXzDoublyLinked,
  alsXyWing,
  deathBlossom,
  alsChain,
  ahs,
  bugPlusOne,
  bugLite,
  bugPlusN,
  uniqueRectangleType1,
  uniqueRectangleType2,
  hiddenUniqueRectangle,
  uniqueRectangleType3,
  uniqueRectangleType4,
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
  uniqueRectangleType5,
  uniqueRectangleType6,
  extendedUniqueRectangle,
  uniqueLoop,
  gurth,
  sueDeCoq,
  sueDeCoqExtended,
  fireworks,
  frankenFish,
  mutantFish,
  tridagon,
  alignedPairExclusion,
  alignedTripleExclusion,
  subsetExclusion,
  exocet,
  skLoop,
  msls,
  forcingChain,
};
