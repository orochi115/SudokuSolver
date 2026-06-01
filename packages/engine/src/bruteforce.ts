/**
 * Brute-force solver (FR-3) — VALIDATION ONLY, never used as a teaching step.
 *
 * Provides:
 *  - the canonical (ground-truth) solution of a puzzle, and
 *  - a uniqueness check (does the puzzle have exactly one solution?).
 *
 * Uses bitmask backtracking with the minimum-remaining-values (MRV) heuristic.
 */

import { CELLS, SIZE, ALL_CANDIDATES, PEERS_OF, maskOf, popcount } from './grid.js';

/** Count solutions up to `limit`. Returns min(actual, limit). */
export function countSolutions(puzzle: string, limit = 2): number {
  const values = parse(puzzle);
  const cands = computeCandidates(values);
  if (cands === null) return 0;
  return search(values, cands, limit, { count: 0 });
}

/** First solution found as an 81-char string, or null if unsolvable. */
export function solveBruteforce(puzzle: string): string | null {
  const values = parse(puzzle);
  const cands = computeCandidates(values);
  if (cands === null) return null;
  const result = { count: 0 };
  const out = values.slice();
  if (searchCollect(out, cands, result)) return toString(out);
  return null;
}

export interface GroundTruth {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

/** Solve and report uniqueness in one pass. */
export function findGroundTruth(puzzle: string): GroundTruth {
  const values = parse(puzzle);
  const cands = computeCandidates(values);
  if (cands === null) return { puzzle, solution: null, unique: false };
  const out = values.slice();
  const found = searchCollect(out, cands, { count: 0 });
  const solution = found ? toString(out) : null;
  const n = countSolutions(puzzle, 2);
  return { puzzle, solution, unique: n === 1 };
}

// ---- internals ----

function parse(puzzle: string): Uint8Array {
  const values = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    const ch = puzzle[i]!;
    values[i] = ch === '.' || ch === '0' ? 0 : Number(ch);
  }
  return values;
}

function toString(values: Uint8Array): string {
  let s = '';
  for (let i = 0; i < CELLS; i++) s += String(values[i]);
  return s;
}

/** Candidate masks for empty cells; null if the puzzle is already contradictory. */
function computeCandidates(values: Uint8Array): Uint16Array | null {
  const cands = new Uint16Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    if (values[i] !== 0) continue;
    let mask = ALL_CANDIDATES;
    for (const p of PEERS_OF[i]!) {
      const v = values[p]!;
      if (v !== 0) mask &= ~maskOf(v);
    }
    if (mask === 0) return null;
    cands[i] = mask;
  }
  return cands;
}

function pickMRV(values: Uint8Array, cands: Uint16Array): number {
  let best = -1;
  let bestCount = SIZE + 1;
  for (let i = 0; i < CELLS; i++) {
    if (values[i] !== 0) continue;
    const c = popcount(cands[i]!);
    if (c < bestCount) {
      bestCount = c;
      best = i;
      if (c <= 1) break;
    }
  }
  return best;
}

/** Backtracking that fills `values` in place and stops at the first solution. */
function searchCollect(values: Uint8Array, cands: Uint16Array, result: { count: number }): boolean {
  const cell = pickMRV(values, cands);
  if (cell === -1) return true; // solved
  let mask = cands[cell]!;
  if (mask === 0) return false;
  while (mask) {
    const bit = mask & -mask;
    mask &= mask - 1;
    const digit = Math.log2(bit) + 1;
    const saved = cands.slice();
    values[cell] = digit;
    cands[cell] = 0;
    if (propagate(values, cands, cell, bit)) {
      if (searchCollect(values, cands, result)) return true;
    }
    values[cell] = 0;
    cands.set(saved);
  }
  return false;
}

/** Counting search: does not need to retain the solution. */
function search(values: Uint8Array, cands: Uint16Array, limit: number, result: { count: number }): number {
  const cell = pickMRV(values, cands);
  if (cell === -1) {
    result.count++;
    return result.count;
  }
  let mask = cands[cell]!;
  while (mask && result.count < limit) {
    const bit = mask & -mask;
    mask &= mask - 1;
    const digit = Math.log2(bit) + 1;
    const savedCands = cands.slice();
    values[cell] = digit;
    cands[cell] = 0;
    if (propagate(values, cands, cell, bit)) {
      search(values, cands, limit, result);
    }
    values[cell] = 0;
    cands.set(savedCands);
  }
  return result.count;
}

/** Remove `bit` from peers of `cell`. Returns false on a wipeout (dead end). */
function propagate(values: Uint8Array, cands: Uint16Array, cell: number, bit: number): boolean {
  for (const p of PEERS_OF[cell]!) {
    if (values[p] !== 0) continue;
    if (cands[p]! & bit) {
      cands[p]! &= ~bit;
      if (cands[p] === 0) return false;
    }
  }
  return true;
}
