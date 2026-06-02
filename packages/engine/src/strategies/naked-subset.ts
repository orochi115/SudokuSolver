/**
 * T2: Naked Subset (Pair / Triple / Quad).
 *
 * N cells in a house contain exactly N distinct candidate digits in total.
 * Those digits cannot appear elsewhere in the house, so eliminate them.
 *
 * Handles sizes 2, 3, and 4 (pairs, triples, quads).
 */

import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
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

      const n = emptyCells.length;
      for (let size = 2; size <= Math.min(4, n); size++) {
        const subsets = getSubsets(emptyCells, size);
        for (const subset of subsets) {
          const combinedMask = subset.reduce((m, c) => m | grid.candidatesOf(c), 0);
          if (popcount(combinedMask) !== size) continue;

          const subsetSet = new Set(subset);
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells: number[] = [];
          const highlightDigits: number[] = [];

          for (const c of subset) {
            highlightCells.push(c);
            for (const d of digitsOf(grid.candidatesOf(c))) {
              if (!highlightDigits.includes(d)) highlightDigits.push(d);
            }
          }

          for (const c of house) {
            if (!subsetSet.has(c) && grid.get(c) === 0) {
              for (const d of digitsOf(combinedMask)) {
                if (grid.hasCandidate(c, d)) {
                  elims.push({ cell: c, digit: d });
                }
              }
            }
          }

          if (elims.length > 0) {
            const kind = size === 2 ? '数对' : size === 3 ? '三数组' : '四数组';
            const enKind = size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad';
            const digits = highlightDigits.join(',');
            const cells = subset.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
            return {
              strategyId: 'naked-subset',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: highlightCells,
                candidates: highlightCells.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
                ),
                links: [],
              },
              explanation: {
                zh: `格 ${cells} 只包含候选数 ${digits}，构成显性${kind}，从同单元其他格中消去这些候选数（显性${kind}）。`,
                en: `Cells ${cells} contain exactly the candidates ${digits}, forming a Naked ${enKind}. These digits are eliminated from other cells in the house (Naked ${enKind}).`,
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
