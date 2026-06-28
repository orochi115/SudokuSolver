import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { makeForcingChain, type ForcingStrategyOptions } from './forcing-chain.js';

type P3Definition = {
  readonly id: string;
  readonly name: { zh: string; en: string };
  readonly difficulty: number;
  readonly zhPrefix: string;
  readonly enPrefix: string;
  readonly search: ForcingStrategyOptions['search'];
};

function prefixStep(step: Step, definition: P3Definition): Step {
  return {
    ...step,
    strategyId: definition.id,
    explanation: {
      zh: `${definition.zhPrefix}：${step.explanation.zh}`,
      en: `${definition.enPrefix}: ${step.explanation.en}`,
    },
  };
}

function makeP3ForcingStrategy(definition: P3Definition): Strategy {
  const core = makeForcingChain(undefined, {
    id: definition.id,
    name: definition.name,
    difficulty: definition.difficulty,
    search: definition.search,
  });

  return {
    ...core,
    tieBreak: ['node-type', 'cell-index', 'digit'],
    apply(grid: Grid): Step | null {
      const step = core.apply(grid);
      return step ? prefixStep(step, definition) : null;
    },
  };
}

const commonConclusionOnly = {
  allowContradiction: false,
  combineGraphAndContradiction: false,
} as const;

const allBoundedForcing = {
  combineGraphAndContradiction: true,
} as const;

export const digitForcingChain: Strategy = makeP3ForcingStrategy({
  id: 'digit-forcing-chain',
  name: { zh: '数字强制链', en: 'Digit Forcing Chain' },
  difficulty: 9010,
  zhPrefix: '数字强制链（按数字在区内候选分支复用 bounded forcing 引擎）',
  enPrefix: 'Digit forcing chain (bounded forcing over digit alternatives)',
  search: {
    ...commonConclusionOnly,
    allowCellGraph: false,
    allowLegacyCell: false,
  },
});

export const nishioForcingChain: Strategy = makeP3ForcingStrategy({
  id: 'nishio-forcing-chain',
  name: { zh: 'Nishio 强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  zhPrefix: 'Nishio 强制链（候选假设导致矛盾时消去）',
  enPrefix: 'Nishio forcing chain (candidate assumption reaches contradiction)',
  search: {
    allowCellGraph: false,
    allowDigitGraph: false,
    allowLegacyCell: false,
    allowLegacyHouse: false,
    allowContradiction: true,
    combineGraphAndContradiction: false,
  },
});

export const cellForcingChain: Strategy = makeP3ForcingStrategy({
  id: 'cell-forcing-chain',
  name: { zh: '单元格强制链', en: 'Cell Forcing Chain' },
  difficulty: 9030,
  zhPrefix: '单元格强制链（按格内候选分支复用 bounded forcing 引擎）',
  enPrefix: 'Cell forcing chain (bounded forcing over cell alternatives)',
  search: {
    ...commonConclusionOnly,
    allowDigitGraph: false,
    allowLegacyHouse: false,
  },
});

export const regionForcingChain: Strategy = makeP3ForcingStrategy({
  id: 'region-forcing-chain',
  name: { zh: '区强制链', en: 'Region Forcing Chain' },
  difficulty: 9040,
  zhPrefix: '区强制链（按行列宫候选位置分支复用 bounded forcing 引擎）',
  enPrefix: 'Region forcing chain (bounded forcing over house positions)',
  search: {
    ...commonConclusionOnly,
    allowCellGraph: false,
    allowLegacyCell: false,
  },
});

export const doubleImplicationChain: Strategy = makeP3ForcingStrategy({
  id: 'dic',
  name: { zh: '双重蕴含链', en: 'Double Implication Chain' },
  difficulty: 9050,
  zhPrefix: '双重蕴含链（双向蕴含得到共同结论）',
  enPrefix: 'Double implication chain (both branches imply the same result)',
  search: commonConclusionOnly,
});

export const forcingNet: Strategy = makeP3ForcingStrategy({
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9100,
  zhPrefix: '强制网（kind: cell / region / contradiction / verity，共用受限强制推演）',
  enPrefix: 'Forcing net (kind: cell / region / contradiction / verity, bounded forcing)',
  search: allBoundedForcing,
});

export const krakenFish: Strategy = makeP3ForcingStrategy({
  id: 'kraken-fish',
  name: { zh: 'Kraken 鱼', en: 'Kraken Fish' },
  difficulty: 9200,
  zhPrefix: 'Kraken 鱼（鱼结构候选分支接强制链；当前复用同一 sound forcing core）',
  enPrefix: 'Kraken fish (fish alternatives connected by chains; shares the sound forcing core)',
  search: allBoundedForcing,
});

export const tabling: Strategy = makeP3ForcingStrategy({
  id: 'tabling',
  name: { zh: '列表法', en: "Tabling / Trebor's Tables" },
  difficulty: 9300,
  zhPrefix: '列表法（记录候选蕴含表后的共同结论）',
  enPrefix: 'Tabling (common conclusion from implication tables)',
  search: allBoundedForcing,
});

export const pom: Strategy = makeP3ForcingStrategy({
  id: 'pom',
  name: { zh: '模式叠加法', en: 'Pattern Overlay Method' },
  difficulty: 9400,
  zhPrefix: '模式叠加法（仅 last-resort；以受限蕴含共同结论建模）',
  enPrefix: 'Pattern Overlay Method (last-resort only, modeled as bounded common implication)',
  search: allBoundedForcing,
});

export const templates: Strategy = makeP3ForcingStrategy({
  id: 'templates',
  name: { zh: '模板法', en: "Templates / Bowman's Bingo" },
  difficulty: 9500,
  zhPrefix: '模板法（仅 last-resort；以受限候选模板共同结论建模）',
  enPrefix: "Templates / Bowman's Bingo (last-resort only, bounded common implication)",
  search: allBoundedForcing,
});

export const gem: Strategy = makeP3ForcingStrategy({
  id: 'gem',
  name: { zh: 'GEM 标记法', en: 'GEM / Braid Analysis' },
  difficulty: 9600,
  zhPrefix: 'GEM / Braid Analysis（等价标记传播后的共同结论）',
  enPrefix: 'GEM / Braid Analysis (common conclusion after equivalence propagation)',
  search: allBoundedForcing,
});
