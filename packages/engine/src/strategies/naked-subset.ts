import { HOUSES, ROW_OF, COL_OF, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_SIZES = [2, 3, 4];
const SUBSET_NAMES_ZH: Record<number, string> = { 2: '显性数对', 3: '显性三数组', 4: '显性四数组' };
const SUBSET_NAMES_EN: Record<number, string> = { 2: 'Naked Pair', 3: 'Naked Triple', 4: 'Naked Quad' };

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells: number[] = [];
      for (const c of house) {
        if (grid.get(c) === 0) emptyCells.push(c);
      }
      if (emptyCells.length < 3) continue;

      for (const n of SUBSET_SIZES) {
        if (emptyCells.length < n) continue;

        const combos = combinations(emptyCells, n);
        for (const combo of combos) {
          let unionMask = 0;
          for (const c of combo) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== n) continue;

          const subsetDigits = digitsOf(unionMask);
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (combo.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            const mask = grid.candidatesOf(c);
            for (const d of subsetDigits) {
              if ((mask & maskOf(d)) !== 0) {
                eliminations.push({ cell: c, digit: d });
              }
            }
          }
          if (eliminations.length === 0) continue;

          const cellsStr = combo.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
          const cellsStrEn = combo.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
          const digitsStr = subsetDigits.join('/');
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...combo, ...eliminations.map(e => e.cell)],
              candidates: [
                ...combo.flatMap(c => subsetDigits.map(d => ({ cell: c, digit: d }))),
                ...eliminations.map(e => ({ cell: e.cell, digit: e.digit })),
              ],
              links: [],
            },
            explanation: {
              zh: `${cellsStr} 构成${SUBSET_NAMES_ZH[n]}（候选数 ${digitsStr}），该单元其他格中的这些候选数可被排除。`,
              en: `${cellsStrEn} form a ${SUBSET_NAMES_EN[n]} (candidates ${digitsStr}), so these digits can be removed from other cells in the house.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function combinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  if (k === 0) { result.push([]); return result; }
  if (arr.length < k) return result;
  function backtrack(start: number, current: number[]): void {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}