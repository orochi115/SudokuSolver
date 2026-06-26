/**
 * P3 red-line strategies: forcing-family presentations and bounded enumeration.
 * These strategies are registered only in the last-resort profile.
 */

import { CELLS, PEERS_OF, ROW_OF, COL_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { forcingChain } from './forcing-chain.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function toString(values: Uint8Array): string {
  let out = '';
  for (let i = 0; i < CELLS; i++) out += String(values[i]);
  return out;
}

function isConsistent(values: Uint8Array): boolean {
  for (let cell = 0; cell < CELLS; cell++) {
    const digit = values[cell]!;
    if (digit === 0) continue;
    for (const peer of PEERS_OF[cell]!) {
      if (peer > cell && values[peer] === digit) return false;
    }
  }
  return true;
}

function pickMRV(values: Uint8Array, candidates: Uint16Array): number {
  let best = -1;
  let bestCount = 10;
  for (let cell = 0; cell < CELLS; cell++) {
    if (values[cell] !== 0) continue;
    const count = popcount(candidates[cell]!);
    if (count < bestCount) {
      best = cell;
      bestCount = count;
      if (count <= 1) break;
    }
  }
  return best;
}

function propagate(values: Uint8Array, candidates: Uint16Array, cell: number, digit: number): boolean {
  const bit = maskOf(digit);
  for (const peer of PEERS_OF[cell]!) {
    if (values[peer] !== 0) {
      if (values[peer] === digit) return false;
      continue;
    }
    if ((candidates[peer]! & bit) === 0) continue;
    candidates[peer]! &= ~bit;
    if (candidates[peer] === 0) return false;
  }
  return true;
}

function collectSolutions(
  values: Uint8Array,
  candidates: Uint16Array,
  solutions: string[],
  limit: number,
): void {
  if (solutions.length >= limit) return;
  const cell = pickMRV(values, candidates);
  if (cell === -1) {
    solutions.push(toString(values));
    return;
  }

  let mask = candidates[cell]!;
  while (mask && solutions.length < limit) {
    const bit = mask & -mask;
    mask &= mask - 1;
    const digit = Math.log2(bit) + 1;
    const savedCandidates = candidates.slice();
    values[cell] = digit;
    candidates[cell] = 0;
    if (propagate(values, candidates, cell, digit)) collectSolutions(values, candidates, solutions, limit);
    values[cell] = 0;
    candidates.set(savedCandidates);
  }
}

function uniqueCompletion(grid: Grid): string | null {
  if (!grid.isValid() || !isConsistent(grid.values)) return null;
  const values = grid.values.slice();
  const candidates = grid.candidates.slice();
  for (let cell = 0; cell < CELLS; cell++) {
    if (values[cell] === 0 && candidates[cell] === 0) return null;
  }

  const solutions: string[] = [];
  collectSolutions(values, candidates, solutions, 2);
  return solutions.length === 1 ? solutions[0]! : null;
}

function makeEnumerationStep(
  strategyId: string,
  grid: Grid,
  solution: string,
  names: { zh: string; en: string },
  kind: { zh: string; en: string },
): Step | null {
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const digit = Number(solution[cell]);
    if (!grid.hasCandidate(cell, digit)) return null;
    const eliminated = digitsOf(grid.candidatesOf(cell)).filter((d) => d !== digit).map((d) => ({ cell, digit: d }));
    return {
      strategyId,
      placements: [{ cell, digit }],
      eliminations: [],
      highlights: {
        cells: [cell],
        candidates: [{ cell, digit }, ...eliminated],
        links: [],
      },
      explanation: {
        zh: `${names.zh}：${kind.zh}枚举当前候选约束只有一个完成式，因此 ${cellLabel(cell)} 必为 ${digit}。`,
        en: `${names.en}: ${kind.en} enumeration leaves exactly one completion under the current candidates, so ${cellLabel(cell)} must be ${digit}.`,
      },
    };
  }
  return null;
}

function rewriteForcingStep(step: Step, strategy: { id: string; name: { zh: string; en: string } }): Step {
  return {
    ...step,
    strategyId: strategy.id,
    explanation: {
      zh: `${strategy.name.zh}：${step.explanation.zh}`,
      en: `${strategy.name.en}: ${step.explanation.en}`,
    },
  };
}

function makeForcingPresentation(id: string, name: { zh: string; en: string }, difficulty: number): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak: ['cell-index', 'digit'],
    apply(grid: Grid): Step | null {
      const step = forcingChain.apply(grid);
      return step ? rewriteForcingStep(step, this) : null;
    },
  };
}

function makeEnumeratingStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  kind: { zh: string; en: string },
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak: ['cell-index', 'digit'],
    apply(grid: Grid): Step | null {
      const solution = uniqueCompletion(grid);
      return solution ? makeEnumerationStep(this.id, grid, solution, this.name, kind) : null;
    },
  };
}

export const digitForcingChain = makeForcingPresentation('digit-forcing-chain', { zh: '数字强制链', en: 'Digit Forcing Chain' }, 9010);
export const nishioForcingChain = makeForcingPresentation('nishio-forcing-chain', { zh: 'Nishio 强制链', en: 'Nishio Forcing Chain' }, 9020);
export const cellForcingChain = makeForcingPresentation('cell-forcing-chain', { zh: '格强制链', en: 'Cell Forcing Chain' }, 9030);
export const regionForcingChain = makeForcingPresentation('region-forcing-chain', { zh: '区域强制链', en: 'Region Forcing Chain' }, 9040);
export const dic = makeForcingPresentation('dic', { zh: '双向蕴含链', en: 'Double Implication Chain' }, 9050);

export const forcingNet = makeEnumeratingStrategy('forcing-net', { zh: '强制网', en: 'Forcing Net' }, 9100, {
  zh: '按 cell / region / contradiction / verity 多分支',
  en: 'cell / region / contradiction / verity multi-branch',
});
export const krakenFish = makeEnumeratingStrategy('kraken-fish', { zh: 'Kraken 鱼', en: 'Kraken Fish' }, 9200, {
  zh: '鱼形分支结合链式验证',
  en: 'fish-branch plus chain',
});
export const tabling = makeEnumeratingStrategy('tabling', { zh: '列表法', en: 'Tabling' }, 9300, {
  zh: 'Trebor 表格',
  en: "Trebor's Tables",
});
export const pom = makeEnumeratingStrategy('pom', { zh: '模式覆盖法', en: 'Pattern Overlay Method' }, 9400, {
  zh: '全数字模板叠加',
  en: 'pattern-overlay',
});
export const templates = makeEnumeratingStrategy('templates', { zh: '模板法', en: 'Templates' }, 9500, {
  zh: "Bowman's Bingo 模板",
  en: "Bowman's Bingo template",
});
export const gem = makeEnumeratingStrategy('gem', { zh: 'GEM 标记', en: 'GEM' }, 9600, {
  zh: '分级等价标记 / braid 分析',
  en: 'graded equivalence marks / braid analysis',
});
