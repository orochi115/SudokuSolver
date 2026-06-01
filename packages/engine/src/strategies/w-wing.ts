import { ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 64,

  apply(grid: Grid): Step | null {
    const bivalues: { cell: number; digits: number[] }[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0 && popcount(grid.candidatesOf(i)) === 2) {
        bivalues.push({ cell: i, digits: digitsOf(grid.candidatesOf(i)) });
      }
    }

    for (let i = 0; i < bivalues.length; i++) {
      for (let j = i + 1; j < bivalues.length; j++) {
        const S1 = bivalues[i]!;
        const S2 = bivalues[j]!;

        // Must have the exact same two candidates
        if (
          S1.digits[0] !== S2.digits[0] ||
          S1.digits[1] !== S2.digits[1]
        ) {
          continue;
        }

        const [X_cand, Y_cand] = S1.digits as [number, number];

        // Try both candidates as the bridge digit
        const candidatesToTry = [
          { X: X_cand, Y: Y_cand },
          { X: Y_cand, Y: X_cand },
        ];

        for (const { X, Y } of candidatesToTry) {
          // Look for strong links of X (exactly 2 candidates in a house)
          for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
            const house = HOUSES[hIdx]!;
            const cellsWithX = house.filter((cell) => grid.hasCandidate(cell, X));
            if (cellsWithX.length !== 2) continue;

            const L1 = cellsWithX[0]!;
            const L2 = cellsWithX[1]!;

            // Check if S1 sees L1 and S2 sees L2 (must be distinct cells)
            let match = false;
            let l_mapped_1 = -1;
            let l_mapped_2 = -1;

            if (
              S1.cell !== L1 && S1.cell !== L2 &&
              S2.cell !== L1 && S2.cell !== L2 &&
              PEERS_OF[S1.cell]!.includes(L1) &&
              PEERS_OF[S2.cell]!.includes(L2)
            ) {
              match = true;
              l_mapped_1 = L1;
              l_mapped_2 = L2;
            } else if (
              S1.cell !== L1 && S1.cell !== L2 &&
              S2.cell !== L1 && S2.cell !== L2 &&
              PEERS_OF[S1.cell]!.includes(L2) &&
              PEERS_OF[S2.cell]!.includes(L1)
            ) {
              match = true;
              l_mapped_1 = L2;
              l_mapped_2 = L1;
            }

            if (match) {
              // Check for eliminations of Y in cells seeing both S1 and S2
              const eliminations: { cell: number; digit: number }[] = [];
              for (let c = 0; c < 81; c++) {
                if (
                  grid.hasCandidate(c, Y) &&
                  c !== S1.cell &&
                  c !== S2.cell
                ) {
                  if (PEERS_OF[S1.cell]!.includes(c) && PEERS_OF[S2.cell]!.includes(c)) {
                    eliminations.push({ cell: c, digit: Y });
                  }
                }
              }

              if (eliminations.length > 0) {
                const s1r = ROW_OF[S1.cell]! + 1;
                const s1c = COL_OF[S1.cell]! + 1;
                const s2r = ROW_OF[S2.cell]! + 1;
                const s2c = COL_OF[S2.cell]! + 1;
                const l1r = ROW_OF[l_mapped_1]! + 1;
                const l1c = COL_OF[l_mapped_1]! + 1;
                const l2r = ROW_OF[l_mapped_2]! + 1;
                const l2c = COL_OF[l_mapped_2]! + 1;

                const links: Link[] = [];
                if (S1.cell !== l_mapped_1) {
                  links.push({ from: { cell: S1.cell, digit: X }, to: { cell: l_mapped_1, digit: X }, type: 'weak' });
                }
                links.push({ from: { cell: l_mapped_1, digit: X }, to: { cell: l_mapped_2, digit: X }, type: 'strong' });
                if (S2.cell !== l_mapped_2) {
                  links.push({ from: { cell: l_mapped_2, digit: X }, to: { cell: S2.cell, digit: X }, type: 'weak' });
                }

                let houseDescZh = '';
                if (hIdx < 9) {
                  houseDescZh = `第 ${hIdx + 1} 行`;
                } else if (hIdx < 18) {
                  houseDescZh = `第 ${hIdx - 9 + 1} 列`;
                } else {
                  houseDescZh = `第 ${hIdx - 18 + 1} 宫`;
                }

                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [S1.cell, S2.cell, l_mapped_1, l_mapped_2],
                    candidates: [
                      { cell: S1.cell, digit: X },
                      { cell: S1.cell, digit: Y },
                      { cell: S2.cell, digit: X },
                      { cell: S2.cell, digit: Y },
                      { cell: l_mapped_1, digit: X },
                      { cell: l_mapped_2, digit: X },
                      ...eliminations,
                    ],
                    links,
                  },
                  explanation: {
                    zh: `单元格 R${s1r}C${s1c} 与 R${s2r}C${s2c} 均含候选数 ${X}${Y}。它们通过${houseDescZh}中数字 ${X} 的强链接（R${l1r}C${l1c} = R${l2r}C${l2c}）相连，构成 W翼，因此可以从同时看见两端单元格中排除候选数 ${Y}。`,
                    en: `Cells R${s1r}C${s1c} and R${s2r}C${s2c} both contain {${X}, ${Y}} and are bridged by a strong link of ${X} in the house between R${l1r}C${l1c} and R${l2r}C${l2c}, forming a W-Wing. We can eliminate candidate ${Y} from cells seeing both.`,
                  },
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};
