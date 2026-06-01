import type { Strategy } from '../strategy.js';
import { nakedSingle } from './naked-single.js';
import { fullHouse } from './full-house.js';
import { hiddenSingle } from './hidden-single.js';
import { lockedCandidates } from './locked-candidates.js';
import { nakedSubset } from './naked-subset.js';
import { hiddenSubset } from './hidden-subset.js';
import { basicFish } from './basic-fish.js';
import { singleDigitPatterns } from './single-digit-patterns.js';
import { xyWing } from './xy-wing.js';
import { xyzWing } from './xyz-wing.js';
import { wWing } from './w-wing.js';
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { als } from './als.js';
import { uniqueness } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { forcingChain } from './forcing-chain.js';

export const STRATEGIES: readonly Strategy[] = [
  fullHouse,
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedSubset,
  hiddenSubset,
  basicFish,
  singleDigitPatterns,
  xyWing,
  xyzWing,
  wWing,
  simpleColoring,
  aic,
  als,
  uniqueness,
  sueDeCoq,
  forcingChain,
];

export { nakedSingle };
export { fullHouse };
export { hiddenSingle };
export { lockedCandidates };
export { nakedSubset };
export { hiddenSubset };
export { basicFish };
export { singleDigitPatterns };
export { xyWing };
export { xyzWing };
export { wWing };
export { simpleColoring };
export { aic };
export { als };
export { uniqueness };
export { sueDeCoq };
export { forcingChain };