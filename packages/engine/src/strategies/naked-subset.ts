/**
 * T2: naked subset — pair, triple, quad.
 *
 * In a house, if N cells contain only N distinct candidate digits, those
 * digits cannot appear elsewhere in the house (naked pair/triple/quad).
 */

import { HOUSES, popcount, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length < 2) continue;

      // Find combinations of 2, 3, or 4 cells
      for (let size = 2; size <= 4 && size <= emptyCells.length; size++) {
        const cells = emptyCells;
        const n = cells.length;

        // Use index combinations
        const combos = getCombinations(n, size);
        for (const combo of combos) {
          const comboCells = combo.map((i) => cells[i]!);
          const unionMask = comboCells.reduce((m, c) => m | grid.candidatesOf(c), 0);

          if (popcount(unionMask) !== size) continue;

          const subsetDigits = digitsOf(unionMask);
          const elimDigits = new Set(subsetDigits);

          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of house) {
            if (comboCells.includes(cell)) continue;
            for (const d of subsetDigits) {
              if (grid.hasCandidate(cell, d)) {
                eliminations.push({ cell, digit: d });
              }
            }
          }

          if (eliminations.length > 0) {
            const sizeName = ['数对', '三数组', '四数组'][size - 2];
            const cellLocs = comboCells.map((c) => {
              const r = Math.floor(c / 9) + 1;
              const cc = (c % 9) + 1;
              return `R${r}C${cc}`;
            }).join('、');
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: comboCells,
                candidates: comboCells.flatMap((c) => subsetDigits.map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `${cellLocs} 仅包含候选数 ${subsetDigits.join('/')}，从同单元其他格消去这些数（显性${sizeName}）。`,
                en: `${cellLocs} only have candidates ${subsetDigits.join('/')}; remove these from other cells in the house (Naked ${size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad'}).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function getCombinations(n: number, k: number): number[][] {
  const result: number[][] = [];
  const comb: number[] = [];
  function backtrack(start: number, depth: number) {
    if (depth === k) {
      result.push([...comb]);
      return;
    }
    for (let i = start; i < n; i++) {
      comb.push(i);
      backtrack(i + 1, depth + 1);
      comb.pop();
    }
  }
  backtrack(0, 0);
  return result;
}