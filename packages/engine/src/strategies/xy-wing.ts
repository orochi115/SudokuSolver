/**
 * XY-Wing (Y-Wing) (T3) — XY翼.
 *
 * Three bivalue cells: a pivot with candidates {X,Y}, and two pincers that the
 * pivot sees, with candidates {X,Z} and {Y,Z}. Whichever digit the pivot takes,
 * one pincer becomes Z — so any cell seeing BOTH pincers cannot be Z.
 */

import {
  CELLS,
  popcount,
  digitsOf,
  maskOf,
  sees,
  commonPeers,
  cellLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const bivalue: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
    }

    for (const pivot of bivalue) {
      const [x, y] = digitsOf(grid.candidatesOf(pivot)) as [number, number];
      // Pincers must be bivalue cells the pivot sees.
      const seen = bivalue.filter((c) => c !== pivot && sees(pivot, c));

      for (const p1 of seen) {
        const m1 = grid.candidatesOf(p1);
        // p1 = {X, Z}: contains exactly one of {x,y}.
        for (const p2 of seen) {
          if (p2 <= p1) continue;
          const m2 = grid.candidatesOf(p2);

          // Identify which pivot digit each pincer shares.
          // We require: {p1} = {a, z}, {p2} = {b, z} where {a,b} = {x,y}, z ∉ {x,y}.
          for (const [a, b] of [[x, y], [y, x]] as const) {
            if (!(grid.hasCandidate(p1, a))) continue;
            const zMask1 = m1 & ~maskOf(a);
            if (popcount(zMask1) !== 1) continue;
            const z = digitsOf(zMask1)[0]!;
            if (z === x || z === y) continue;
            // p2 must be {b, z}
            if (!grid.hasCandidate(p2, b)) continue;
            if (m2 !== (maskOf(b) | maskOf(z))) continue;

            // Eliminate z from cells seeing both pincers.
            const targets = commonPeers([p1, p2]).filter((c) => c !== pivot);
            const elims: CellDigit[] = [];
            for (const t of targets) {
              if (grid.get(t) === 0 && grid.hasCandidate(t, z)) elims.push({ cell: t, digit: z });
            }
            if (elims.length === 0) continue;

            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, p1, p2],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: p1, digit: a },
                  { cell: p1, digit: z },
                  { cell: p2, digit: b },
                  { cell: p2, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `XY翼：枢轴 ${cellLabel(pivot)}{${x},${y}}，两翼 ${cellLabel(p1)}{${a},${z}} 与 ${cellLabel(p2)}{${b},${z}}；无论枢轴取何值，必有一翼为 ${z}，故同时可见两翼的格中可排除 ${z}。`,
                en: `XY-Wing: pivot ${cellLabel(pivot)}{${x},${y}}, pincers ${cellLabel(p1)}{${a},${z}} and ${cellLabel(p2)}{${b},${z}}; one pincer must be ${z}, so cells seeing both can drop ${z}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
