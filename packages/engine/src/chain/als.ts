/**
 * Almost Locked Sets (ALS) — shared finder for the `als` strategy.
 *
 * An ALS is a set of N cells, all within a single house, whose combined
 * candidates number exactly N+1. (N=1 ⇒ a bivalue cell is the smallest ALS.)
 * If all but one of its digits were removed it would be a locked set, hence
 * "almost locked".
 *
 * Two ALS are linked by a Restricted Common Candidate (RCC) X: a digit present
 * in both, where every X-candidate of ALS-A sees every X-candidate of ALS-B
 * (so X cannot be placed in both ALS — at most one). Given an RCC X, the other
 * common candidates Z behave as follows (ALS-XZ rule):
 *
 *   If X is the RCC, then exactly one ALS "absorbs" X; the other becomes locked
 *   on its remaining digits. For any OTHER common digit Z, Z must appear in one
 *   of the two ALS, so any cell seeing every Z-candidate in BOTH ALS can drop Z.
 *
 * Pure: never mutates the grid.
 */

import { CELLS, SIZE, HOUSES, PEERS_OF, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';

export interface Als {
  cells: number[];
  /** Bitmask of the N+1 candidate digits. */
  mask: number;
  /** Which house this ALS lives in (HOUSES index). */
  house: number;
}

/** Enumerate ALS up to `maxSize` cells (default 4). */
export function findAllAls(grid: Grid, maxSize = 4): Als[] {
  const out: Als[] = [];
  const seen = new Set<string>();
  for (let h = 0; h < HOUSES.length; h++) {
    const empties = HOUSES[h]!.filter((c) => grid.get(c) === 0);
    // enumerate subsets of size 1..maxSize
    const n = empties.length;
    for (let size = 1; size <= Math.min(maxSize, n); size++) {
      combinate(empties, size, (subset) => {
        let mask = 0;
        for (const c of subset) mask |= grid.candidatesOf(c);
        if (popcount(mask) === size + 1) {
          const key = [...subset].sort((a, b) => a - b).join(',');
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ cells: [...subset], mask, house: h });
          }
        }
      });
    }
  }
  return out;
}

function combinate(arr: number[], k: number, cb: (subset: number[]) => void): void {
  const n = arr.length;
  if (k > n) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  const buf: number[] = new Array(k);
  while (true) {
    for (let i = 0; i < k; i++) buf[i] = arr[idx[i]!]!;
    cb(buf);
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
}

/** Cells of an ALS that hold candidate `digit`. */
export function alsCellsWith(grid: Grid, als: Als, digit: number): number[] {
  const bit = maskOf(digit);
  return als.cells.filter((c) => grid.candidatesOf(c) & bit);
}

/** True if every `digit` candidate of ALS a sees every `digit` candidate of ALS b. */
export function isRestricted(grid: Grid, a: Als, b: Als, digit: number): boolean {
  const ca = alsCellsWith(grid, a, digit);
  const cb = alsCellsWith(grid, b, digit);
  if (ca.length === 0 || cb.length === 0) return false;
  for (const x of ca) {
    for (const y of cb) {
      if (x === y) return false;
      if (!PEERS_OF[x]!.includes(y)) return false;
    }
  }
  return true;
}

/** Digits common to both ALS. */
export function commonDigits(a: Als, b: Als): number[] {
  const both = a.mask & b.mask;
  const out: number[] = [];
  for (let d = 1; d <= SIZE; d++) if (both & maskOf(d)) out.push(d);
  return out;
}

/** Cells that can be eliminated of digit Z given Z-candidates in two ALS. */
export function elimForZ(grid: Grid, a: Als, b: Als, z: number): number[] {
  const za = alsCellsWith(grid, a, z);
  const zb = alsCellsWith(grid, b, z);
  if (za.length === 0 || zb.length === 0) return [];
  const allZ = [...za, ...zb];
  const out: number[] = [];
  const bit = maskOf(z);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (allZ.includes(c)) continue;
    if (allZ.every((zc) => PEERS_OF[c]!.includes(zc))) out.push(c);
  }
  return out;
}

/** Do two ALS share any cell? (must be disjoint to be a valid pair). */
export function disjoint(a: Als, b: Als): boolean {
  const set = new Set(a.cells);
  return !b.cells.some((c) => set.has(c));
}
