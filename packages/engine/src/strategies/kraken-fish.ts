import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, cellLabel, makeForcingStep, countEmpty } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;

function tryKrakenFish(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  for (let digit = 1; digit <= 9; digit++) {
    const bit = maskOf(digit);
    for (let r = 0; r < 9; r++) {
      const positions: number[] = [];
      for (let c = 0; c < 9; c++) {
        const cell = r * 9 + c;
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          positions.push(cell);
        }
      }
      if (positions.length < 3 || positions.length > 4) continue;

      for (const finCell of positions) {
        const result = propagateFast(grid, finCell, digit, MAX_STEPS);
        if (result.contradiction && grid.hasCandidate(finCell, digit)) {
          return makeForcingStep('kraken-fish', grid, [finCell], [], [{ cell: finCell, digit }],
            `Kraken Fish：${cellLabel(finCell)}=${digit} 矛盾。`, `Kraken Fish: ${cellLabel(finCell)}=${digit} contradicts.`);
        }
      }
    }
  }
  return null;
}

export const krakenFish: Strategy = {
  id: 'kraken-fish',
  name: { zh: '海妖鱼', en: 'Kraken Fish' },
  difficulty: 9070,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null { return tryKrakenFish(grid); },
};
