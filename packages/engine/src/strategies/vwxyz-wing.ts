/**
 * VWXYZ-Wing (T4, exotic) — VWXYZ翼 / 翼 size-ladder (bent 5-set wing).
 *
 * The size-N rung of the wing size-ladder (general bent Almost Locked Set).
 * Same logic as WXYZ-Wing but N=5: 5 cells / 5 distinct digits, confined to
 * exactly two houses (a box + a line) but NOT all in the same house, with
 * exactly ONE non-restricted digit Z. Since one of the 5 cells must take Z,
 * any cell that sees every Z-instance in the pattern loses Z.
 *
 * (The ladder: XY=3/2, XYZ=3/3, WXYZ=4/4, VWXYZ=5/5; same predicate, longer
 * rung. Larger N are increasingly subsumed by ALS / AIC, but VWXYZ does
 * occasionally fire and is a named human technique.)
 *
 * We only handle N=5 here (the canonical VWXYZ). N=6+ is rare and is
 * intentionally not implemented — the ladder generalises by predicate, but
 * the engineering cost grows combinatorially with N.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** A digit D in `cells` is "restricted" iff every pair of cells that contain D
 *  in the pattern see each other (i.e. all D-holders pairwise share a row/col/box). */
function restricted(grid: Grid, cells: readonly number[], digit: number): boolean {
  const bit = maskOf(digit);
  const holders: number[] = cells.filter((c) => (grid.candidatesOf(c) & bit) !== 0);
  if (holders.length < 2) return true;
  for (let i = 0; i < holders.length; i++) {
    for (let j = i + 1; j < holders.length; j++) {
      if (!PEERS_OF[holders[i]!]!.includes(holders[j]!)) return false;
    }
  }
  return true;
}

/** Cells confined to (box ∪ line), not all in one house. */
function isBent(cells: readonly number[], box: number[], line: number[]): boolean {
  const cellSet = new Set(cells);
  if (cells.every((c) => box.includes(c))) return false;
  if (cells.every((c) => line.includes(c))) return false;
  for (const c of cells) {
    if (!box.includes(c) && !line.includes(c)) return false;
  }
  return cellSet.size === cells.length;
}

function tryVwxyzWing(grid: Grid): Step | null {
  // For each (box, line) intersecting at a 3-cell chute, enumerate 5-cell
  // bent subsets of (box ∪ line). Restriction: union of candidates has
  // exactly 5 digits, exactly one non-restricted digit Z. Each cell must
  // contribute at least one of those 5 digits.
  for (const box of HOUSES.slice(18, 27)) {
    for (const line of HOUSES.slice(0, 18)) {
      const chute = box.filter((c) => line.includes(c));
      if (chute.length !== 3) continue;
      const extraInBox = box.filter((c) => !line.includes(c));
      const extraInLine = line.filter((c) => !box.includes(c));
      const candidates = [...chute, ...extraInBox, ...extraInLine];
      // 5-subsets. We could iterate by combinations but cap enumeration
      // to keep solver latency reasonable — VWXYZ fires rarely so we can
      // be thorough here.
      function* combos<T>(arr: T[], k: number): Generator<T[]> {
        if (k === 0) { yield []; return; }
        if (arr.length < k) return;
        const [first, ...rest] = arr;
        for (const c of combos(rest, k - 1)) yield [first!, ...c];
        yield* combos(rest, k);
      }
      for (const combo of combos(candidates, 5)) {
        if (combo.length !== 5) continue;
        if (combo.some((c) => grid.get(c) !== 0)) continue;
        if (!isBent(combo, [...box], [...line])) continue;
        let combined = 0;
        for (const c of combo) combined |= grid.candidatesOf(c);
        if (popcount(combined) !== 5) continue;
        // Each cell must contribute at least one of the 5 digits.
        if (combo.some((c) => popcount(grid.candidatesOf(c) & combined) < 1)) continue;
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
          strategyId: 'vwxyz-wing',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...combo, ...elims.map((e) => e.cell)],
            candidates: combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `VWXYZ翼：在宫${BOX_OF[chute[0]!]! + 1} 与行/列中选 5 格 ${combo.map(cellLabel).join('、')}，候选数恰为 {${ds.join(',')}}，仅 ${Z} 非受限；可见所有 ${Z} 的格消去 ${Z}（VWXYZ翼，翼阶梯）。`,
            en: `VWXYZ-Wing: in box ${BOX_OF[chute[0]!]! + 1} and a line pick 5 cells ${combo.map(cellLabel).join(', ')} with candidates exactly {${ds.join(',')}}, only ${Z} non-restricted; eliminate ${Z} from cells seeing all ${Z} (VWXYZ-Wing, wing size-ladder).`,
          },
        };
      }
    }
  }
  return null;
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryVwxyzWing(grid);
  },
};
