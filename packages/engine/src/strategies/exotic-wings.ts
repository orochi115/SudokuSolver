/**
 * VWXYZ-Wing (P2a) — 五数翼
 *
 * Generalises WXYZ-Wing to an ALS of size 5 (5 cells, 6 candidates) plus a
 * bivalue pivot {Y,Z}. When Y is restricted between the pivot and the ALS, Z
 * must lie in the pivot or the ALS → eliminate Z from cells seeing all
 * Z-cells. This is the size-ladder generalisation of the wing family
 * (XY→XYZ→WXYZ→VWXYZ) and is a Subset-Counting corollary.
 *
 * Soundness: the ALS (5 cells, 6 candidates) must contain Z; if the pivot
 * (bivalue {Y,Z}) doesn't hold Z, then Z must be in the ALS; conversely if
 * the ALS doesn't hold Z, the pivot does. So Z is in pivot ∪ Z-cells-of-ALS;
 * cells seeing all of those cannot be Z.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function seesAll(cell: number, targets: number[]): boolean {
  if (targets.includes(cell)) return false;
  const peers = new Set(PEERS_OF[cell]!);
  return targets.every((t) => peers.has(t));
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Build ALS of size 3..5 per house
    const alsList: { house: number; cells: number[]; digits: number[]; mask: number }[] = [];
    const seen = new Set<string>();
    for (let h = 0; h < HOUSES.length; h++) {
      const empty = HOUSES[h]!.filter((c) => grid.get(c) === 0);
      // sizes 3 (4 cands), 4 (5 cands) — skip size 5 for performance
      for (let size = 3; size <= 4 && size <= empty.length; size++) {
        for (const combo of combinations(empty, size)) {
          let mask = 0;
          for (const c of combo) mask |= grid.candidatesOf(c);
          if (popcount(mask) === size + 1) {
            const key = `${h}:${[...combo].sort((a, b) => a - b).join(',')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            alsList.push({ house: h, cells: combo, digits: digitsOf(mask), mask });
          }
        }
      }
    }

    // Pivot: a bivalue cell P {Y,Z}
    for (let p = 0; p < CELLS; p++) {
      if (grid.get(p) !== 0) continue;
      const pm = grid.candidatesOf(p);
      if (popcount(pm) !== 2) continue;
      const [Y, Z] = digitsOf(pm) as [number, number];
      for (const als of alsList) {
        if (als.cells.includes(p)) continue;
        if (!(als.mask & maskOf(Y))) continue;
        if (!(als.mask & maskOf(Z))) continue;
        // P must see all Y-cells of ALS (Y restricted between P and ALS)
        const yCells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(Y));
        if (yCells.length === 0) continue;
        if (!yCells.every((c) => PEERS_OF[p]!.includes(c))) continue;
        // Z-cells in ALS:
        const zCells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(Z));
        const allZ = [p, ...zCells];
        // eliminate Z from cells seeing all of allZ
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (c === p || als.cells.includes(c)) continue;
          if (!grid.hasCandidate(c, Z)) continue;
          if (seesAll(c, allZ)) elims.push({ cell: c, digit: Z });
        }
        if (elims.length === 0) continue;
        return {
          strategyId: 'vwxyz-wing',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...als.cells, p, ...elims.map((e) => e.cell)],
            candidates: [
              ...als.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              { cell: p, digit: Y }, { cell: p, digit: Z },
              ...elims,
            ],
            links: [
              { from: { cell: p, digit: Y }, to: { cell: yCells[0]!, digit: Y }, type: 'weak' as const },
              { from: { cell: p, digit: Z }, to: { cell: zCells[0]!, digit: Z }, type: 'strong' as const },
            ],
          },
          explanation: {
            zh: `VWXYZ翼：双值枢纽 ${cellLabel(p)}{${Y},${Z}} 与 ALS（{${als.digits.join(',')}}，${als.cells.length}格）经 ${Y} 受限连接；${Z} 必在枢纽或 ALS 中，消去同时看到两者的 ${Z}。`,
            en: `VWXYZ-Wing: bivalue pivot ${cellLabel(p)}{${Y},${Z}} linked to ALS ({${als.digits.join(',')}}, ${als.cells.length} cells) via restricted ${Y}; ${Z} must lie in pivot or ALS; eliminate ${Z} from cells seeing both.`,
          },
        };
      }
    }
    return null;
  },
};
