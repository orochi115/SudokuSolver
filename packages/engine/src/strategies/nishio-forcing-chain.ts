import { CELLS, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, cellLabel, makeForcingStep, countEmpty, findBivalueCells } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_BIVALUE = 3;

function tryNishio(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  const cells = findBivalueCells(grid, MAX_BIVALUE);
  for (const cell of cells) {
    const candidates = digitsOf(grid.candidatesOf(cell));
    for (const digit of candidates) {
      const result = propagateFast(grid, cell, digit, MAX_STEPS);
      if (result.contradiction && grid.hasCandidate(cell, digit)) {
        return makeForcingStep('nishio-forcing-chain', grid, [cell], [], [{ cell, digit }],
          `假设 ${cellLabel(cell)}=${digit} 矛盾（Nishio）。`, `assuming ${cellLabel(cell)}=${digit} contradicts (Nishio).`);
      }
    }
  }
  return null;
}

export const nishioForcingChain: Strategy = {
  id: 'nishio-forcing-chain',
  name: { zh: '西尾强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null { return tryNishio(grid); },
};
