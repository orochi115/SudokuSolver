/**
 * Naked Subsets (T2) — pair, triple, quad.
 *
 * If N cells in a house contain only N distinct candidate digits in total,
 * those N digits can be eliminated from all other cells in the house.
 *
 * Sizes: 2 (pair), 3 (triple), 4 (quad).
 */

import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SIZE_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '显性数对', en: 'Naked Pair' },
  3: { zh: '显性三数组', en: 'Naked Triple' },
  4: { zh: '显性四数组', en: 'Naked Quad' },
};

/**
 * Try to find a naked subset of size `n` in the grid.
 * Returns the first applicable Step, or null.
 */
function tryNakedSubset(grid: Grid, n: number): Step | null {
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;

    // Collect unsolved cells with ≤ n candidates
    const emptyCells = house.filter((c) => grid.get(c) === 0 && popcount(grid.candidatesOf(c)) <= n && popcount(grid.candidatesOf(c)) >= 1);

    if (emptyCells.length < n) continue;

    // Try all combinations of n cells from emptyCells
    const combos = combinations(emptyCells, n);
    for (const combo of combos) {
      // Union of candidates across all n cells
      let unionMask = 0;
      for (const c of combo) unionMask |= grid.candidatesOf(c);

      if (popcount(unionMask) !== n) continue;

      // Found a naked subset! Eliminate these digits from other cells in house.
      const eliminations: { cell: number; digit: number }[] = [];
      for (const c of house) {
        if (combo.includes(c)) continue;
        if (grid.get(c) !== 0) continue;
        const overlap = grid.candidatesOf(c) & unionMask;
        if (overlap === 0) continue;
        for (const d of digitsOf(overlap)) {
          eliminations.push({ cell: c, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const digits = digitsOf(unionMask);
      const name = SIZE_NAMES[n]!;
      const houseDesc = h < 9 ? `行${h + 1}` : h < 18 ? `列${h - 8}` : `宫${h - 17}`;
      const houseDescEn = h < 9 ? `Row ${h + 1}` : h < 18 ? `Column ${h - 8}` : `Box ${h - 17}`;
      const cellStr = combo.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
      const digitStr = digits.join('、');
      const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}#${e.digit}`).join('、');

      return {
        strategyId: `naked-${n === 2 ? 'pair' : n === 3 ? 'triple' : 'quad'}`,
        placements: [],
        eliminations,
        highlights: {
          cells: combo,
          candidates: combo.flatMap((c) => digitsOf(grid.candidatesOf(c) & unionMask).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `在${houseDesc}中，${cellStr} 只含候选数 {${digitStr}}，构成${name.zh}。从同一${houseDesc}其他格删除候选数 ${digitStr}。消除：${elimStr}。`,
          en: `In ${houseDescEn}, cells ${cellStr} collectively contain only {${digitStr}}, forming a ${name.en}. Remove ${digitStr} from other cells in the same ${houseDescEn}. Eliminations: ${elimStr}.`,
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

export const nakedPair: Strategy = {
  id: 'naked-pair',
  name: { zh: '显性数对', en: 'Naked Pair' },
  difficulty: 30,
  apply: (grid) => tryNakedSubset(grid, 2),
};

export const nakedTriple: Strategy = {
  id: 'naked-triple',
  name: { zh: '显性三数组', en: 'Naked Triple' },
  difficulty: 30,
  apply: (grid) => tryNakedSubset(grid, 3),
};

export const nakedQuad: Strategy = {
  id: 'naked-quad',
  name: { zh: '显性四数组', en: 'Naked Quad' },
  difficulty: 30,
  apply: (grid) => tryNakedSubset(grid, 4),
};
