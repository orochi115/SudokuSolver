/**
 * T2: Hidden Subset (Pair / Triple / Quad).
 *
 * N digits in a house appear only in N cells. Those cells cannot hold other
 * digits, so eliminate all other candidates from them.
 *
 * Handles sizes 2, 3, and 4.
 */

import { HOUSES, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
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

      const digitCells: number[][] = Array.from({ length: 10 }, () => []);
      for (const c of emptyCells) {
        for (const d of digitsOf(grid.candidatesOf(c))) {
          digitCells[d]!.push(c);
        }
      }

      for (let size = 2; size <= Math.min(4, emptyCells.length); size++) {
        const subsets = getSubsets(emptyCells, size);
        for (const subset of subsets) {
          const subsetSet = new Set(subset);
          const subsetDigits: number[] = [];
          for (let d = 1; d <= 9; d++) {
            const cells = digitCells[d]!;
            if (cells.length === 0) continue;
            if (cells.length > size) continue;
            if (cells.every((c) => subsetSet.has(c))) {
              subsetDigits.push(d);
            }
          }
          if (subsetDigits.length !== size) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (const c of subset) {
            const mask = grid.candidatesOf(c);
            for (const d of digitsOf(mask)) {
              if (!subsetDigits.includes(d)) {
                elims.push({ cell: c, digit: d });
              }
            }
          }

          if (elims.length > 0) {
            const kind = size === 2 ? '数对' : size === 3 ? '三数组' : '四数组';
            const enKind = size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad';
            const digits = subsetDigits.join(',');
            const cells = subset.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
            return {
              strategyId: 'hidden-subset',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: subset,
                candidates: subset.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
                ),
                links: [],
              },
              explanation: {
                zh: `数字 ${digits} 只出现在格 ${cells} 中，构成隐性${kind}，从这些格中消去其他候选数（隐性${kind}）。`,
                en: `Digits ${digits} appear only in cells ${cells}, forming a Hidden ${enKind}. Other candidates are eliminated from these cells (Hidden ${enKind}).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function getSubsets(arr: number[], size: number): number[][] {
  if (size === 1) return arr.map((x) => [x]);
  if (size === 2) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        result.push([arr[i]!, arr[j]!]);
      }
    }
    return result;
  }
  if (size === 3) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 2; i++) {
      for (let j = i + 1; j < arr.length - 1; j++) {
        for (let k = j + 1; k < arr.length; k++) {
          result.push([arr[i]!, arr[j]!, arr[k]!]);
        }
      }
    }
    return result;
  }
  if (size === 4) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 3; i++) {
      for (let j = i + 1; j < arr.length - 2; j++) {
        for (let k = j + 1; k < arr.length - 1; k++) {
          for (let l = k + 1; l < arr.length; l++) {
            result.push([arr[i]!, arr[j]!, arr[k]!, arr[l]!]);
          }
        }
      }
    }
    return result;
  }
  return [];
}
