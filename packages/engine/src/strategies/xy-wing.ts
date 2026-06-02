/**
 * T3: XY-Wing (Y-Wing).
 *
 * Pivot {X,Y} sees two pincers {X,Z} and {Y,Z}. Candidate Z is removed from
 * any cell that sees both pincers.
 */

import { PEERS_OF, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'xy-wing';

export const xyWing: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) {
        bivalueCells.push(cell);
      }
    }

    for (const pivot of bivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask);
      const x = pivotDigits[0]!;
      const y = pivotDigits[1]!;

      const peers = PEERS_OF[pivot]!;

      for (const p1 of peers) {
        if (grid.get(p1) !== 0) continue;
        const mask1 = grid.candidatesOf(p1);
        if (popcount(mask1) !== 2) continue;
        const [a, b] = digitsOf(mask1) as [number, number];

        let z = -1;
        if (a === x && b !== y) z = b;
        else if (b === x && a !== y) z = a;
        if (z === -1) continue;

        for (const p2 of peers) {
          if (p2 === p1 || p2 === pivot) continue;
          if (grid.get(p2) !== 0) continue;
          const mask2 = grid.candidatesOf(p2);
          if (popcount(mask2) !== 2) continue;
          const [c, d] = digitsOf(mask2) as [number, number];

          if ((c === y && d === z) || (d === y && c === z)) {
            const elims: { cell: number; digit: number }[] = [];
            for (const cell of PEERS_OF[p1]!) {
              if (grid.values[cell] === 0 && PEERS_OF[p2]!.includes(cell)) {
                if (grid.hasCandidate(cell, z)) {
                  elims.push({ cell, digit: z });
                }
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
                    { cell: p1, digit: x },
                    { cell: p1, digit: z },
                    { cell: p2, digit: y },
                    { cell: p2, digit: z },
                  ],
                  links: [],
                },
                explanation: {
                  zh: `枢轴格 R${pr}C${pc} 包含 {${x},${y}}，看见两个钳子格 R${p1r}C${p1c} {${x},${z}} 和 R${p2r}C${p2c} {${y},${z}}，数字 ${z} 不能同时存在于两个钳子格，因此消去两端共同可见格的 ${z}（XY翼）。`,
                  en: `Pivot R${pr}C${pc} has {${x},${y}} and sees pincers R${p1r}C${p1c} {${x},${z}} and R${p2r}C${p2c} {${y},${z}}. Candidate ${z} is eliminated from cells seeing both pincers (XY-Wing).`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
