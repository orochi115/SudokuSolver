/**
 * Naked Subset (T2) — Naked Pair / Triple / Quad.
 *
 * If N cells in a house contain only N candidate digits,
 * eliminate those N digits from all other cells in the house.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 25,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((cell) => grid.get(cell) === 0);
      const n = emptyCells.length;
      if (n < 2) continue;

      // Try sizes 2, 3, 4
      for (let size = 2; size <= 4 && size <= n; size++) {
        // Generate all combinations of `size` cells from emptyCells
        const combos = combinations(emptyCells, size);
        for (const combo of combos) {
          let union = 0;
          for (const cell of combo) {
            union |= grid.candidatesOf(cell);
          }
          if (popcount(union) !== size) continue;

          // Found a naked subset
          const elimDigits = digitsOf(union);
          const eliminations: CellDigit[] = [];
          for (const cell of house) {
            if (grid.get(cell) !== 0) continue;
            if (combo.includes(cell)) continue;
            for (const d of elimDigits) {
              if (grid.hasCandidate(cell, d)) {
                eliminations.push({ cell, digit: d });
              }
            }
          }
          if (eliminations.length > 0) {
            return makeStep(combo, eliminations, size);
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

function makeStep(cells: number[], eliminations: CellDigit[], size: number): Step {
  const names: Record<number, string> = { 2: 'Pair', 3: 'Triple', 4: 'Quad' };
  const namesZh: Record<number, string> = { 2: '数对', 3: '三数组', 4: '四数组' };
  const r = cells.map((c) => ROW_OF[c]! + 1);
  const c = cells.map((c) => COL_OF[c]! + 1);
  const cellsDesc = cells.map((cell, i) => `R${r[i]}C${c[i]}`).join(', ');
  return {
    strategyId: 'naked-subset',
    placements: [],
    eliminations,
    highlights: { cells, candidates: eliminations, links: [] },
    explanation: {
      zh: `${cellsDesc} 构成显性${namesZh[size]}，可排除 ${eliminations.length} 处候选。`,
      en: `${cellsDesc} form a Naked ${names[size]}, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
