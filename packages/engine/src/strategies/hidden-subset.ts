import { HOUSES, ROW_OF, COL_OF, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_SIZES = [2, 3, 4];
const SUBSET_NAMES_ZH: Record<number, string> = { 2: '隐性数对', 3: '隐性三数组', 4: '隐性四数组' };
const SUBSET_NAMES_EN: Record<number, string> = { 2: 'Hidden Pair', 3: 'Hidden Triple', 4: 'Hidden Quad' };

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells: number[] = [];
      const availableDigits: number[] = [];
      const placedMask = house.reduce((m, c) => {
        const v = grid.get(c);
        return v !== 0 ? m | maskOf(v) : m;
      }, 0);

      for (const c of house) {
        if (grid.get(c) === 0) emptyCells.push(c);
      }

      for (let d = 1; d <= 9; d++) {
        if ((placedMask & maskOf(d)) !== 0) continue;
        const bit = maskOf(d);
        let count = 0;
        for (const c of emptyCells) {
          if ((grid.candidatesOf(c) & bit) !== 0) count++;
        }
        if (count > 0) availableDigits.push(d);
      }

      if (availableDigits.length < 3) continue;

      for (const n of SUBSET_SIZES) {
        if (emptyCells.length < n || availableDigits.length < n) continue;

        const digitCombos = combinations(availableDigits, n);
        for (const dCombo of digitCombos) {
          const comboMask = dCombo.reduce((m, d) => m | maskOf(d), 0);
          const cellsForCombo: number[] = [];
          for (const c of emptyCells) {
            if ((grid.candidatesOf(c) & comboMask) !== 0) {
              cellsForCombo.push(c);
            }
          }
          if (cellsForCombo.length !== n) continue;

          let valid = true;
          for (const d of dCombo) {
            const bit = maskOf(d);
            for (const c of emptyCells) {
              if (!cellsForCombo.includes(c) && (grid.candidatesOf(c) & bit) !== 0) {
                valid = false;
                break;
              }
            }
            if (!valid) break;
          }
          if (!valid) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of cellsForCombo) {
            const cMask = grid.candidatesOf(c);
            const extra = cMask & ~comboMask;
            for (const ed of digitsOf(extra)) {
              eliminations.push({ cell: c, digit: ed });
            }
          }
          if (eliminations.length === 0) continue;

          const cellsStr = cellsForCombo.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
          const cellsStrEn = cellsForCombo.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
          const digitsStr = dCombo.join('/');
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...cellsForCombo],
              candidates: [
                ...cellsForCombo.flatMap(c => dCombo.map(d => ({ cell: c, digit: d }))),
                ...eliminations.map(e => ({ cell: e.cell, digit: e.digit })),
              ],
              links: [],
            },
            explanation: {
              zh: `数字 ${digitsStr} 在该单元仅出现在 ${cellsStr}，构成${SUBSET_NAMES_ZH[n]}，这些格中的其他候选数可被排除。`,
              en: `Digits ${digitsStr} appear only in ${cellsStrEn} in this house, forming a ${SUBSET_NAMES_EN[n]}, so other candidates in those cells can be removed.`,
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