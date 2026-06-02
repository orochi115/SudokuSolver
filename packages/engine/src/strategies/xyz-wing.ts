/**
 * T3: XYZ-Wing.
 *
 * Pivot {X,Y,Z} sees two pincers {X,Z} and {Y,Z}. Candidate Z is removed from
 * any cell that sees both pincers.
 *
 * IMPORTANT: This only works when pivot does NOT contain Z. If pivot has Z,
 * the XYZ-wing logic doesn't apply (the chain breaks).
 */

import { PEERS_OF, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'xyz-wing';

export const xyzWing: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const trivalueCells: number[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 3) {
        trivalueCells.push(cell);
      }
    }

    for (const pivot of trivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask);
      const x = pivotDigits[0]!;
      const y = pivotDigits[1]!;
      const z = pivotDigits[2]!;

      // XYZ-wing requires pivot does NOT contain z (otherwise the chain breaks)
      if ((pivotMask & (1 << (z - 1))) !== 0) continue;

      const peers = PEERS_OF[pivot]!;

      for (const p1 of peers) {
        if (grid.get(p1) !== 0) continue;
        const mask1 = grid.candidatesOf(p1);
        if (popcount(mask1) !== 2) continue;
        const [a, b] = digitsOf(mask1) as [number, number];

        // p1 must be {x, z}
        const p1IsXZ = (a === x && b === z) || (a === z && b === x);
        if (!p1IsXZ) continue;

        for (const p2 of peers) {
          if (p2 === p1 || p2 === pivot) continue;
          if (grid.get(p2) !== 0) continue;
          const mask2 = grid.candidatesOf(p2);
          if (popcount(mask2) !== 2) continue;
          const [c, d] = digitsOf(mask2) as [number, number];

          // p2 must be {y, z}
          const p2IsYZ = (c === y && d === z) || (c === z && d === y);
          if (!p2IsYZ) continue;

          // Valid XYZ-Wing found: eliminate z from cells seeing both wings
          const elims: { cell: number; digit: number }[] = [];
          for (const cell of PEERS_OF[p1]!) {
            if (cell === pivot || cell === p1 || cell === p2) continue;
            if (PEERS_OF[p2]!.includes(cell) && grid.values[cell] === 0 && grid.hasCandidate(cell, z)) {
              elims.push({ cell, digit: z });
            }
          }

          if (elims.length > 0) {
            const pr = ROW_OF[pivot]! + 1;
            const pc = COL_OF[pivot]! + 1;
            const p1r = ROW_OF[p1]! + 1;
            const p1c = COL_OF[p1]! + 1;
            const p2r = ROW_OF[p2]! + 1;
            const p2c = COL_OF[p2]! + 1;
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, p1, p2],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: pivot, digit: z },
                  { cell: p1, digit: x },
                  { cell: p1, digit: z },
                  { cell: p2, digit: y },
                  { cell: p2, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `枢轴格 R${pr}C${pc} 包含 {${x},${y},${z}}，看见两个钳子格 R${p1r}C${p1c} {${x},${z}} 和 R${p2r}C${p2c} {${y},${z}}，消去同时看见两钳子格的候选 ${z}（XYZ翼）。`,
                en: `Pivot R${pr}C${pc} has {${x},${y},${z}} and sees pincers R${p1r}C${p1c} {${x},${z}} and R${p2r}C${p2c} {${y},${z}}. Candidate ${z} is eliminated from cells seeing both pincers (XYZ-Wing).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};