/**
 * T3: XY-Wing (Y-Wing).
 *
 * Pivot {X,Y} sees pincers {X,Z} and {Y,Z}. Candidate Z is removed from any
 * cell that sees both pincers.
 */

import { PEERS_OF, popcount, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

    for (const pivot of emptyCells) {
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 2) continue;

      const digits = digitsOf(pivotMask);
      const x = digits[0]!;
      const y = digits[1]!;
      const pivotPeers = PEERS_OF[pivot]!;

      const pincer1Cells = pivotPeers.filter((c) => {
        if (grid.get(c) !== 0) return false;
        const m = grid.candidatesOf(c);
        return popcount(m) === 2 && ((m & maskOf(x)) !== 0) && ((m & maskOf(y)) !== 0);
      });

      for (const pincer1 of pincer1Cells) {
        const m1 = grid.candidatesOf(pincer1);
        const d1 = digitsOf(m1);
        const z = d1[0] === x ? d1[1]! : d1[0]!;

        const pincer2Cells = pivotPeers.filter((c) => {
          if (c === pincer1 || grid.get(c) !== 0) return false;
          const m = grid.candidatesOf(c);
          return popcount(m) === 2 && ((m & maskOf(y)) !== 0) && ((m & maskOf(z)) !== 0);
        });

        for (const pincer2 of pincer2Cells) {
          const pincer1Peers = new Set(PEERS_OF[pincer1]!);
          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of emptyCells) {
            if (cell === pivot || cell === pincer1 || cell === pincer2) continue;
            if (pincer1Peers.has(cell) && PEERS_OF[pivot]!.includes(cell)) {
              if (grid.hasCandidate(cell, z)) {
                eliminations.push({ cell, digit: z });
              }
            }
          }
          if (eliminations.length > 0) {
            const pr = Math.floor(pivot / 9) + 1;
            const pc = (pivot % 9) + 1;
            const p1r = Math.floor(pincer1 / 9) + 1;
            const p1c = (pincer1 % 9) + 1;
            const p2r = Math.floor(pincer2 / 9) + 1;
            const p2c = (pincer2 % 9) + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot, pincer1, pincer2],
                candidates: [
                  { cell: pivot, digit: x }, { cell: pivot, digit: y },
                  { cell: pincer1, digit: x }, { cell: pincer1, digit: z },
                  { cell: pincer2, digit: y }, { cell: pincer2, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `R${pr}C${pc} 为轴心格(XY)，R${p1r}C${p1c} 与 R${p2r}C${p2c} 为铰链格，消去两铰链共同影响格的 ${z}（XY翼）。`,
                en: `Pivot R${pr}C${pc} (XY) with pincers R${p1r}C${p1c} and R${p2r}C${p2c}; eliminate ${z} from cells seeing both pincers (XY-Wing).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};