import { SIZE, HOUSES, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '隐性数对', en: 'Hidden Pair' },
  3: { zh: '隐性三数组', en: 'Hidden Triple' },
  4: { zh: '隐性四数组', en: 'Hidden Quad' },
};

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length < 3) continue;

      const cellList = emptyCells;
      const digitToCells: Map<number, number[]> = new Map();
      for (let d = 1; d <= SIZE; d++) {
        const cells: number[] = [];
        for (const c of cellList) {
          if (grid.candidatesOf(c) & maskOf(d)) cells.push(c);
        }
        if (cells.length > 0 && cells.length <= cellList.length) digitToCells.set(d, cells);
      }

      const digitArr = [...digitToCells.keys()].sort((a, b) => a - b);
      for (let size = 2; size <= 4 && size <= digitArr.length; size++) {
        const combos = combinations(digitArr, size);
        for (const combo of combos) {
          const cellSet = new Set<number>();
          for (const d of combo) {
            for (const c of digitToCells.get(d)!) cellSet.add(c);
          }
          if (cellSet.size !== size) continue;

          const subsetCells = [...cellSet];
          const elims: { cell: number; digit: number }[] = [];
          for (const c of subsetCells) {
            const mask = grid.candidatesOf(c);
            const outsideMask = combo.reduce((m, d) => m & ~maskOf(d), mask);
            for (const d of digitsOf(outsideMask)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;

          const names = SUBSET_NAMES[size]!;
          const cellsStr = subsetCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
          const digitsStr = combo.join(', ');
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: { cells: subsetCells, candidates: subsetCells.flatMap((c) => combo.map((d) => ({ cell: c, digit: d }))), links: [] },
            explanation: {
              zh: `数字 {${digitsStr}} 在该单元中只出现在 ${cellsStr} 这 ${size} 个格子（${names.zh}），因此从这些格子排除其他候选数。`,
              en: `Digits {${digitsStr}} appear only in ${cellsStr} (${names.en}), eliminate other candidates from these cells.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const first = arr[0]!;
  for (const rest of combinations(arr.slice(1), k - 1)) {
    result.push([first, ...rest]);
  }
  result.push(...combinations(arr.slice(1), k));
  return result;
}