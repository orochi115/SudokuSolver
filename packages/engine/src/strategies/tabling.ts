import { CELLS, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, propagateWithPlacements, cellLabel, makeForcingStep, countEmpty, findBivalueCells } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_BIVALUE = 3;

function tryTabling(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  const cells = findBivalueCells(grid, MAX_BIVALUE);
  for (const cell of cells) {
    const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
    const b1 = propagateFast(grid, cell, d1, MAX_STEPS);
    const b2 = propagateFast(grid, cell, d2, MAX_STEPS);

    if (b1.contradiction && grid.hasCandidate(cell, d1)) {
      return makeForcingStep('tabling', grid, [cell], [], [{ cell, digit: d1 }],
        `列表法：${cellLabel(cell)}=${d1} 矛盾。`, `Tabling: ${cellLabel(cell)}=${d1} contradicts.`);
    }
    if (b2.contradiction && grid.hasCandidate(cell, d2)) {
      return makeForcingStep('tabling', grid, [cell], [], [{ cell, digit: d2 }],
        `列表法：${cellLabel(cell)}=${d2} 矛盾。`, `Tabling: ${cellLabel(cell)}=${d2} contradicts.`);
    }

    if (!b1.contradiction && !b2.contradiction) {
      const r1 = propagateWithPlacements(grid, cell, d1, MAX_STEPS);
      const r2 = propagateWithPlacements(grid, cell, d2, MAX_STEPS);
      for (const [tc, td] of r1.placements) {
        if (tc === cell || grid.get(tc) !== 0 || !grid.hasCandidate(tc, td)) continue;
        if (r2.placements.get(tc) === td) {
          return makeForcingStep('tabling', grid, [cell, tc], [{ cell: tc, digit: td }], [],
            `列表法：两分支均得 ${cellLabel(tc)}=${td}。`, `Tabling: both branches imply ${cellLabel(tc)}=${td}.`);
        }
      }
    }
  }
  return null;
}

export const tabling: Strategy = {
  id: 'tabling',
  name: { zh: '列表法', en: 'Tabling' },
  difficulty: 9080,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null { return tryTabling(grid); },
};
