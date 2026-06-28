import { CELLS, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, propagateWithPlacements, cellLabel, makeForcingStep, countEmpty, findBivalueCells } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_BIVALUE = 3;

function tryDIC(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  const cells = findBivalueCells(grid, MAX_BIVALUE);
  for (const cell of cells) {
    const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
    const b1 = propagateFast(grid, cell, d1, MAX_STEPS);
    const b2 = propagateFast(grid, cell, d2, MAX_STEPS);

    if (b1.contradiction && grid.hasCandidate(cell, d1)) {
      return makeForcingStep('dic', grid, [cell], [], [{ cell, digit: d1 }],
        `DIC: ${cellLabel(cell)}=${d1} 矛盾。`, `DIC: ${cellLabel(cell)}=${d1} contradicts.`);
    }
    if (b2.contradiction && grid.hasCandidate(cell, d2)) {
      return makeForcingStep('dic', grid, [cell], [], [{ cell, digit: d2 }],
        `DIC: ${cellLabel(cell)}=${d2} 矛盾。`, `DIC: ${cellLabel(cell)}=${d2} contradicts.`);
    }

    if (!b1.contradiction && !b2.contradiction) {
      const r1 = propagateWithPlacements(grid, cell, d1, MAX_STEPS);
      const r2 = propagateWithPlacements(grid, cell, d2, MAX_STEPS);
      for (const [tc, td] of r1.placements) {
        if (tc === cell || grid.get(tc) !== 0 || !grid.hasCandidate(tc, td)) continue;
        if (r2.placements.get(tc) === td) {
          return makeForcingStep('dic', grid, [cell, tc], [{ cell: tc, digit: td }], [],
            `DIC: ${cellLabel(cell)} 两分支均得 ${cellLabel(tc)}=${td}。`, `DIC: both branches imply ${cellLabel(tc)}=${td}.`);
        }
      }
    }
  }
  return null;
}

export const dic: Strategy = {
  id: 'dic',
  name: { zh: '动态蕴含链', en: 'Dynamic Implication Chains' },
  difficulty: 9050,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null { return tryDIC(grid); },
};
