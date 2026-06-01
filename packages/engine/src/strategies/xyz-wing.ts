/**
 * T3: XYZ-Wing.
 *
 * Pivot {X,Y,Z} sees pincer1 {X,Z} and pincer2 {Y,Z}. Candidate Z is removed
 * from any cell that sees the pivot AND both pincers.
 */

import { PEERS_OF, popcount, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

    for (const pivot of emptyCells) {
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;

      const digits = digitsOf(pivotMask);
      const x = digits[0]!;
      const y = digits[1]!;
      const z = digits[2]!;
      const pivotPeers = PEERS_OF[pivot]!;

      const pincerXZ = pivotPeers.find((c) => {
        if (grid.get(c) !== 0) return false;
        const m = grid.candidatesOf(c);
        return popcount(m) === 2 && ((m & maskOf(x)) !== 0) && ((m & maskOf(z)) !== 0);
      });
      if (pincerXZ === undefined) continue;

      const pincerYZ = pivotPeers.find((c) => {
        if (c === pincerXZ || grid.get(c) !== 0) return false;
        const m = grid.candidatesOf(c);
        return popcount(m) === 2 && ((m & maskOf(y)) !== 0) && ((m & maskOf(z)) !== 0);
      });
      if (pincerYZ === undefined) continue;

      const pincerXZPeers = new Set(PEERS_OF[pincerXZ]!);
      const pincerYZPeers = new Set(PEERS_OF[pincerYZ]!);
      const eliminations: { cell: number; digit: number }[] = [];
      for (const cell of emptyCells) {
        if (cell === pivot || cell === pincerXZ || cell === pincerYZ) continue;
        if (pincerXZPeers.has(cell) && pincerYZPeers.has(cell) && pivotPeers.includes(cell)) {
          if (grid.hasCandidate(cell, z)) {
            eliminations.push({ cell, digit: z });
          }
        }
      }
      if (eliminations.length > 0) {
        const pr = Math.floor(pivot / 9) + 1;
        const pc = (pivot % 9) + 1;
        const xzr = Math.floor(pincerXZ / 9) + 1;
        const xzc = (pincerXZ % 9) + 1;
        const yzr = Math.floor(pincerYZ / 9) + 1;
        const yzc = (pincerYZ % 9) + 1;
        return {
          strategyId: this.id,
          placements: [],
          eliminations,
          highlights: {
            cells: [pivot, pincerXZ, pincerYZ],
            candidates: [
              { cell: pivot, digit: x }, { cell: pivot, digit: y }, { cell: pivot, digit: z },
              { cell: pincerXZ, digit: x }, { cell: pincerXZ, digit: z },
              { cell: pincerYZ, digit: y }, { cell: pincerYZ, digit: z },
            ],
            links: [],
          },
          explanation: {
            zh: `R${pr}C${pc} 为轴心格(XYZ)，R${xzr}C${xzc} 与 R${yzr}C${yzc} 为铰链格，消去三格共同影响格的 ${z}（XYZ翼）。`,
            en: `Pivot R${pr}C${pc} (XYZ) with pincers R${xzr}C${xzc} and R${yzr}C${yzc}; eliminate ${z} from cells seeing all three (XYZ-Wing).`,
          },
        };
      }
    }
    return null;
  },
};