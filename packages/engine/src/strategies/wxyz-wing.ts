/**
 * WXYZ-Wing (T4) — WXYZ翼 / VWXYZ翼 size-ladder (bent N-set wing).
 *
 * A bent Almost Locked Set of N cells, N digits confined to two houses
 * (a box and a line). Exactly one digit Z is *non-restricted* (at least
 * one instance does not see another instance of Z in the pattern). Since
 * one of the N cells must be Z, cells that see every Z-instance lose Z.
 *
 * Implementation: search all combinations of N cells (1..4) inside a box
 * ∩ line intersection. N=4 is the canonical WXYZ-Wing. We check the
 * predicate: union of candidates == exactly N distinct digits, with
 * exactly one digit being non-restricted.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Find a bent N-set wing (N=3 for XYZ is also produced here, but xyz-wing
 *  covers it earlier). N=4 is the WXYZ-Wing. We only handle N=4 here.
 */
function restricted(grid: Grid, cells: readonly number[], digit: number): boolean {
  const bit = maskOf(digit);
  const holders: number[] = cells.filter((c) => grid.candidatesOf(c) & bit);
  if (holders.length < 2) return true; // 1 or 0 holders → vacuously restricted
  for (let i = 0; i < holders.length; i++) {
    for (let j = i + 1; j < holders.length; j++) {
      if (!PEERS_OF[holders[i]!]!.includes(holders[j]!)) return false;
    }
  }
  return true;
}

/** Check that the cells form a "bent" ALS: they are confined to two houses
 *  (a box and a line), but not all in one house. */
function isBent(cells: readonly number[], box: number[], line: number[]): boolean {
  const cellSet = new Set(cells);
  // All cells in box?
  if (cells.every((c) => box.includes(c))) return false;
  // All cells in line?
  if (cells.every((c) => line.includes(c))) return false;
  // Each cell must be in box OR line.
  for (const c of cells) {
    if (!box.includes(c) && !line.includes(c)) return false;
  }
  return cellSet.size === cells.length; // distinct cells
}

function tryWxyxWing(grid: Grid): Step | null {
  // For each box + line (row/col) that intersects at a 3-cell chute, pick
  // combinations of 4 cells (2 inside the chute, 2 elsewhere on the line
  // OR inside the chute plus 2 elsewhere — many shapes; the canonical one
  // is 4 cells whose union of candidates = 4 digits with one non-restricted).
  //
  // Simple enumeration: for each row R, for each box B in the row's bands,
  // find 4 cells inside R ∪ B that are bent (i.e. not all in the same house).
  // Restriction: the cells' union has exactly 4 digits, exactly one
  // non-restricted.
  for (const box of HOUSES.slice(18, 27)) {
    for (const line of HOUSES.slice(0, 18)) {
      const bent = box.filter((c) => line.includes(c));
      // bent has 3 cells (box ∩ line). Add cells from each side:
      //   - extra cells in the box (outside the line): 6 cells
      //   - extra cells in the line (outside the box): 6 cells
      const extraInBox = box.filter((c) => !line.includes(c));
      const extraInLine = line.filter((c) => !box.includes(c));
      const candidates = [...bent, ...extraInBox, ...extraInLine];
      // Enumerate 4-subsets
      function* combos<T>(arr: T[], k: number): Generator<T[]> {
        if (k === 0) { yield []; return; }
        if (arr.length < k) return;
        const [first, ...rest] = arr;
        for (const c of combos(rest, k - 1)) yield [first!, ...c];
        yield* combos(rest, k);
      }
      for (const combo of combos(candidates, 4)) {
        if (combo.length !== 4) continue;
        // All cells must be empty (not solved) — solved cells aren't part of
        // the pattern.
        if (combo.some((c) => grid.get(c) !== 0)) continue;
        // Bent check: confined to box + line, but not all in one house.
        if (!isBent(combo, [...box], [...line])) continue;
        let combined = 0;
        for (const c of combo) combined |= grid.candidatesOf(c);
        if (popcount(combined) !== 4) continue;
        // Each cell must contribute at least one of the 4 digits (otherwise
        // it would be a "phantom" cell adding nothing).
        const comboDigits = popcount(combined);
        if (combo.some((c) => popcount(grid.candidatesOf(c) & combined) < 1)) continue;
        void comboDigits;
        const ds = digitsOf(combined);
        const nonRestricted: number[] = [];
        for (const d of ds) {
          if (!restricted(grid, combo, d)) nonRestricted.push(d);
        }
        if (nonRestricted.length !== 1) continue;
        const Z = nonRestricted[0]!;
        const Zbit = maskOf(Z);
        const Zcells = combo.filter((c) => grid.candidatesOf(c) & Zbit);
        if (Zcells.length === 0) continue;
        // Eliminate Z from every cell z (outside combo) that sees every Zcell.
        const elims: { cell: number; digit: number }[] = [];
        for (let z = 0; z < CELLS; z++) {
          if (grid.get(z) !== 0) continue;
          if (!(grid.candidatesOf(z) & Zbit)) continue;
          if (combo.includes(z)) continue;
          const peers = new Set(PEERS_OF[z]!);
          if (Zcells.every((zc) => peers.has(zc))) elims.push({ cell: z, digit: Z });
        }
        if (elims.length === 0) continue;
        return {
          strategyId: 'wxyz-wing',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...combo, ...elims.map((e) => e.cell)],
            candidates: combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `WXYZ翼：在宫${BOX_OF[bent[0]!]! + 1} 与行/列中选 4 格 ${combo.map(cellLabel).join('、')}，候选数恰为 {${ds.join(',')}}，仅 ${Z} 非受限；可见所有 ${Z} 的格消去 ${Z}（WXYZ翼）。`,
            en: `WXYZ-Wing: in box ${BOX_OF[bent[0]!]! + 1} and a line pick 4 cells ${combo.map(cellLabel).join(', ')} with candidates exactly {${ds.join(',')}}, only ${Z} non-restricted; eliminate ${Z} from cells seeing all ${Z} (WXYZ-Wing).`,
          },
        };
      }
    }
  }
  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryWxyxWing(grid);
  },
};