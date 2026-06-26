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
import { alsXz, alsXzDoublyLinked, alsXyWing, deathBlossom } from './als.js';
import { bugPlusOne, uniqueRectangleType1, uniqueRectangleType2, uniqueRectangleType4 } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { forcingChain } from './forcing-chain.js';
import { finnedXWing, finnedSwordfish, finnedJellyfish } from './finned-fish.js';
import { turbotFish } from './turbot-fish.js';
import { xyChain } from './xy-chain.js';
import { niceLoop } from './nice-loop.js';
import { uniqueRectangleType3, uniqueRectangleType5, uniqueRectangleType6, hiddenUniqueRectangle } from './uniqueness-ext.js';
import { tridagon } from './tridagon.js';
import { multiColoring } from './multi-coloring.js';
import { medusa3d } from './3d-medusa.js';
import { alsChain } from './als-chain.js';
import { ahs } from './ahs.js';
import { wxyzWing } from './wxyz-wing.js';
import { remotePairs } from './remote-pairs.js';
import { bentSets } from './bent-sets.js';
import { brokenWing } from './broken-wing.js';
import { avoidableRectangleType1, avoidableRectangleType2, avoidableRectangleType3, avoidableRectangleType4 } from './avoidable-rectangle.js';
import { extendedUniqueRectangle, uniqueLoop, bugLite, bugPlusN } from './uniqueness-ext2.js';
import { aicWithAls, aicWithUr } from './aic-ext.js';
import { vwxyzWing } from './vwxyz-wing.js';
import { exocet } from './exocet.js';
import { skLoop } from './sk-loop.js';
import { msls } from './msls.js';
import { fireworks } from './fireworks.js';
import { alignedPairExclusion, alignedTripleExclusion } from './ape-ate.js';
import { subsetExclusion } from './subset-exclusion.js';
import { sueDeCoqExtended } from './sue-de-coq-ext.js';
import { aicWithExoticLinks } from './aic-exotic-links.js';
import { twinnedXyChains } from './twinned-xy-chains.js';
import { frankenFish, mutantFish } from './franken-mutant.js';
import { gurth } from './gurth.js';

export const STRATEGIES: readonly Strategy[] = [
  fullHouse,          // 100
  nakedSingle,        // 150
  hiddenSingle,       // 170
  lockedCandidatesPointing, // 210
  lockedCandidatesClaiming, // 220
  nakedPair,          // 310
  hiddenPair,         // 320
  nakedTriple,        // 330
  hiddenTriple,       // 340
  nakedQuad,          // 350
  hiddenQuad,         // 360
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
  remotePairs,        // 505
  turbotFish,         // 510
  wxyzWing,           // 520
  vwxyzWing,          // 530
  bentSets,           // 540
  brokenWing,         // 560
  simpleColoring,     // 610
  multiColoring,      // 620
  medusa3d,           // 640
  xChain,             // 710
  xyChain,            // 715
  niceLoop,           // 720
  aic,                // 750
  aicWithAls,         // 760
  aicWithUr,          // 770
  twinnedXyChains,    // 775
  aicWithExoticLinks, // 780
  alsXz,              // 810
  alsXzDoublyLinked,  // 820
  alsXyWing,          // 840
  deathBlossom,       // 860
  alsChain,           // 880
  ahs,                // 885
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
  bugLite,            // 986
  bugPlusN,           // 987
  gurth,              // 990
  sueDeCoq,           // 1010
  sueDeCoqExtended,   // 1015
  fireworks,          // 1050
  frankenFish,        // 1080
  mutantFish,         // 1090
  tridagon,           // 1100
  alignedPairExclusion, // 1120
  alignedTripleExclusion, // 1130
  subsetExclusion,    // 1140
  exocet,             // 1200
  skLoop,             // 1250
  msls,               // 1300
  forcingChain,       // 9000
];

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
  medusa3d,
  xChain,
  xyChain,
  niceLoop,
  aic,
  aicWithAls,
  aicWithUr,
  aicWithExoticLinks,
  twinnedXyChains,
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