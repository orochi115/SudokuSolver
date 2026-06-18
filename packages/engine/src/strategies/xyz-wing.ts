/**
 * XYZ-Wing (T3) — XYZ翼
 *
 * A pivot cell with exactly 3 candidates {X, Y, Z} sees two pincers:
 *   - Pincer 1 has exactly 2 candidates {X, Z}
 *   - Pincer 2 has exactly 2 candidates {Y, Z}
 *
 * At least one of the three cells (pivot, p1, p2) must contain Z.
 * Eliminate Z from cells that see ALL THREE (pivot, p1, p2).
 *
 * Key difference from XY-Wing: pivot has 3 candidates, not 2;
 * and eliminations must see the PIVOT as well (since pivot itself has Z).
 */

import { CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 54,

  apply(grid: Grid): Step | null {
    // Pivot must have exactly 3 candidates
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;

      const pivotDigits = digitsOf(pivotMask);
      const pivotPeers = new Set(PEERS_OF[pivot]!);

      // Collect bivalue peers (potential pincers)
      const bivaluePeers: number[] = [];
      for (const c of PEERS_OF[pivot]!) {
        if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
          bivaluePeers.push(c);
        }
      }

      // Try all pairs of bivalue peers as pincers
      for (let i = 0; i < bivaluePeers.length; i++) {
        for (let j = i + 1; j < bivaluePeers.length; j++) {
          const p1 = bivaluePeers[i]!;
          const p2 = bivaluePeers[j]!;
          const p1Mask = grid.candidatesOf(p1);
          const p2Mask = grid.candidatesOf(p2);

          // p1 and p2 together with pivot must cover exactly the pivot's 3 digits
          // p1 ⊂ pivot, p2 ⊂ pivot
          if ((p1Mask & pivotMask) !== p1Mask) continue;
          if ((p2Mask & pivotMask) !== p2Mask) continue;

          // p1 and p2 must share exactly one digit (which is Z)
          const shared = p1Mask & p2Mask;
          if (popcount(shared) !== 1) continue;
          const z = digitsOf(shared)[0]!;
          const zBit = 1 << (z - 1);

          // Each pincer must have one digit that the other doesn't
          // (so together they cover the pivot)
          const union = p1Mask | p2Mask;
          if (union !== pivotMask) continue;

          // Eliminations: cells seeing pivot, p1, AND p2 that have Z
          const peersP1 = new Set(PEERS_OF[p1]!);
          const peersP2 = new Set(PEERS_OF[p2]!);
          const elims: { cell: number; digit: number }[] = [];

          for (const c of PEERS_OF[pivot]!) {
            if (c === p1 || c === p2) continue;
            if (!peersP1.has(c)) continue;
            if (!peersP2.has(c)) continue;
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            elims.push({ cell: c, digit: z });
          }

          if (elims.length === 0) continue;

          const pr = ROW_OF[pivot]! + 1;
          const pc = COL_OF[pivot]! + 1;
          const p1r = ROW_OF[p1]! + 1;
          const p1c = COL_OF[p1]! + 1;
          const p2r = ROW_OF[p2]! + 1;
          const p2c = COL_OF[p2]! + 1;
          const [dx, dy] = digitsOf(p1Mask ^ p2Mask) as [number, number];

          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [pivot, p1, p2, ...elims.map((e) => e.cell)],
              candidates: [
                ...pivotDigits.map((d) => ({ cell: pivot, digit: d })),
                ...digitsOf(p1Mask).map((d) => ({ cell: p1, digit: d })),
                ...digitsOf(p2Mask).map((d) => ({ cell: p2, digit: d })),
                ...elims,
              ],
              links: [
                { from: { cell: pivot, digit: dx }, to: { cell: p1, digit: dx }, type: 'weak' },
                { from: { cell: pivot, digit: dy }, to: { cell: p2, digit: dy }, type: 'weak' },
              ],
            },
            explanation: {
              zh: `XYZ翼：枢纽格 R${pr}C${pc}（{${pivotDigits.join(',')}}}）看到翼格 R${p1r}C${p1c}（{${digitsOf(p1Mask).join(',')}}）和 R${p2r}C${p2c}（{${digitsOf(p2Mask).join(',')}}）；可从同时看到枢纽和两个翼格的格子中消去 ${z}（XYZ翼）。`,
              en: `XYZ-Wing: pivot R${pr}C${pc} ({${pivotDigits.join(',')}}) sees pincers R${p1r}C${p1c} ({${digitsOf(p1Mask).join(',')}}) and R${p2r}C${p2c} ({${digitsOf(p2Mask).join(',')}}); eliminate ${z} from cells seeing all three (XYZ-Wing).`,
            },
          };
        }
      }
    }
    return null;
  },
};
