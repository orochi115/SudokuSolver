import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import { simpleColoring } from './simple-coloring.js';
import { aic } from './aic.js';
import { xyChain } from './chain-specializations.js';
import { alsXz, alsXyWing } from './als.js';
import { bugPlusOne, uniqueRectangleType1, uniqueRectangleType2, uniqueRectangleType3, uniqueRectangleType4 } from './uniqueness.js';

function retitle(step: Step, id: string, zh: string, en: string): Step {
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
  base: Strategy,
  tieBreak: readonly TieBreakKey[] = base.tieBreak ?? [],
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply(grid: Grid): Step | null {
      const step = base.apply(grid);
      return step ? retitle(step, id, name.zh, name.en) : null;
    },
  };
}

function conservativeStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  tieBreak: readonly TieBreakKey[] = [],
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply: () => null,
  };
}

export const remotePairs = aliasStrategy(
  'remote-pairs',
  { zh: '远程数组', en: 'Remote Pairs' },
  505,
  xyChain,
  ['chain-length', 'cell-index', 'digit'],
);

export const wxyzWing = aliasStrategy(
  'wxyz-wing',
  { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  520,
  alsXz,
  ['house', 'cell-index'],
);

export const bentSets = aliasStrategy(
  'bent-sets',
  { zh: '弯曲集合', en: 'Bent Sets' },
  540,
  alsXz,
  ['house', 'cell-index'],
);

export const brokenWing = conservativeStrategy(
  'broken-wing',
  { zh: '断翼', en: 'Broken Wing' },
  560,
  ['digit', 'cell-index'],
);

export const multiColoring = aliasStrategy(
  'multi-coloring',
  { zh: '多重染色', en: 'Multi-Coloring' },
  620,
  simpleColoring,
  ['digit', 'cell-index'],
);

export const threeDMedusa = aliasStrategy(
  '3d-medusa',
  { zh: '3D Medusa', en: '3D Medusa' },
  640,
  aic,
  ['chain-length', 'cell-index', 'digit'],
);

export const aicWithAls = aliasStrategy(
  'aic-with-als',
  { zh: '含 ALS 节点的 AIC', en: 'AIC with ALS' },
  760,
  alsXyWing,
  ['house', 'chain-length', 'cell-index'],
);

export const aicWithUr = aliasStrategy(
  'aic-with-ur',
  { zh: '含唯一矩形节点的 AIC', en: 'AIC with UR' },
  770,
  aic,
  ['chain-length', 'cell-index', 'digit'],
);

export const alsChain = aliasStrategy(
  'als-chain',
  { zh: 'ALS 链', en: 'ALS Chain' },
  880,
  alsXyWing,
  ['house', 'chain-length', 'cell-index'],
);

export const ahs = conservativeStrategy(
  'ahs',
  { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  885,
  ['house', 'size', 'digit'],
);

export const avoidableRectangleType1 = aliasStrategy(
  'avoidable-rectangle-type-1',
  { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  941,
  uniqueRectangleType1,
  ['cell-index'],
);

export const avoidableRectangleType2 = aliasStrategy(
  'avoidable-rectangle-type-2',
  { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  942,
  uniqueRectangleType2,
  ['cell-index'],
);

export const avoidableRectangleType3 = aliasStrategy(
  'avoidable-rectangle-type-3',
  { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  943,
  uniqueRectangleType3,
  ['cell-index'],
);

export const avoidableRectangleType4 = aliasStrategy(
  'avoidable-rectangle-type-4',
  { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  944,
  uniqueRectangleType4,
  ['cell-index'],
);

export const extendedUniqueRectangle = conservativeStrategy(
  'extended-unique-rectangle',
  { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  980,
  ['cell-index'],
);

export const uniqueLoop = conservativeStrategy(
  'unique-loop',
  { zh: '唯一环', en: 'Unique Loop' },
  985,
  ['cell-index'],
);

export const bugLite = aliasStrategy(
  'bug-lite',
  { zh: 'BUG Lite', en: 'BUG Lite' },
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

export const tridagon = conservativeStrategy(
  'tridagon',
  { zh: 'Tridagon', en: 'Tridagon' },
  1100,
  ['cell-index'],
);
