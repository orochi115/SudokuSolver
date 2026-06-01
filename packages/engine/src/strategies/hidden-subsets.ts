/**
 * Hidden Subsets (T2) — pair, triple, quad.
 *
 * If N digits in a house appear only in N cells, all other candidates can be
 * eliminated from those N cells (since those N digits must occupy those N cells).
 *
 * Sizes: 2 (pair), 3 (triple), 4 (quad).
 */

import { HOUSES, SIZE, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/**
 * Try to find a hidden subset of size `n` in the grid.
 */
function tryHiddenSubset(grid: Grid, n: number): Step | null {
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;

    // For each digit, collect which cells in this house are candidates
    const digitCells: Map<number, number[]> = new Map();
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      const cells: number[] = [];
      for (const cell of house) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          cells.push(cell);
        }
      }
      // Only include digits that appear 2..n times (singles would be handled by hidden single)
      if (cells.length >= 2 && cells.length <= n) {
        digitCells.set(d, cells);
      }
    }

    if (digitCells.size < n) continue;

    // Try all combinations of n digits
    const digits = [...digitCells.keys()];
    const combos = combinations(digits, n);

    for (const combo of combos) {
      // Union of cells where any of these n digits appear
      const cellSet = new Set<number>();
      for (const d of combo) {
        for (const c of digitCells.get(d)!) {
          cellSet.add(c);
        }
      }

      if (cellSet.size !== n) continue;

      // Found hidden subset! Eliminate non-subset candidates from these n cells.
      const subsetMask = combo.reduce((m, d) => m | maskOf(d), 0);
      const eliminations: { cell: number; digit: number }[] = [];

      for (const cell of cellSet) {
        const extra = grid.candidatesOf(cell) & ~subsetMask;
        if (extra === 0) continue;
        for (const d of digitsOf(extra)) {
          eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const cellArr = [...cellSet];
      // Index by n directly: n=2→Pair, n=3→Triple, n=4→Quad
      const nameParts: Record<number, string> = { 2: '数对', 3: '三数组', 4: '四数组' };
      const namePartsEn: Record<number, string> = { 2: 'Pair', 3: 'Triple', 4: 'Quad' };
      const houseDesc = h < 9 ? `行${h + 1}` : h < 18 ? `列${h - 8}` : `宫${h - 17}`;
      const houseDescEn = h < 9 ? `Row ${h + 1}` : h < 18 ? `Column ${h - 8}` : `Box ${h - 17}`;
      const cellStr = cellArr.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
      const digitStr = combo.join('、');
      const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}#${e.digit}`).join('、');

      return {
        strategyId: `hidden-${n === 2 ? 'pair' : n === 3 ? 'triple' : 'quad'}`,
        placements: [],
        eliminations,
        highlights: {
          cells: cellArr,
          candidates: cellArr.flatMap((c) => digitsOf(grid.candidatesOf(c) & subsetMask).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `在${houseDesc}中，候选数 {${digitStr}} 只出现在 ${cellStr} 共${n}个格中，构成隐性${nameParts[n]}。从这些格删除其他候选数。消除：${elimStr}。`,
          en: `In ${houseDescEn}, digits {${digitStr}} appear only in cells ${cellStr}, forming a Hidden ${namePartsEn[n]}. Remove other candidates from those cells. Eliminations: ${elimStr}.`,
        },
      };
    }
  }
  return null;
}

/** Generate all size-k combinations from an array. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first!, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export const hiddenPair: Strategy = {
  id: 'hidden-pair',
  name: { zh: '隐性数对', en: 'Hidden Pair' },
  difficulty: 30,
  apply: (grid) => tryHiddenSubset(grid, 2),
};

export const hiddenTriple: Strategy = {
  id: 'hidden-triple',
  name: { zh: '隐性三数组', en: 'Hidden Triple' },
  difficulty: 30,
  apply: (grid) => tryHiddenSubset(grid, 3),
};

export const hiddenQuad: Strategy = {
  id: 'hidden-quad',
  name: { zh: '隐性四数组', en: 'Hidden Quad' },
  difficulty: 30,
  apply: (grid) => tryHiddenSubset(grid, 4),
};
