import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, propagateWithPlacements, cellLabel, makeForcingStep, countEmpty, findBivalueCells } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_BIVALUE = 3;

function tryForcingNet(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  const cells = findBivalueCells(grid, MAX_BIVALUE);
  for (const cell of cells) {
    const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
    const b1 = propagateFast(grid, cell, d1, MAX_STEPS);
    const b2 = propagateFast(grid, cell, d2, MAX_STEPS);

    if (b1.contradiction && grid.hasCandidate(cell, d1)) {
      return makeForcingStep('forcing-net', grid, [cell], [], [{ cell, digit: d1 }],
        `强制网：${cellLabel(cell)}=${d1} 矛盾。`, `Forcing net: ${cellLabel(cell)}=${d1} contradicts.`);
    }
    if (b2.contradiction && grid.hasCandidate(cell, d2)) {
      return makeForcingStep('forcing-net', grid, [cell], [], [{ cell, digit: d2 }],
        `强制网：${cellLabel(cell)}=${d2} 矛盾。`, `Forcing net: ${cellLabel(cell)}=${d2} contradicts.`);
    }

    if (!b1.contradiction && !b2.contradiction) {
      const r1 = propagateWithPlacements(grid, cell, d1, MAX_STEPS);
      const r2 = propagateWithPlacements(grid, cell, d2, MAX_STEPS);
      for (const [tc, td] of r1.placements) {
        if (tc === cell || grid.get(tc) !== 0 || !grid.hasCandidate(tc, td)) continue;
        if (r2.placements.get(tc) === td) {
          return makeForcingStep('forcing-net', grid, [cell, tc], [{ cell: tc, digit: td }], [],
            `强制网：两分支均得 ${cellLabel(tc)}=${td}。`, `Forcing net: both branches imply ${cellLabel(tc)}=${td}.`);
        }
      }
    }
  }

  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);
      const positions = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
      if (positions.length !== 2) continue;
      const [c1, c2] = positions as [number, number];
      const b1 = propagateFast(grid, c1, digit, MAX_STEPS);
      const b2 = propagateFast(grid, c2, digit, MAX_STEPS);
      if (b1.contradiction && !b2.contradiction && grid.hasCandidate(c2, digit)) {
        return makeForcingStep('forcing-net', grid, positions, [{ cell: c2, digit }], [],
          `强制网：${cellLabel(c1)}=${digit} 矛盾。`, `Forcing net: ${cellLabel(c1)}=${digit} contradicts.`);
      }
      if (b2.contradiction && !b1.contradiction && grid.hasCandidate(c1, digit)) {
        return makeForcingStep('forcing-net', grid, positions, [{ cell: c1, digit }], [],
          `强制网：${cellLabel(c2)}=${digit} 矛盾。`, `Forcing net: ${cellLabel(c2)}=${digit} contradicts.`);
      }
    }
  }
  return null;
}

export const forcingNet: Strategy = {
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9060,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null { return tryForcingNet(grid); },
};
