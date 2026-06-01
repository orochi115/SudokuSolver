import { SIZE, HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '显性数对', en: 'Naked Pair' },
  3: { zh: '显性三数组', en: 'Naked Triple' },
  4: { zh: '显性四数组', en: 'Naked Quad' },
};

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 25,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length < 3) continue;

      const cellsWithMask: { cell: number; mask: number }[] = emptyCells.map((c) => ({ cell: c, mask: grid.candidatesOf(c) }));

      for (let size = 2; size <= 4 && size < emptyCells.length; size++) {
        const combos = combinations(cellsWithMask, size);
        for (const combo of combos) {
          let unionMask = 0;
          for (const item of combo) unionMask |= item.mask;
          if (popcount(unionMask) !== size) continue;

          const subsetDigits = digitsOf(unionMask);
          const elims: { cell: number; digit: number }[] = [];
          for (const item of cellsWithMask) {
            if (combo.includes(item)) continue;
            for (const d of subsetDigits) {
              if (item.mask & (1 << (d - 1))) {
                elims.push({ cell: item.cell, digit: d });
              }
            }
          }
          if (elims.length === 0) continue;

          const highlightCandidates = combo.flatMap((item) =>
            subsetDigits.map((d) => ({ cell: item.cell, digit: d }))
          );
          const names = SUBSET_NAMES[size]!;
          const cellsStr = combo.map((item) => `R${ROW_OF[item.cell]! + 1}C${COL_OF[item.cell]! + 1}`).join(', ');
          const digitsStr = subsetDigits.join(', ');
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: { cells: combo.map((item) => item.cell), candidates: highlightCandidates, links: [] },
            explanation: {
              zh: `${cellsStr} 这 ${size} 个格子的候选数仅为 {${digitsStr}}（${names.zh}），因此从该单元其他格子排除这些数字。`,
              en: `${cellsStr} contain only candidates {${digitsStr}} (${names.en}), eliminate these digits from other cells in the house.`,
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