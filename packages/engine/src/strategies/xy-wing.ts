import { CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 45, // Suggested cost band: 50 wings, XY-Wing is standard T3 difficulty

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    for (const pivot of bivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const [x, y] = digitsOf(pivotMask);
      if (x === undefined || y === undefined) continue;

      const peersOfPivot = bivalueCells.filter(c => c !== pivot && PEERS_OF[pivot]!.includes(c));

      for (let i = 0; i < peersOfPivot.length; i++) {
        const p1 = peersOfPivot[i]!;
        const p1Mask = grid.candidatesOf(p1);
        const p1Digits = digitsOf(p1Mask);

        for (let j = i + 1; j < peersOfPivot.length; j++) {
          const p2 = peersOfPivot[j]!;
          const p2Mask = grid.candidatesOf(p2);
          const p2Digits = digitsOf(p2Mask);

          // We want pivot to be {x, y}
          // We want p1 to be {x, z} and p2 to be {y, z} (or vice versa)
          // So the union of pivot, p1, p2 candidates must have exactly 3 digits: x, y, z
          const unionMask = pivotMask | p1Mask | p2Mask;
          if (popcount(unionMask) !== 3) continue;

          const allDigits = digitsOf(unionMask);
          const zArr = allDigits.filter(d => d !== x && d !== y);
          if (zArr.length !== 1) continue;
          const z = zArr[0]!;

          // Check if p1 has {x, z} and p2 has {y, z}, or vice versa
          const hasX = p1Digits.includes(x) || p2Digits.includes(x);
          const hasY = p1Digits.includes(y) || p2Digits.includes(y);
          const p1HasZ = p1Digits.includes(z);
          const p2HasZ = p2Digits.includes(z);

          if (hasX && hasY && p1HasZ && p2HasZ) {
            // Find cells seeing both p1 and p2 (excluding pivot and p1, p2 themselves)
            const eliminations: CellDigit[] = [];
            for (let cell = 0; cell < CELLS; cell++) {
              if (
                cell !== pivot &&
                cell !== p1 &&
                cell !== p2 &&
                grid.get(cell) === 0 &&
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
                    { cell: pivot, digit: x },
                    { cell: pivot, digit: y },
                    ...p1Digits.map(d => ({ cell: p1, digit: d })),
                    ...p2Digits.map(d => ({ cell: p2, digit: d })),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `格子 R${r_pivot}C${c_pivot} ({${x}, ${y}}) 作为枢轴格，连接 R${r_p1}C${c_p1} 和 R${r_p2}C${c_p2} 两个同盟格（XY翼），共享候选数 ${z}。因此可从它们共同可见的格子中排除候选数 ${z}。`,
                  en: `Cell R${r_pivot}C${c_pivot} ({${x}, ${y}}) acts as pivot, connecting pincers R${r_p1}C${c_p1} and R${r_p2}C${c_p2} (XY-Wing) with shared candidate ${z}. Thus, ${z} can be eliminated from cells seeing both pincers.`,
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
