import { CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 46, // Suggested cost band: 50 wings, XYZ-Wing is standard T3 difficulty

  apply(grid: Grid): Step | null {
    const trivalueCells: number[] = [];
    const bivalueCells: number[] = [];

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const count = popcount(grid.candidatesOf(c));
        if (count === 3) {
          trivalueCells.push(c);
        } else if (count === 2) {
          bivalueCells.push(c);
        }
      }
    }

    for (const pivot of trivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask); // [x, y, z]

      // Find bivalue peers of pivot
      const bivaluePeers = bivalueCells.filter(c => PEERS_OF[pivot]!.includes(c));
      if (bivaluePeers.length < 2) continue;

      for (let i = 0; i < bivaluePeers.length; i++) {
        const p1 = bivaluePeers[i]!;
        const p1Digits = digitsOf(grid.candidatesOf(p1)); // e.g. [x, z]

        for (let j = i + 1; j < bivaluePeers.length; j++) {
          const p2 = bivaluePeers[j]!;
          const p2Digits = digitsOf(grid.candidatesOf(p2)); // e.g. [y, z]

          // Find the common digit z between p1 and p2
          const common = p1Digits.filter(d => p2Digits.includes(d));
          if (common.length !== 1) continue;
          const z = common[0]!;

          // z must be in pivot digits
          if (!pivotDigits.includes(z)) continue;

          // The other digits of p1 and p2 (x and y) must be in pivot
          const x = p1Digits.find(d => d !== z)!;
          const y = p2Digits.find(d => d !== z)!;

          if (x === undefined || y === undefined || x === y) continue;
          if (!pivotDigits.includes(x) || !pivotDigits.includes(y)) continue;

          // We have a valid XYZ-Wing with pivot and p1, p2!
          // Find any cell that sees pivot, p1, and p2 and has candidate z
          const eliminations: CellDigit[] = [];
          for (let cell = 0; cell < CELLS; cell++) {
            if (
              cell !== pivot &&
              cell !== p1 &&
              cell !== p2 &&
              grid.get(cell) === 0 &&
              PEERS_OF[pivot]!.includes(cell) &&
              PEERS_OF[p1]!.includes(cell) &&
              PEERS_OF[p2]!.includes(cell) &&
              grid.hasCandidate(cell, z)
            ) {
              eliminations.push({ cell, digit: z });
            }
          }

          if (eliminations.length > 0) {
            const r_pivot = ROW_OF[pivot]! + 1;
            const c_pivot = COL_OF[pivot]! + 1;
            const r_p1 = ROW_OF[p1]! + 1;
            const c_p1 = COL_OF[p1]! + 1;
            const r_p2 = ROW_OF[p2]! + 1;
            const c_p2 = COL_OF[p2]! + 1;

            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot, p1, p2],
                candidates: [
                  ...pivotDigits.map(d => ({ cell: pivot, digit: d })),
                  ...p1Digits.map(d => ({ cell: p1, digit: d })),
                  ...p2Digits.map(d => ({ cell: p2, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `格子 R${r_pivot}C${c_pivot} ({${x}, ${y}, ${z}}) 作为枢轴格，连接 R${r_p1}C${c_p1} ({${x}, ${z}}) 和 R${r_p2}C${c_p2} ({${y}, ${z}}) 两个同盟格（XYZ翼）。因此可从它们共同可见的格子中排除共同候选数 ${z}。`,
                en: `Cell R${r_pivot}C${c_pivot} ({${x}, ${y}, ${z}}) acts as pivot, connecting pincers R${r_p1}C${c_p1} ({${x}, ${z}}) and R${r_p2}C${c_p2} ({${y}, ${z}}) (XYZ-Wing). Thus, ${z} can be eliminated from cells seeing pivot and both pincers.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};
