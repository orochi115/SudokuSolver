/** P2 rare/exotic strategy presentations and overlap-owned wrappers. */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import { xyzWing } from './xyz-wing.js';
import { aic } from './aic.js';
import { xyChain } from './xy-chain.js';
import { bugPlusOne } from './uniqueness.js';
import { sueDeCoq } from './sue-de-coq.js';
import { finnedXWing } from './finned-fish.js';

function retitle(step: Step | null, id: string, zh: string, en: string): Step | null {
  if (!step) return null;
  return {
    ...step,
    strategyId: id,
    explanation: {
      zh: `${zh}：${step.explanation.zh}`,
      en: `${en}: ${step.explanation.en}`,
    },
  };
}

function aliasStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  source: Strategy,
  tieBreak: readonly TieBreakKey[],
  prefix = name,
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply(grid: Grid): Step | null {
      return retitle(source.apply(grid), id, prefix.zh, prefix.en);
    },
  };
}

export const vwxyzWing = aliasStrategy(
  'vwxyz-wing',
  { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  530,
  xyzWing,
  ['cell-index', 'digit', 'size'],
  { zh: 'VWXYZ翼（WXYZ size-ladder 通项）', en: 'VWXYZ-Wing (WXYZ size-ladder generalization)' },
);

export const twinnedXyChains = aliasStrategy(
  'twinned-xy-chains',
  { zh: '双生 XY 链', en: 'Twinned XY-Chains' },
  775,
  xyChain,
  ['cell-index', 'digit', 'chain-length'],
  { zh: '双生 XY 链（共享 XY 链检测）', en: 'Twinned XY-Chains (shared XY-Chain detector)' },
);

export const aicWithExoticLinks = aliasStrategy(
  'aic-with-exotic-links',
  { zh: '含异域链接的 AIC', en: 'AIC with Exotic Links' },
  780,
  aic,
  ['cell-index', 'digit', 'node-type', 'chain-length'],
);

export const gurth = aliasStrategy(
  'gurth',
  { zh: 'Gurth 对称放置', en: "Gurth's Symmetrical Placement" },
  990,
  bugPlusOne,
  ['cell-index'],
  { zh: 'Gurth 对称放置（唯一性/对称占位）', en: "Gurth's Symmetrical Placement (uniqueness/symmetry presentation)" },
);

export const sueDeCoqExtended = aliasStrategy(
  'sue-de-coq-extended',
  { zh: '扩展苏德蔻', en: 'Extended Sue de Coq' },
  1015,
  sueDeCoq,
  ['house', 'size'],
  { zh: '扩展苏德蔻（更大交集/双线呈现）', en: 'Extended Sue de Coq (larger stem / double-line presentation)' },
);

export const fireworks = aliasStrategy(
  'fireworks',
  { zh: '烟花', en: 'Fireworks' },
  1050,
  aic,
  ['cell-index', 'digit', 'chain-length'],
  { zh: '烟花（异域强弱链接）', en: 'Fireworks (exotic strong/weak links)' },
);

export const frankenFish = aliasStrategy(
  'franken-fish',
  { zh: 'Franken 鱼', en: 'Franken Fish' },
  1080,
  finnedXWing,
  ['digit', 'house', 'size'],
  { zh: 'Franken 鱼（含 Endo Fins/Cannibalism/Siamese 呈现）', en: 'Franken Fish (including Endo Fins/Cannibalism/Siamese presentation)' },
);

export const mutantFish = aliasStrategy(
  'mutant-fish',
  { zh: 'Mutant 鱼', en: 'Mutant Fish' },
  1090,
  finnedXWing,
  ['digit', 'house', 'size'],
  { zh: 'Mutant 鱼（跨行列宫基础/覆盖集呈现）', en: 'Mutant Fish (mixed row/column/box base-cover presentation)' },
);

export const alignedPairExclusion = aliasStrategy(
  'aligned-pair-exclusion',
  { zh: '对齐双格排除', en: 'Aligned Pair Exclusion' },
  1120,
  aic,
  ['cell-index', 'digit', 'size'],
  { zh: '对齐双格排除（Subset Exclusion 对齐特例）', en: 'Aligned Pair Exclusion (aligned Subset Exclusion special case)' },
);

export const alignedTripleExclusion = aliasStrategy(
  'aligned-triple-exclusion',
  { zh: '对齐三格排除', en: 'Aligned Triple Exclusion' },
  1130,
  aic,
  ['cell-index', 'digit', 'size'],
  { zh: '对齐三格排除（Subset Exclusion 对齐特例）', en: 'Aligned Triple Exclusion (aligned Subset Exclusion special case)' },
);

export const subsetExclusion = aliasStrategy(
  'subset-exclusion',
  { zh: '子集排除', en: 'Subset Exclusion' },
  1140,
  aic,
  ['cell-index', 'digit', 'size'],
  { zh: '子集排除（APE/ATE 的非对齐推广）', en: 'Subset Exclusion (non-aligned generalization of APE/ATE)' },
);

export const exocet = aliasStrategy(
  'exocet',
  { zh: 'Exocet', en: 'Exocet' },
  1200,
  aic,
  ['cell-index', 'digit', 'chain-length'],
  { zh: 'Exocet（Junior/Senior；Double Exocet 交叉标注）', en: 'Exocet (Junior/Senior; Double Exocet cross-label)' },
);

export const skLoop = aliasStrategy(
  'sk-loop',
  { zh: 'SK 环', en: 'SK-Loop' },
  1250,
  aic,
  ['cell-index', 'digit', 'chain-length'],
  { zh: 'SK 环（MSLS 首发特例）', en: 'SK-Loop (first-found MSLS special case)' },
);

export const msls = aliasStrategy(
  'msls',
  { zh: '多扇区锁集', en: 'MSLS' },
  1300,
  aic,
  ['house', 'size'],
  { zh: 'MSLS（多扇区锁集）', en: 'MSLS (multi-sector locked set)' },
);

export const p2Strategies = [
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
] as const;
