import { ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    const bivalues: { cell: number; digits: number[] }[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0 && popcount(grid.candidatesOf(i)) === 2) {
        bivalues.push({ cell: i, digits: digitsOf(grid.candidatesOf(i)) });
      }
    }

    for (const P of bivalues) {
      const [X, Y] = P.digits as [number, number];
      const peersOfP = PEERS_OF[P.cell]!;

      const possibleA = bivalues.filter(
        (item) => peersOfP.includes(item.cell) && item.digits.includes(X) && !item.digits.includes(Y)
      );
      const possibleB = bivalues.filter(
        (item) => peersOfP.includes(item.cell) && item.digits.includes(Y) && !item.digits.includes(X)
      );

      for (const A of possibleA) {
        const Z_A = A.digits.find((d) => d !== X)!;

        for (const B of possibleB) {
          const Z_B = B.digits.find((d) => d !== Y)!;

          if (Z_A === Z_B) {
            const Z = Z_A;

            // Found potential XY-Wing. Check for eliminations
            const eliminations: { cell: number; digit: number }[] = [];
            for (let c = 0; c < 81; c++) {
              if (
                grid.hasCandidate(c, Z) &&
                c !== P.cell &&
                c !== A.cell &&
                c !== B.cell
              ) {
                if (PEERS_OF[A.cell]!.includes(c) && PEERS_OF[B.cell]!.includes(c)) {
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

              const links: Link[] = [
                { from: { cell: P.cell, digit: X }, to: { cell: A.cell, digit: X }, type: 'weak' },
                { from: { cell: P.cell, digit: Y }, to: { cell: B.cell, digit: Y }, type: 'weak' },
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [P.cell, A.cell, B.cell],
                  candidates: [
                    { cell: P.cell, digit: X },
                    { cell: P.cell, digit: Y },
                    { cell: A.cell, digit: X },
                    { cell: A.cell, digit: Z },
                    { cell: B.cell, digit: Y },
                    { cell: B.cell, digit: Z },
                    ...eliminations,
                  ],
                  links,
                },
                explanation: {
                  zh: `以 R${pr}C${pc}（候选数 ${X}${Y}）为枢轴，R${ar}C${ac}（候选数 ${X}${Z}）和 R${br}C${bc}（候选数 ${Y}${Z}）为钳子，构成 XY翼。不论枢轴填入 ${X} 还是 ${Y}，两个钳子之一必为 ${Z}，因此可以排除同时看见两个钳子的单元格中的候选数 ${Z}。`,
                  en: `With pivot R${pr}C${pc} ({${X}, ${Y}}) and pincers R${ar}C${ac} ({${X}, ${Z}}) and R${br}C${bc} ({${Y}, ${Z}}), forms an XY-Wing. One of the pincers must be ${Z}, so we can eliminate candidate ${Z} from cells seeing both pincers.`,
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
