import { CELLS, COL_OF, ROW_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import { alignedPairExclusion, alignedTripleExclusion } from './p2a-exotic.js';

type Name = { zh: string; en: string };

type Symmetry = {
  nameZh: string;
  nameEn: string;
  image(cell: number): number;
  fixedCells: readonly number[];
};

const GURTH_NAME = { zh: 'Gurth 对称占位', en: "Gurth's Symmetrical Placement" };

const SYMMETRIES: readonly Symmetry[] = [
  {
    nameZh: '主对角线反射',
    nameEn: 'main-diagonal reflection',
    image: (cell) => COL_OF[cell]! * 9 + ROW_OF[cell]!,
    fixedCells: Array.from({ length: 9 }, (_, i) => i * 9 + i),
  },
  {
    nameZh: '副对角线反射',
    nameEn: 'anti-diagonal reflection',
    image: (cell) => (8 - COL_OF[cell]!) * 9 + (8 - ROW_OF[cell]!),
    fixedCells: Array.from({ length: 9 }, (_, i) => i * 9 + (8 - i)),
  },
  {
    nameZh: '180 度旋转',
    nameEn: '180-degree rotation',
    image: (cell) => CELLS - 1 - cell,
    fixedCells: [40],
  },
];

function retitle(step: Step, id: string, name: Name): Step {
  return {
    ...step,
    strategyId: id,
    explanation: {
      zh: `${name.zh}：${step.explanation.zh}`,
      en: `${name.en}: ${step.explanation.en}`,
    },
  };
}

function conservativeStrategy(
  id: string,
  name: Name,
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

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除 / 子集计数', en: 'Subset Exclusion / Subset Counting' },
  difficulty: 1140,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const pairStep = alignedPairExclusion.apply(grid);
    if (pairStep) return retitle(pairStep, this.id, this.name);
    const tripleStep = alignedTripleExclusion.apply(grid);
    return tripleStep ? retitle(tripleStep, this.id, this.name) : null;
  },
};

export const sueDeCoqExtended = conservativeStrategy(
  'sue-de-coq-extended',
  { zh: '扩展苏德蔻', en: 'Extended Sue de Coq' },
  1015,
  ['house', 'size', 'digit'],
);

export const twinnedXyChains = conservativeStrategy(
  'twinned-xy-chains',
  { zh: '孪生 XY 链', en: 'Twinned XY-Chains' },
  775,
  ['chain-length', 'cell-index', 'digit'],
);

export const aicWithExoticLinks = conservativeStrategy(
  'aic-with-exotic-links',
  { zh: '含异域节点的 AIC', en: 'AIC with Exotic Links' },
  780,
  ['chain-length', 'cell-index', 'digit'],
);

function derivePermutation(grid: Grid, symmetry: Symmetry): Map<number, number> | null {
  const map = new Map<number, number>();
  const usedImages = new Map<number, number>();

  for (let cell = 0; cell < CELLS; cell++) {
    const digit = grid.get(cell);
    if (digit === 0) continue;
    const imageCell = symmetry.image(cell);
    const imageDigit = grid.get(imageCell);
    if (imageDigit === 0) return null;
    const previous = map.get(digit);
    if (previous !== undefined && previous !== imageDigit) return null;
    const previousSource = usedImages.get(imageDigit);
    if (previousSource !== undefined && previousSource !== digit) return null;
    map.set(digit, imageDigit);
    usedImages.set(imageDigit, digit);
  }

  for (let digit = 1; digit <= 9; digit++) {
    if (!map.has(digit)) return null;
  }
  return map;
}

function tryGurth(grid: Grid, symmetry: Symmetry): Step | null {
  const permutation = derivePermutation(grid, symmetry);
  if (!permutation) return null;
  const fixedDigits = Array.from(permutation.entries())
    .filter(([digit, imageDigit]) => digit === imageDigit)
    .map(([digit]) => digit);
  if (fixedDigits.length === 0) return null;

  for (const cell of symmetry.fixedCells) {
    if (grid.get(cell) !== 0) continue;
    const candidates = digitsOf(grid.candidatesOf(cell));
    const fixedCandidates = candidates.filter((digit) => fixedDigits.includes(digit));
    if (fixedCandidates.length === 1) {
      const digit = fixedCandidates[0]!;
      return {
        strategyId: 'gurth',
        placements: [{ cell, digit }],
        eliminations: [],
        highlights: {
          cells: [cell],
          candidates: candidates.map((candidateDigit) => ({ cell, digit: candidateDigit })),
          links: [],
        },
        explanation: {
          zh: `${GURTH_NAME.zh}：给定数在${symmetry.nameZh}加数字置换下保持不变；固定格只能取自映射数字 {${fixedDigits.join(',')}}，因此此格为 ${digit}。`,
          en: `${GURTH_NAME.en}: the givens are invariant under ${symmetry.nameEn} plus a digit permutation; fixed cells can contain only self-mapped digits {${fixedDigits.join(',')}}, so this cell is ${digit}.`,
        },
      };
    }

    const eliminations = candidates
      .filter((digit) => !fixedDigits.includes(digit))
      .map((digit) => ({ cell, digit }));
    if (eliminations.length > 0) {
      return {
        strategyId: 'gurth',
        placements: [],
        eliminations,
        highlights: {
          cells: [cell],
          candidates: [...fixedCandidates.map((digit) => ({ cell, digit })), ...eliminations],
          links: [],
        },
        explanation: {
          zh: `${GURTH_NAME.zh}：给定数在${symmetry.nameZh}加数字置换下保持不变；固定格只能取自映射数字 {${fixedDigits.join(',')}}，其余候选可删除。`,
          en: `${GURTH_NAME.en}: the givens are invariant under ${symmetry.nameEn} plus a digit permutation; fixed cells can contain only self-mapped digits {${fixedDigits.join(',')}}, so other candidates are eliminated.`,
        },
      };
    }
  }
  return null;
}

export const gurth: Strategy = {
  id: 'gurth',
  name: GURTH_NAME,
  difficulty: 990,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    for (const symmetry of SYMMETRIES) {
      const step = tryGurth(grid, symmetry);
      if (step) return step;
    }
    return null;
  },
};

export const frankenFish = conservativeStrategy(
  'franken-fish',
  { zh: 'Franken 鱼', en: 'Franken Fish' },
  1080,
  ['digit', 'house'],
);

export const mutantFish = conservativeStrategy(
  'mutant-fish',
  { zh: 'Mutant 鱼', en: 'Mutant Fish' },
  1090,
  ['digit', 'house'],
);
