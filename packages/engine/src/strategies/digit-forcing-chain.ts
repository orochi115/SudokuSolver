import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, propagateWithPlacements, cellLabel, makeForcingStep, countEmpty } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;

function tryDigitForcing(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);
      const positions = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
      if (positions.length !== 2) continue;

      const [c1, c2] = positions as [number, number];
      const b1 = propagateFast(grid, c1, digit, MAX_STEPS);
      const b2 = propagateFast(grid, c2, digit, MAX_STEPS);

      if (b1.contradiction && !b2.contradiction && grid.hasCandidate(c2, digit)) {
        return makeForcingStep('digit-forcing-chain', grid, positions, [{ cell: c2, digit }], [],
          `数字 ${digit} 除 ${cellLabel(c2)} 外矛盾。`, `digit ${digit} contradicts except ${cellLabel(c2)}.`);
      }
      if (b2.contradiction && !b1.contradiction && grid.hasCandidate(c1, digit)) {
        return makeForcingStep('digit-forcing-chain', grid, positions, [{ cell: c1, digit }], [],
          `数字 ${digit} 除 ${cellLabel(c1)} 外矛盾。`, `digit ${digit} contradicts except ${cellLabel(c1)}.`);
      }

      if (!b1.contradiction && !b2.contradiction) {
        const r1 = propagateWithPlacements(grid, c1, digit, MAX_STEPS);
        const r2 = propagateWithPlacements(grid, c2, digit, MAX_STEPS);
        for (const [tc, td] of r1.placements) {
          if (positions.includes(tc) || grid.get(tc) !== 0 || !grid.hasCandidate(tc, td)) continue;
          if (r2.placements.get(tc) === td) {
            return makeForcingStep('digit-forcing-chain', grid, [...positions, tc], [{ cell: tc, digit: td }], [],
              `数字 ${digit} 两位置均推导出 ${cellLabel(tc)}=${td}。`, `both positions of ${digit} imply ${cellLabel(tc)}=${td}.`);
          }
        }
      }
    }
  }
  return null;
}

export const digitForcingChain: Strategy = {
  id: 'digit-forcing-chain',
  name: { zh: '数字强制链', en: 'Digit Forcing Chain' },
  difficulty: 9010,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null { return tryDigitForcing(grid); },
};
