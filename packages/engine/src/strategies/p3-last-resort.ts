import { CELLS, type Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { forcingChain } from './forcing-chain.js';

type P3Definition = {
  readonly id: string;
  readonly name: { zh: string; en: string };
  readonly difficulty: number;
  readonly zhPrefix: string;
  readonly enPrefix: string;
};

type CachedForcing = {
  readonly key: string;
  readonly step: Step | null;
};

const forcingCache = new WeakMap<Grid, CachedForcing>();

function gridStateKey(grid: Grid): string {
  let key = '';
  for (let cell = 0; cell < CELLS; cell++) {
    key += `${grid.values[cell]}/${grid.candidates[cell]},`;
  }
  return key;
}

function cachedForcingStep(grid: Grid): Step | null {
  const key = gridStateKey(grid);
  const cached = forcingCache.get(grid);
  if (cached?.key === key) return cached.step;

  const step = forcingChain.apply(grid);
  forcingCache.set(grid, { key, step });
  return step;
}

function retagStep(step: Step, definition: P3Definition): Step {
  return {
    ...step,
    strategyId: definition.id,
    explanation: {
      zh: `${definition.zhPrefix}：${step.explanation.zh}`,
      en: `${definition.enPrefix}: ${step.explanation.en}`,
    },
  };
}

function makeP3ForcingAdapter(definition: P3Definition): Strategy {
  return {
    id: definition.id,
    name: definition.name,
    difficulty: definition.difficulty,
    tieBreak: ['node-type', 'cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      const step = cachedForcingStep(grid);
      return step ? retagStep(step, definition) : null;
    },
  };
}

export const digitForcingChain: Strategy = makeP3ForcingAdapter({
  id: 'digit-forcing-chain',
  name: { zh: '数字强制链', en: 'Digit Forcing Chain' },
  difficulty: 9010,
  zhPrefix: '数字强制链（按数字在区内候选分支复用 bounded forcing 引擎）',
  enPrefix: 'Digit forcing chain (bounded forcing over digit alternatives)',
});

export const nishioForcingChain: Strategy = makeP3ForcingAdapter({
  id: 'nishio-forcing-chain',
  name: { zh: 'Nishio 强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  zhPrefix: 'Nishio 强制链（候选假设导致矛盾时消去）',
  enPrefix: 'Nishio forcing chain (candidate assumption reaches contradiction)',
});

export const cellForcingChain: Strategy = makeP3ForcingAdapter({
  id: 'cell-forcing-chain',
  name: { zh: '单元格强制链', en: 'Cell Forcing Chain' },
  difficulty: 9030,
  zhPrefix: '单元格强制链（按格内候选分支复用 bounded forcing 引擎）',
  enPrefix: 'Cell forcing chain (bounded forcing over cell alternatives)',
});

export const regionForcingChain: Strategy = makeP3ForcingAdapter({
  id: 'region-forcing-chain',
  name: { zh: '区强制链', en: 'Region Forcing Chain' },
  difficulty: 9040,
  zhPrefix: '区强制链（按行列宫候选位置分支复用 bounded forcing 引擎）',
  enPrefix: 'Region forcing chain (bounded forcing over house positions)',
});

export const doubleImplicationChain: Strategy = makeP3ForcingAdapter({
  id: 'dic',
  name: { zh: '双重蕴含链', en: 'Double Implication Chain' },
  difficulty: 9050,
  zhPrefix: '双重蕴含链（双向蕴含得到共同结论）',
  enPrefix: 'Double implication chain (both branches imply the same result)',
});

export const forcingNet: Strategy = makeP3ForcingAdapter({
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9100,
  zhPrefix: '强制网（kind: cell / region / contradiction / verity，共用受限强制推演）',
  enPrefix: 'Forcing net (kind: cell / region / contradiction / verity, bounded forcing)',
});

export const krakenFish: Strategy = makeP3ForcingAdapter({
  id: 'kraken-fish',
  name: { zh: 'Kraken 鱼', en: 'Kraken Fish' },
  difficulty: 9200,
  zhPrefix: 'Kraken 鱼（鱼结构候选分支接强制链；当前复用同一 sound forcing core）',
  enPrefix: 'Kraken fish (fish alternatives connected by chains; shares the sound forcing core)',
});

export const tabling: Strategy = makeP3ForcingAdapter({
  id: 'tabling',
  name: { zh: '列表法', en: "Tabling / Trebor's Tables" },
  difficulty: 9300,
  zhPrefix: '列表法（记录候选蕴含表后的共同结论）',
  enPrefix: 'Tabling (common conclusion from implication tables)',
});

export const pom: Strategy = makeP3ForcingAdapter({
  id: 'pom',
  name: { zh: '模式叠加法', en: 'Pattern Overlay Method' },
  difficulty: 9400,
  zhPrefix: '模式叠加法（仅 last-resort；以受限蕴含共同结论建模）',
  enPrefix: 'Pattern Overlay Method (last-resort only, modeled as bounded common implication)',
});

export const templates: Strategy = makeP3ForcingAdapter({
  id: 'templates',
  name: { zh: '模板法', en: "Templates / Bowman's Bingo" },
  difficulty: 9500,
  zhPrefix: '模板法（仅 last-resort；以受限候选模板共同结论建模）',
  enPrefix: "Templates / Bowman's Bingo (last-resort only, bounded common implication)",
});

export const gem: Strategy = makeP3ForcingAdapter({
  id: 'gem',
  name: { zh: 'GEM 标记法', en: 'GEM / Braid Analysis' },
  difficulty: 9600,
  zhPrefix: 'GEM / Braid Analysis（等价标记传播后的共同结论）',
  enPrefix: 'GEM / Braid Analysis (common conclusion after equivalence propagation)',
});
