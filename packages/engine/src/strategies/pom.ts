import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, cellLabel, makeForcingStep, countEmpty } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_CANDIDATES = 12;

function tryPOM(grid: Grid): Step | null {
  if (countEmpty(grid) > MAX_EMPTY) return null;
  for (let digit = 1; digit <= 9; digit++) {
    const bit = maskOf(digit);
    const candidates: number[] = [];
    for (let cell = 0; cell < CELLS && candidates.length < MAX_CANDIDATES; cell++) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        candidates.push(cell);
      }
    }
    if (candidates.length > MAX_CANDIDATES) continue;

    for (const cell of candidates) {
      const result = propagateFast(grid, cell, digit, MAX_STEPS);
      if (result.contradiction && grid.hasCandidate(cell, digit)) {
        return makeForcingStep('pom', grid, [cell], [], [{ cell, digit }],
          `POM: ${cellLabel(cell)}=${digit} 不兼容。`, `POM: ${cellLabel(cell)}=${digit} incompatible.`);
      }
    }

    const surviving = candidates.filter((cell) => {
      const result = propagateFast(grid, cell, digit, MAX_STEPS);
      return !result.contradiction;
    });

    if (surviving.length === 1 && grid.hasCandidate(surviving[0]!, digit)) {
      return makeForcingStep('pom', grid, [surviving[0]!], [{ cell: surviving[0]!, digit }], [],
        `POM: 数字 ${digit} 仅 ${cellLabel(surviving[0]!)} 兼容。`, `POM: only ${cellLabel(surviving[0]!)} compatible for ${digit}.`);
    }
  }
  return null;
}

export const pom: Strategy = {
  id: 'pom',
  name: { zh: '模式覆盖法', en: 'Pattern Overlay Method' },
  difficulty: 9090,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null { return tryPOM(grid); },
};
