import { ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 62,

  apply(grid: Grid): Step | null {
    const trivalues: { cell: number; digits: number[] }[] = [];
    const bivalues: { cell: number; digits: number[] }[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0) {
        const count = popcount(grid.candidatesOf(i));
        if (count === 3) {
          trivalues.push({ cell: i, digits: digitsOf(grid.candidatesOf(i)) });
        } else if (count === 2) {
          bivalues.push({ cell: i, digits: digitsOf(grid.candidatesOf(i)) });
        }
      }
    }

    for (const P of trivalues) {
      const peersOfP = PEERS_OF[P.cell]!;

      // Try each of the 3 digits as Z (the shared digit)
      for (let zIdx = 0; zIdx < 3; zIdx++) {
        const Z = P.digits[zIdx]!;
        const X = P.digits[(zIdx + 1) % 3]!;
        const Y = P.digits[(zIdx + 2) % 3]!;

        const possibleA = bivalues.filter(
          (item) => peersOfP.includes(item.cell) && item.digits.includes(X) && item.digits.includes(Z)
        );
        const possibleB = bivalues.filter(
          (item) => peersOfP.includes(item.cell) && item.digits.includes(Y) && item.digits.includes(Z)
        );

        for (const A of possibleA) {
          for (const B of possibleB) {
            const eliminations: { cell: number; digit: number }[] = [];

            for (let c = 0; c < 81; c++) {
              if (
                grid.hasCandidate(c, Z) &&
                c !== P.cell &&
                c !== A.cell &&
                c !== B.cell
              ) {
                if (
                  peersOfP.includes(c) &&
                  PEERS_OF[A.cell]!.includes(c) &&
                  PEERS_OF[B.cell]!.includes(c)
                ) {
                  eliminations.push({ cell: c, digit: Z });
                }
              }
            }

            if (eliminations.length > 0) {
              const pr = ROW_OF[P.cell]! + 1;
              const pc = COL_OF[P.cell]! + 1;
              const ar = ROW_OF[A.cell]! + 1;
              const ac = COL_OF[A.cell]! + 1;
              const br = ROW_OF[B.cell]! + 1;
              const bc = COL_OF[B.cell]! + 1;

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [P.cell, A.cell, B.cell],
                  candidates: [
                    { cell: P.cell, digit: X },
                    { cell: P.cell, digit: Y },
                    { cell: P.cell, digit: Z },
                    { cell: A.cell, digit: X },
                    { cell: A.cell, digit: Z },
                    { cell: B.cell, digit: Y },
                    { cell: B.cell, digit: Z },
                    ...eliminations,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `以 R${pr}C${pc}（候选数 ${X}${Y}${Z}）为枢轴，R${ar}C${ac}（候选数 ${X}${Z}）和 R${br}C${bc}（候选数 ${Y}${Z}）为钳子，构成 XYZ翼。不论枢轴填入何值，三者之一必为 ${Z}，因此可以排除同时看见三者的单元格中的候选数 ${Z}。`,
                  en: `With pivot R${pr}C${pc} ({${X}, ${Y}, ${Z}}) and pincers R${ar}C${ac} ({${X}, ${Z}}) and R${br}C${bc} ({${Y}, ${Z}}), forms an XYZ-Wing. One of the three must be ${Z}, so we can eliminate candidate ${Z} from cells seeing all three.`,
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
