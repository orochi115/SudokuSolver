import { ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: 'Sue de Coq / 双区域不交数组', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid: Grid): Step | null {
    for (let ri = 0; ri < 9; ri++) {
      for (let ci = 0; ci < 9; ci++) {
        const boxIdx = BOX_OF[ri * 9 + ci]!;
        const result = findSueDeCoqAt(grid, ri, ci, boxIdx);
        if (result) return result;
      }
    }
    return null;
  },
};

function findSueDeCoqAt(grid: Grid, rowIdx: number, colIdx: number, boxIdx: number): Step | null {
  const rowCells = ROWS[rowIdx]!;
  const boxCells = BOXES[boxIdx]!;

  const intersect: number[] = [];
  for (const c of rowCells) {
    if (BOX_OF[c]! === boxIdx && grid.get(c) === 0) intersect.push(c);
  }
  if (intersect.length < 2) return null;

  const lineNonIntersect: number[] = [];
  for (const c of rowCells) {
    if (BOX_OF[c]! !== boxIdx && grid.get(c) === 0) lineNonIntersect.push(c);
  }

  const boxNonIntersect: number[] = [];
  for (const c of boxCells) {
    if (ROW_OF[c]! !== rowIdx && grid.get(c) === 0) boxNonIntersect.push(c);
  }

  let intersectMask = 0;
  for (const c of intersect) intersectMask |= grid.candidatesOf(c);

  for (let n = 2; n <= intersect.length; n++) {
    const combos = combinations(intersect, n);
    for (const combo of combos) {
      let comboMask = 0;
      for (const c of combo) comboMask |= grid.candidatesOf(c);

      const restrictedDigits = digitsOf(comboMask);
      const digitCount = restrictedDigits.length;
      if (digitCount <= n) continue;

      const lineSideDigits = new Set<number>();
      for (const c of lineNonIntersect) {
        const mask = grid.candidatesOf(c) & comboMask;
        for (const d of digitsOf(mask)) lineSideDigits.add(d);
      }

      const boxSideDigits = new Set<number>();
      for (const c of boxNonIntersect) {
        const mask = grid.candidatesOf(c) & comboMask;
        for (const d of digitsOf(mask)) boxSideDigits.add(d);
      }

      const lineOnly = [...lineSideDigits].filter(d => !boxSideDigits.has(d));
      const boxOnly = [...boxSideDigits].filter(d => !lineSideDigits.has(d));
      const shared = [...lineSideDigits].filter(d => boxSideDigits.has(d));

      if (shared.length === 0) continue;
      if (lineOnly.length === 0 && boxOnly.length === 0) continue;

      const eliminations: { cell: number; digit: number }[] = [];

      for (const d of lineOnly) {
        const dBit = maskOf(d);
        for (const c of rowCells) {
          if (grid.get(c) !== 0 || combo.includes(c)) continue;
          if (BOX_OF[c]! === boxIdx) continue;
          if ((grid.candidatesOf(c) & dBit) !== 0) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      for (const d of boxOnly) {
        const dBit = maskOf(d);
        for (const c of boxCells) {
          if (grid.get(c) !== 0 || combo.includes(c)) continue;
          if (ROW_OF[c]! === rowIdx) continue;
          if ((grid.candidatesOf(c) & dBit) !== 0) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      if (eliminations.length === 0) continue;

      const comboStr = combo.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',');
      return {
        strategyId: 'sue-de-coq',
        placements: [],
        eliminations,
        highlights: {
          cells: [...combo, ...eliminations.map(e => e.cell)],
          candidates: [
            ...combo.flatMap(c => restrictedDigits.map(d => ({ cell: c, digit: d }))),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `Sue de Coq: 行${rowIdx + 1}×宫${boxIdx + 1}交叉格(${comboStr})构成不交数组，排除行侧/宫侧候选数。`,
          en: `Sue de Coq: Intersection cells (${comboStr}) at row ${rowIdx + 1}×box ${boxIdx + 1} form a disjoint subset, eliminating line-side/box-side candidates.`,
        },
      };
    }
  }
  return null;
}

function combinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  if (k === 0) { result.push([]); return result; }
  if (arr.length < k) return result;
  function bt(start: number, current: number[]): void {
    if (current.length === k) { result.push([...current]); return; }
    for (let idx = start; idx < arr.length; idx++) { current.push(arr[idx]!); bt(idx + 1, current); current.pop(); }
  }
  bt(0, []);
  return result;
}