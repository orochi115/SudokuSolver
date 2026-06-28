import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { propagateFast, cellLabel, makeForcingStep, countEmpty } from './forcing-engine.js';

const MAX_STEPS = 3;
const MAX_EMPTY = 25;
const MAX_CANDIDATES = 12;

function tryTemplates(grid: Grid): Step | null {
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

    const eliminations: { cell: number; digit: number }[] = [];
    for (const cell of candidates) {
      const result = propagateFast(grid, cell, digit, MAX_STEPS);
      if (result.contradiction) {
        eliminations.push({ cell, digit });
      }
    }

    const valid = eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
    if (valid.length > 0) {
      return makeForcingStep('templates', grid, valid.map((e) => e.cell), [], valid,
        `模板法：${valid.map((e) => `${cellLabel(e.cell)}`).join(', ')} 不兼容。`, `Templates: ${valid.map((e) => `${cellLabel(e.cell)}`).join(', ')} incompatible.`);
    }

    const surviving = candidates.filter((cell) => {
      const result = propagateFast(grid, cell, digit, MAX_STEPS);
      return !result.contradiction;
    });

    for (const house of HOUSES) {
      const houseSurvivors = surviving.filter((cell) => house.includes(cell));
      if (houseSurvivors.length === 1 && grid.hasCandidate(houseSurvivors[0]!, digit)) {
        return makeForcingStep('templates', grid, [houseSurvivors[0]!], [{ cell: houseSurvivors[0]!, digit }], [],
          `模板法：数字 ${digit} 仅 ${cellLabel(houseSurvivors[0]!)} 兼容。`, `Templates: only ${cellLabel(houseSurvivors[0]!)} compatible for ${digit}.`);
      }
    }
  }
  return null;
}

export const templates: Strategy = {
  id: 'templates',
  name: { zh: '模板法', en: 'Templates' },
  difficulty: 9100,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null { return tryTemplates(grid); },
};
