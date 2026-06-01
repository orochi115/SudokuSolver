/**
 * Hidden Subset (T2) — Hidden Pair / Triple / Quad.
 *
 * If N digits in a house appear only in N cells,
 * eliminate all other candidates from those N cells.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      // Build a map: digit -> cells in house that can contain it
      const digitCells: number[][] = Array.from({ length: 10 }, () => []);
      for (const cell of house) {
        if (grid.get(cell) !== 0) continue;
        for (let d = 1; d <= 9; d++) {
          if (grid.hasCandidate(cell, d)) digitCells[d]!.push(cell);
        }
      }

      // Try sizes 2, 3, 4
      for (let size = 2; size <= 4; size++) {
        // Find digits that appear in at most `size` cells
        const eligibleDigits: number[] = [];
        for (let d = 1; d <= 9; d++) {
          if (digitCells[d]!.length > 0 && digitCells[d]!.length <= size) {
            eligibleDigits.push(d);
          }
        }
        if (eligibleDigits.length < size) continue;

        const combos = combinations(eligibleDigits, size);
        for (const combo of combos) {
          const union = new Set<number>();
          for (const d of combo) {
            for (const cell of digitCells[d]!) union.add(cell);
          }
          if (union.size !== size) continue;

          const targetCells = [...union];
          const eliminations: CellDigit[] = [];
          for (const cell of targetCells) {
            const mask = grid.candidatesOf(cell);
            for (const d of digitsOf(mask)) {
              if (!combo.includes(d)) {
                eliminations.push({ cell, digit: d });
              }
            }
          }
          if (eliminations.length > 0) {
            return makeStep(targetCells, eliminations, size, combo);
          }
        }
      }
    }
    return null;
  },
};

function combinations<T>(arr: readonly T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function makeStep(cells: number[], eliminations: CellDigit[], size: number, digits: number[]): Step {
  const names: Record<number, string> = { 2: 'Pair', 3: 'Triple', 4: 'Quad' };
  const namesZh: Record<number, string> = { 2: '数对', 3: '三数组', 4: '四数组' };
  const r = cells.map((c) => ROW_OF[c]! + 1);
  const c = cells.map((c) => COL_OF[c]! + 1);
  const cellsDesc = cells.map((cell, i) => `R${r[i]}C${c[i]}`).join(', ');
  const digitsDesc = digits.join(', ');
  return {
    strategyId: 'hidden-subset',
    placements: [],
    eliminations,
    highlights: { cells, candidates: eliminations, links: [] },
    explanation: {
      zh: `${cellsDesc} 中数字 ${digitsDesc} 构成隐性${namesZh[size]}，可清除 ${eliminations.length} 处多余候选。`,
      en: `${cellsDesc} form a Hidden ${names[size]} with digits ${digitsDesc}, eliminating ${eliminations.length} extra candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
