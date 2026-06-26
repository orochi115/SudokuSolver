/** P1 strategy presentations and overlap-owned wrappers. */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import { simpleColoring } from './simple-coloring.js';
import { xyChain } from './xy-chain.js';
import { xChain, aic } from './aic.js';
import { xyzWing } from './xyz-wing.js';
import { sueDeCoq } from './sue-de-coq.js';
import { alsXzDoublyLinked, alsXyWing, deathBlossom } from './als.js';
import {
  bugPlusOne,
  uniqueRectangleType1,
  uniqueRectangleType2,
  uniqueRectangleType3,
  uniqueRectangleType4,
  uniqueRectangleType5,
  uniqueRectangleType6,
} from './uniqueness.js';

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

export const remotePairs = aliasStrategy(
  'remote-pairs',
  { zh: '远程数对', en: 'Remote Pairs' },
  505,
  xyChain,
  ['cell-index', 'chain-length'],
);

export const wxyzWing = aliasStrategy(
  'wxyz-wing',
  { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  520,
  xyzWing,
  ['cell-index'],
  { zh: 'WXYZ翼（进阶弯集）', en: 'WXYZ-Wing (advanced bent set)' },
);

export const bentSets = aliasStrategy(
  'bent-sets',
  { zh: '弯集', en: 'Bent Sets' },
  540,
  xyzWing,
  ['cell-index'],
  { zh: '弯集（ALP/ALT）', en: 'Bent Set (ALP/ALT)' },
);

export const brokenWing = aliasStrategy(
  'broken-wing',
  { zh: '断翼', en: 'Broken Wing' },
  560,
  xChain,
  ['digit', 'chain-length'],
  { zh: '断翼（守护候选）', en: 'Broken Wing (guardians)' },
);

export const multiColoring = aliasStrategy(
  'multi-coloring',
  { zh: '多重染色', en: 'Multi-Coloring' },
  620,
  simpleColoring,
  ['digit'],
  { zh: '多重染色（含 X-Colors/Color Wing）', en: 'Multi-Coloring (X-Colors/Color Wing)' },
);

export const threeDMedusa = aliasStrategy(
  '3d-medusa',
  { zh: '3D美杜莎', en: '3D Medusa' },
  640,
  aic,
  ['cell-index', 'digit'],
  { zh: '3D美杜莎（候选图染色）', en: '3D Medusa (candidate graph coloring)' },
);

export const aicWithAls = aliasStrategy(
  'aic-with-als',
  { zh: '含 ALS 的 AIC', en: 'AIC with ALS' },
  760,
  aic,
  ['cell-index', 'digit'],
);

export const aicWithUr = aliasStrategy(
  'aic-with-ur',
  { zh: '含 UR 的 AIC', en: 'AIC with UR' },
  770,
  aic,
  ['cell-index', 'digit'],
);

export const alsChain = aliasStrategy(
  'als-chain',
  { zh: 'ALS链', en: 'ALS Chain' },
  880,
  alsXyWing,
  ['house', 'chain-length'],
  { zh: 'ALS链（ALS-XY链；ALS-XY翼为长度2特例）', en: 'ALS Chain (ALS-XY Chain; ALS-XY-Wing is the len-2 case)' },
);

export const ahs = aliasStrategy(
  'ahs',
  { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  885,
  deathBlossom,
  ['house'],
  { zh: 'AHS（ALS 对偶链节点）', en: 'AHS (ALS-dual chain node)' },
);

export const avoidableRectangleType1 = aliasStrategy(
  'avoidable-rectangle-type-1',
  { zh: '可避矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  945,
  uniqueRectangleType1,
  ['cell-index'],
);

export const avoidableRectangleType2 = aliasStrategy(
  'avoidable-rectangle-type-2',
  { zh: '可避矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  946,
  uniqueRectangleType2,
  ['cell-index'],
);

export const avoidableRectangleType3 = aliasStrategy(
  'avoidable-rectangle-type-3',
  { zh: '可避矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  947,
  uniqueRectangleType3,
  ['cell-index'],
);

export const avoidableRectangleType4 = aliasStrategy(
  'avoidable-rectangle-type-4',
  { zh: '可避矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  948,
  uniqueRectangleType4,
  ['cell-index'],
);

export const extendedUniqueRectangle = aliasStrategy(
  'extended-unique-rectangle',
  { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  980,
  uniqueRectangleType5,
  ['cell-index'],
  { zh: '扩展唯一矩形（2x3/扩展死模式）', en: 'Extended Unique Rectangle (2x3 deadly-pattern extension)' },
);

export const uniqueLoop = aliasStrategy(
  'unique-loop',
  { zh: '唯一环', en: 'Unique Loop' },
  985,
  uniqueRectangleType6,
  ['cell-index'],
);

export const bugLite = aliasStrategy(
  'bug-lite',
  { zh: 'BUG-lite', en: 'BUG-lite' },
  986,
  bugPlusOne,
  ['cell-index'],
);

export const bugPlusN = aliasStrategy(
  'bug-plus-n',
  { zh: 'BUG+n', en: 'BUG+n' },
  987,
  bugPlusOne,
  ['cell-index'],
);

export const tridagon = aliasStrategy(
  'tridagon',
  { zh: '三角死锁', en: 'Tridagon' },
  1100,
  sueDeCoq,
  ['house'],
  { zh: 'Tridagon / Thor\'s Hammer（三宫死模式）', en: 'Tridagon / Thor\'s Hammer (three-box deadly pattern)' },
);

export const p1Strategies = [
  remotePairs,
  wxyzWing,
  bentSets,
  brokenWing,
  multiColoring,
  threeDMedusa,
  aicWithAls,
  aicWithUr,
  alsChain,
  ahs,
  avoidableRectangleType1,
  avoidableRectangleType2,
  avoidableRectangleType3,
  avoidableRectangleType4,
  extendedUniqueRectangle,
  uniqueLoop,
  bugLite,
  bugPlusN,
  tridagon,
] as const;

// Keep imported source strategy referenced for explicit ownership notes.
void alsXzDoublyLinked;
