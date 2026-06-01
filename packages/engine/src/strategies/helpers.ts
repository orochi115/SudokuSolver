/**
 * Shared helpers for the human-solving strategies (M2).
 *
 * Pure functions only — none of these mutate a Grid. They centralise the
 * boilerplate every strategy needs: human-readable cell/house labels,
 * candidate-cell collection, peer/visibility tests, and combination
 * enumeration. Keeping them here makes each strategy module a thin, readable
 * statement of its own logic.
 */

import {
  SIZE,
  CELLS,
  ROW_OF,
  COL_OF,
  BOX_OF,
  HOUSES,
  ROWS,
  COLS,
  BOXES,
  PEERS_OF,
  maskOf,
  popcount,
  digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit } from '../trace.js';

// ---- labels (1-based, bilingual-friendly) ----

/** "R5C3"-style label for a cell index (0..80). */
export function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Comma-joined cell labels, e.g. "R1C2, R1C5". */
export function cellsLabel(cells: readonly number[]): string {
  return cells.map(cellLabel).join(', ');
}

/** Bilingual house label for a HOUSES index (0..26). */
export function houseLabel(houseIdx: number): { zh: string; en: string } {
  if (houseIdx < 9) return { zh: `第 ${houseIdx + 1} 行`, en: `Row ${houseIdx + 1}` };
  if (houseIdx < 18) return { zh: `第 ${houseIdx - 9 + 1} 列`, en: `Column ${houseIdx - 9 + 1}` };
  return { zh: `第 ${houseIdx - 18 + 1} 宫`, en: `Box ${houseIdx - 18 + 1}` };
}

// ---- candidate / cell queries ----

/** Empty cells in a house (array of cell indices) that still hold `digit`. */
export function cellsWithCandidate(grid: Grid, house: readonly number[], digit: number): number[] {
  const out: number[] = [];
  const bit = maskOf(digit);
  for (const c of house) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) out.push(c);
  }
  return out;
}

/** All empty cells across the whole grid holding `digit` as a candidate. */
export function allCellsWithCandidate(grid: Grid, digit: number): number[] {
  const out: number[] = [];
  const bit = maskOf(digit);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) out.push(c);
  }
  return out;
}

/** All empty cells in the grid. */
export function emptyCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) out.push(c);
  return out;
}

/** True if cell `a` sees cell `b` (shares a row, column, or box). */
export function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/** Cells that see ALL of the given cells (excluding the given cells themselves). */
export function commonPeers(cells: readonly number[]): number[] {
  if (cells.length === 0) return [];
  const sets = cells.map((c) => new Set(PEERS_OF[c]!));
  const first = sets[0]!;
  const out: number[] = [];
  for (const cand of first) {
    if (cells.includes(cand)) continue;
    if (sets.every((s) => s.has(cand))) out.push(cand);
  }
  return out;
}

// ---- combinatorics ----

/** All k-combinations of an array (as arrays of elements). */
export function combinations<T>(arr: readonly T[], k: number): T[][] {
  const res: T[][] = [];
  const n = arr.length;
  if (k > n || k <= 0) return res;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    res.push(idx.map((i) => arr[i]!));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
  return res;
}

// ---- re-exports used by many strategies ----

export {
  SIZE,
  CELLS,
  ROW_OF,
  COL_OF,
  BOX_OF,
  HOUSES,
  ROWS,
  COLS,
  BOXES,
  PEERS_OF,
  maskOf,
  popcount,
  digitsOf,
};
export type { CellDigit };
