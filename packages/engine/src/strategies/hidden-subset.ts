/**
 * T2: hidden subset — pair, triple, quad.
 *
 * In a house, N cells contain only N distinct candidate digits, and each of
 * those N digits does not appear in any other cell of the house.
 * (Hidden pair/triple/quad: the digits are "hidden" because other candidates
 * mask them.)
 */

import { HOUSES, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length < 2) continue;

      for (let size = 2; size <= 4 && size <= emptyCells.length; size++) {
        const combos = getCombinations(emptyCells.length, size);
        for (const combo of combos) {
          const cells = combo.map((i) => emptyCells[i]!);
          const unionMask = cells.reduce((m, c) => m | grid.candidatesOf(c), 0);

          if (popcount(unionMask) !== size) continue;

          const subsetDigits = digitsOf(unionMask);

          // Check 1: non-subset digits cannot be in these cells
          let hasNonSubsetInCells = false;
          for (const cell of cells) {
            const cellMask = grid.candidatesOf(cell);
            if ((cellMask & ~unionMask) !== 0) {
              hasNonSubsetInCells = true;
              break;
            }
          }
          if (hasNonSubsetInCells) continue;

          // Check 2: each subset digit must be restricted to these cells
          // (no other cell in the house has this digit as a candidate)
          let allDigitsRestricted = true;
          for (const d of subsetDigits) {
            const bit = maskOf(d);
            let appearsOutside = false;
            for (const cell of house) {
              if (!cells.includes(cell) && (grid.candidatesOf(cell) & bit) !== 0) {
                appearsOutside = true;
                break;
              }
            }
            if (appearsOutside) {
              allDigitsRestricted = false;
              break;
            }
          }
          if (!allDigitsRestricted) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of cells) {
            const cellMask = grid.candidatesOf(cell);
            for (let d = 1; d <= 9; d++) {
              if (!subsetDigits.includes(d) && (cellMask & maskOf(d)) !== 0) {
                eliminations.push({ cell, digit: d });
              }
            }
          }

          if (eliminations.length > 0) {
            const sizeName = ['数对', '三数组', '四数组'][size - 2];
            const cellLocs = cells.map((c) => {
              const r = Math.floor(c / 9) + 1;
              const cc = (c % 9) + 1;
              return `R${r}C${cc}`;
            }).join('、');
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells,
                candidates: cells.flatMap((c) => subsetDigits.map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `${cellLocs} 中数字 ${subsetDigits.join('/')} 仅出现在这些格，从这些格消去其他候选数（隐性${sizeName}）。`,
                en: `Digits ${subsetDigits.join('/')} are confined to ${cellLocs}; remove other candidates from these cells (Hidden ${size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad'}).`,
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