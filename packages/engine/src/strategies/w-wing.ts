/**
 * T3: W-Wing.
 *
 * Two bivalue cells with the same pair {X,Y} are bridged by a strong link on
 * digit X. The other digit Y is eliminated from cells that see both bivalue cells.
 */

import { HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'w-wing';

export const wWing: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) {
        bivalueCells.push(cell);
      }
    }

    const byMask = new Map<number, number[]>();
    for (const cell of bivalueCells) {
      const mask = grid.candidatesOf(cell);
      if (!byMask.has(mask)) byMask.set(mask, []);
      byMask.get(mask)!.push(cell);
    }

    for (const [mask, cells] of byMask) {
      if (cells.length < 2) continue;
      const digits = digitsOf(mask);
      const x = digits[0]!;
      const y = digits[1]!;

      for (let i = 0; i < cells.length - 1; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const c1 = cells[i]!;
          const c2 = cells[j]!;

          let hasStrongLink = false;
          for (const house of HOUSES) {
            if (!house.includes(c1) || !house.includes(c2)) continue;
            let count = 0;
            for (const cell of house) {
              if (grid.values[cell] === 0 && (grid.candidates[cell]! & maskOf(x))) count++;
            }
            if (count === 2) {
              hasStrongLink = true;
              break;
            }
          }

          if (!hasStrongLink) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (const cell of PEERS_OF[c1]!) {
            if (cell === c2) continue;
            if (grid.values[cell] === 0 && PEERS_OF[c2]!.includes(cell)) {
              if (grid.hasCandidate(cell, y)) {
                elims.push({ cell, digit: y });
              }
            }
          }

          if (elims.length > 0) {
            const c1r = ROW_OF[c1]! + 1;
            const c1c = COL_OF[c1]! + 1;
            const c2r = ROW_OF[c2]! + 1;
            const c2c = COL_OF[c2]! + 1;
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [c1, c2],
                candidates: [
                  { cell: c1, digit: x },
                  { cell: c1, digit: y },
                  { cell: c2, digit: x },
                  { cell: c2, digit: y },
                ],
                links: [],
              },
              explanation: {
                zh: `两格 R${c1r}C${c1c} 和 R${c2r}C${c2c} 都只包含 {${x},${y}}，且数字 ${x} 在某单元中形成强链，消去同时被两格可见的候选 ${y}（W翼）。`,
                en: `Cells R${c1r}C${c1c} and R${c2r}C${c2c} both have {${x},${y}} and digit ${x} forms a strong link between them. Candidate ${y} is eliminated from cells seeing both bivalue cells (W-Wing).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
