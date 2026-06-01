/**
 * XYZ-Wing (T3) — XYZ翼.
 *
 * A trivalue pivot {X,Y,Z} plus two bivalue pincers {X,Z} and {Y,Z}, both seen
 * by the pivot. The digit Z must appear in the pivot or one of the pincers, so
 * any cell seeing ALL THREE (pivot + both pincers) cannot be Z.
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

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 55,

  apply(grid: Grid): Step | null {
    const bivalue: number[] = [];
    const trivalue: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const pc = popcount(grid.candidatesOf(c));
      if (pc === 2) bivalue.push(c);
      else if (pc === 3) trivalue.push(c);
    }

    for (const pivot of trivalue) {
      const pivotMask = grid.candidatesOf(pivot);
      const pincers = bivalue.filter((c) => sees(pivot, c) && (grid.candidatesOf(c) & ~pivotMask) === 0);
      // Each pincer's 2 candidates must be a subset of the pivot's 3.

      for (let i = 0; i < pincers.length; i++) {
        for (let j = i + 1; j < pincers.length; j++) {
          const p1 = pincers[i]!;
          const p2 = pincers[j]!;
          const m1 = grid.candidatesOf(p1);
          const m2 = grid.candidatesOf(p2);
          // Union of the two pincers must equal the pivot (all of X,Y,Z covered),
          // and their intersection is exactly {Z}.
          if ((m1 | m2) !== pivotMask) continue;
          const zMask = m1 & m2;
          if (popcount(zMask) !== 1) continue;
          const z = digitsOf(zMask)[0]!;

          // Z must also be a candidate of the pivot (it is, since union==pivot).
          if (!grid.hasCandidate(pivot, z)) continue;

          // Targets see pivot AND both pincers.
          const targets = commonPeers([pivot, p1, p2]);
          const elims: CellDigit[] = [];
          for (const t of targets) {
            if (grid.get(t) === 0 && grid.hasCandidate(t, z)) elims.push({ cell: t, digit: z });
          }
          if (elims.length === 0) continue;

          const pivotDigits = digitsOf(pivotMask);
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [pivot, p1, p2],
              candidates: [
                ...digitsOf(pivotMask).map((d) => ({ cell: pivot, digit: d })),
                ...digitsOf(m1).map((d) => ({ cell: p1, digit: d })),
                ...digitsOf(m2).map((d) => ({ cell: p2, digit: d })),
              ],
              links: [],
            },
            explanation: {
              zh: `XYZ翼：枢轴 ${cellLabel(pivot)}{${pivotDigits.join(',')}}，两翼 ${cellLabel(p1)} 与 ${cellLabel(p2)} 的公共候选为 ${z}；${z} 必在枢轴或某翼出现，故同时可见三者的格中可排除 ${z}。`,
              en: `XYZ-Wing: pivot ${cellLabel(pivot)}{${pivotDigits.join(',')}}, pincers ${cellLabel(p1)} and ${cellLabel(p2)} share ${z}; ${z} must occur in the pivot or a pincer, so cells seeing all three can drop ${z}.`,
            },
          };
        }
      }
    }
    return null;
  },
};
