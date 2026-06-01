/**
 * XY-Wing (T3) — XY翼 (also called Y-Wing)
 *
 * A pivot cell with exactly 2 candidates {X, Y} sees two "pincer" cells:
 *   - Pincer 1 has candidates {X, Z}
 *   - Pincer 2 has candidates {Y, Z}
 *
 * At least one pincer must contain Z, so Z can be eliminated from all cells
 * that see BOTH pincers.
 */

import { CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all bivalue cells (exactly 2 candidates)
    const bivalue: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
    }

    for (const pivot of bivalue) {
      const pivotMask = grid.candidatesOf(pivot);
      const [x, y] = digitsOf(pivotMask) as [number, number];
      const pivotPeers = new Set(PEERS_OF[pivot]!);

      // Find pincers: bivalue cells that see the pivot
      const pincers = bivalue.filter((c) => c !== pivot && pivotPeers.has(c));

      for (let i = 0; i < pincers.length; i++) {
        const p1 = pincers[i]!;
        const p1Mask = grid.candidatesOf(p1);
        if (popcount(p1Mask) !== 2) continue;

        for (let j = i + 1; j < pincers.length; j++) {
          const p2 = pincers[j]!;
          const p2Mask = grid.candidatesOf(p2);
          if (popcount(p2Mask) !== 2) continue;

          // p1 and p2 must not see each other directly to be useful
          // (if they see each other, Z is already eliminated from p1 or p2 by hidden single)
          // But actually pincers CAN see each other in rare degenerate cases — we still proceed.

          // Check XY-Wing pattern:
          // pivot = {X, Y}, p1 = {X, Z}, p2 = {Y, Z} for some Z
          // Or: pivot = {X, Y}, p1 = {Y, Z}, p2 = {X, Z}

          for (const [px, py] of [[x, y], [y, x]] as [number, number][]) {
            // px is shared between pivot and p1, py is shared between pivot and p2
            // p1 must contain px (not py), p2 must contain py (not px)
            if (!(p1Mask & (1 << (px - 1)))) continue;
            if (p1Mask & (1 << (py - 1))) continue; // p1 shouldn't have py
            if (!(p2Mask & (1 << (py - 1)))) continue;
            if (p2Mask & (1 << (px - 1))) continue; // p2 shouldn't have px

            // p1 = {px, z}, p2 = {py, z}
            // Z is the digit in p1 that's not px
            const zCandP1 = digitsOf(p1Mask).find((d) => d !== px);
            const zCandP2 = digitsOf(p2Mask).find((d) => d !== py);
            if (zCandP1 === undefined || zCandP2 === undefined) continue;
            if (zCandP1 !== zCandP2) continue; // must be same Z

            const z = zCandP1;
            const zBit = 1 << (z - 1);

            // Eliminate Z from cells seeing both p1 and p2
            const peersP1 = new Set(PEERS_OF[p1]!);
            const elims: { cell: number; digit: number }[] = [];
            for (const c of PEERS_OF[p2]!) {
              if (!peersP1.has(c)) continue;
              if (c === pivot || c === p1 || c === p2) continue;
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

            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, p1, p2, ...elims.map((e) => e.cell)],
                candidates: [
                  { cell: pivot, digit: px }, { cell: pivot, digit: py },
                  { cell: p1, digit: px }, { cell: p1, digit: z },
                  { cell: p2, digit: py }, { cell: p2, digit: z },
                  ...elims,
                ],
                links: [
                  { from: { cell: pivot, digit: px }, to: { cell: p1, digit: px }, type: 'weak' },
                  { from: { cell: pivot, digit: py }, to: { cell: p2, digit: py }, type: 'weak' },
                ],
              },
              explanation: {
                zh: `XY翼：枢纽格 R${pr}C${pc}（{${px},${py}}）看到翼格 R${p1r}C${p1c}（{${px},${z}}）和 R${p2r}C${p2c}（{${py},${z}}）；可从同时看到两个翼格的格子中消去 ${z}。`,
                en: `XY-Wing: pivot R${pr}C${pc} ({${px},${py}}) sees pincers R${p1r}C${p1c} ({${px},${z}}) and R${p2r}C${p2c} ({${py},${z}}); eliminate ${z} from cells seeing both pincers.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
