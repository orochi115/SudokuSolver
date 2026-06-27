import {
  HOUSES, ROW_OF, COL_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { combinations } from './als.js';

export interface AHS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const emptyCells = house.filter(c => grid.get(c) === 0);
    if (emptyCells.length < 3) continue;

    for (let size = 1; size <= Math.min(3, emptyCells.length - 1); size++) {
      for (const combo of combinations(emptyCells, size)) {
        let mask = 0;
        for (const c of combo) mask |= grid.candidatesOf(c);
        const digitCount = popcount(mask);
        if (digitCount !== size + 1) continue;

        const otherCells = emptyCells.filter(c => !combo.includes(c));
        let confined = true;
        for (const d of digitsOf(mask)) {
          const bit = maskOf(d);
          for (const oc of otherCells) {
            if (grid.candidatesOf(oc) & bit) {
              confined = false;
              break;
            }
          }
          if (!confined) break;
        }
        if (confined) {
          result.push({ house: h, cells: combo, digits: digitsOf(mask), digitMask: mask });
        }
      }
    }
  }
  return result;
}

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐式集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};