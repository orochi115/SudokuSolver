import { CELLS, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, cellLabel, makeForcingStep, countEmpty, findBivalueCells } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_BIVALUE = 3;

function tryGEM(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  const cells = findBivalueCells(grid, MAX_BIVALUE);
  for (const cell of cells) {
    const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
    const b1 = propagateFast(grid, cell, d1, MAX_STEPS);
    const b2 = propagateFast(grid, cell, d2, MAX_STEPS);

    if (b1.contradiction && !b2.contradiction && grid.hasCandidate(cell, d2)) {
      return makeForcingStep('gem', grid, [cell], [{ cell, digit: d2 }], [],
        `GEM: ${cellLabel(cell)} 仅 ${d2} 不矛盾。`, `GEM: only ${d2} in ${cellLabel(cell)} non-contradictory.`);
    }
    if (b2.contradiction && !b1.contradiction && grid.hasCandidate(cell, d1)) {
      return makeForcingStep('gem', grid, [cell], [{ cell, digit: d1 }], [],
        `GEM: ${cellLabel(cell)} 仅 ${d1} 不矛盾。`, `GEM: only ${d1} in ${cellLabel(cell)} non-contradictory.`);
    }

    if (b1.contradiction && grid.hasCandidate(cell, d1)) {
      return makeForcingStep('gem', grid, [cell], [], [{ cell, digit: d1 }],
        `GEM: ${cellLabel(cell)}=${d1} 矛盾。`, `GEM: ${cellLabel(cell)}=${d1} contradicts.`);
    }
    if (b2.contradiction && grid.hasCandidate(cell, d2)) {
      return makeForcingStep('gem', grid, [cell], [], [{ cell, digit: d2 }],
        `GEM: ${cellLabel(cell)}=${d2} 矛盾。`, `GEM: ${cellLabel(cell)}=${d2} contradicts.`);
    }
  }
  return null;
}

export const gem: Strategy = {
  id: 'gem',
  name: { zh: '分组排除法', en: 'Grouped Exclusion Method' },
  difficulty: 9110,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null { return tryGEM(grid); },
};
