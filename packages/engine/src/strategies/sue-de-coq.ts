/**
 * Sue de Coq (SdC) — Special / Exotic pattern (difficulty 95).
 *
 * Sue de Coq is an intersection technique that looks at a 2-3 cell group
 * in the intersection of a row/column and a box.
 *
 * The pattern: Take a row (or column) and a box, and consider the cells at their
 * intersection. Call this set I (the intersection cells, all empty, typically 2-3).
 *
 * The cells in I must have candidates that:
 * 1. Include candidates from the row-outside (cells in the row but NOT in the box) — call this set R
 * 2. Include candidates from the box-outside (cells in the box but NOT in the row) — call this set B
 * 3. The union of digits in I exactly covers: digits in R ∪ digits in B
 *    (i.e., candidates(I) = candidates_from_R ∪ candidates_from_B, no overlap)
 *
 * More precisely: for cells I at the intersection,
 *   Let dI = union of all candidates in cells of I
 *   Let nI = |I| (number of intersection cells)
 *   We need: |dI| = nI + |R| + |B| where R and B are "ALS" in the row/col and box respectively
 *   (Actually: the pattern forms two ALS — one in the row extension, one in the box extension)
 *
 * Standard SdC:
 *   - I is 2 cells with exactly 4 candidates {a, b, c, d}
 *   - R = 1 cell (ALS of size 1) in the row outside the box, with candidates {a, b}
 *   - B = 1 cell (ALS of size 1) in the box outside the row, with candidates {c, d}
 *   (i.e., {a,b} ∩ {c,d} = ∅, and {a,b} ∪ {c,d} = {a,b,c,d})
 *
 * The key insight: the 4 digits must be distributed between R and B. Exactly
 * {a,b} goes to R and {c,d} goes to B (or vice versa, but they don't mix).
 *
 * Eliminations:
 * - Any cell in the row (outside I and R) that has candidates {a} or {b} → eliminate them
 * - Any cell in the box (outside I and B) that has candidates {c} or {d} → eliminate them
 *
 * Extended SdC allows R or B to be multi-cell ALS, but we implement the
 * standard 2-cell intersection + 1-cell R + 1-cell B variant for clarity.
 */

import { HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Combinations of k elements from arr. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr.slice()];
  const result: T[][] = [];
  function recurse(start: number, current: T[]): void {
    if (current.length === k) { result.push(current.slice()); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      recurse(i + 1, current);
      current.pop();
    }
  }
  recurse(0, []);
  return result;
}

function trySueDeCocq(grid: Grid): Step | null {
  // Try each (row, box) and (col, box) intersection

  // Row x Box intersections
  for (let r = 0; r < 9; r++) {
    for (let b = 0; b < 9; b++) {
      const result = checkIntersection(grid, ROWS[r]!, BOXES[b]!, r, b, true);
      if (result) return result;
    }
  }

  // Col x Box intersections
  for (let c = 0; c < 9; c++) {
    for (let b = 0; b < 9; b++) {
      const result = checkIntersection(grid, COLS[c]!, BOXES[b]!, c, b, false);
      if (result) return result;
    }
  }

  return null;
}

function checkIntersection(
  grid: Grid,
  line: readonly number[],
  box: readonly number[],
  lineIdx: number,
  boxIdx: number,
  isRow: boolean,
): Step | null {
  const lineSet = new Set(line);
  const boxSet = new Set(box);

  // Intersection: cells in both line and box
  const intersection = line.filter((c) => boxSet.has(c) && grid.get(c) === 0);
  if (intersection.length < 2 || intersection.length > 3) return null;

  // Line-outside: cells in line but NOT in box (empty)
  const lineOutside = line.filter((c) => !boxSet.has(c) && grid.get(c) === 0);
  // Box-outside: cells in box but NOT in line (empty)
  const boxOutside = box.filter((c) => !lineSet.has(c) && grid.get(c) === 0);

  if (lineOutside.length === 0 || boxOutside.length === 0) return null;

  // Union of all candidates in intersection cells
  let iDigits = 0;
  for (const c of intersection) iDigits |= grid.candidatesOf(c);
  const nI = popcount(iDigits);

  // We need: nI = |intersection| + (something from line ALS) + (something from box ALS)
  // Simplified: try all subsets of lineOutside and boxOutside as ALS

  const maxALSSize = 2; // limit to size-2 ALS (N cells, N+1 digits)
  for (let la = 1; la <= Math.min(lineOutside.length, maxALSSize); la++) {
    for (const lCells of combinations(lineOutside, la)) {
      // Compute candidates in line ALS
      let lDigits = 0;
      for (const c of lCells) lDigits |= grid.candidatesOf(c);
      // ALS condition: la cells with la+1 candidates
      if (popcount(lDigits) !== la + 1) continue;

      for (let ba = 1; ba <= Math.min(boxOutside.length, maxALSSize); ba++) {
        for (const bCells of combinations(boxOutside, ba)) {
          // Compute candidates in box ALS
          let bDigits = 0;
          for (const c of bCells) bDigits |= grid.candidatesOf(c);
          // ALS condition: ba cells with ba+1 candidates
          if (popcount(bDigits) !== ba + 1) continue;

          // SdC condition:
          // 1. lDigits and bDigits must have no overlap: no digit in both
          if ((lDigits & bDigits) !== 0) continue;
          // 2. iDigits must be exactly lDigits | bDigits (intersection covers exactly these digits)
          if (iDigits !== (lDigits | bDigits)) continue;
          // 3. |iDigits| = |intersection| + la + ba (standard SdC sizing)
          if (nI !== intersection.length + la + ba) continue;

          // SdC pattern found! Compute eliminations:
          const lCellSet = new Set(lCells);
          const bCellSet = new Set(bCells);
          const iCellSet = new Set(intersection);
          const allCells = new Set([...intersection, ...lCells, ...bCells]);

          const elims: Array<{ cell: number; digit: number }> = [];

          // Eliminate lDigits from line cells outside I and lCells
          for (const cell of lineOutside) {
            if (lCellSet.has(cell)) continue;
            const mask = grid.candidatesOf(cell);
            for (const d of digitsOf(lDigits & mask)) {
              elims.push({ cell, digit: d });
            }
          }

          // Eliminate bDigits from box cells outside I and bCells
          for (const cell of boxOutside) {
            if (bCellSet.has(cell)) continue;
            const mask = grid.candidatesOf(cell);
            for (const d of digitsOf(bDigits & mask)) {
              elims.push({ cell, digit: d });
            }
          }

          if (elims.length === 0) continue;

          const lineName = isRow ? `行${lineIdx + 1}` : `列${lineIdx + 1}`;
          const lineNameEn = isRow ? `Row ${lineIdx + 1}` : `Column ${lineIdx + 1}`;
          const elimStr = elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join('、');

          return {
            strategyId: 'sue-de-coq',
            placements: [],
            eliminations: dedup(elims),
            highlights: {
              cells: [...allCells],
              candidates: [...allCells].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `苏德科：${lineName}与宫${boxIdx + 1}的交叉格 [${intersection.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')}] 候选数由行外ALS与宫外ALS完全覆盖，可消除相关候选数。消除：${elimStr}。`,
              en: `Sue de Coq: ${lineNameEn}/Box ${boxIdx + 1} intersection [${intersection.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')}] covered by line-ALS and box-ALS. Eliminations: ${elimStr}.`,
            },
          };
        }
      }
    }
  }

  return null;
}

function dedup(elims: Array<{ cell: number; digit: number }>): Array<{ cell: number; digit: number }> {
  const seen = new Set<number>();
  return elims.filter((e) => {
    const k = e.cell * 10 + e.digit;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const sueDeCocq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: '苏德科', en: 'Sue de Coq' },
  difficulty: 95,
  apply: trySueDeCocq,
};
