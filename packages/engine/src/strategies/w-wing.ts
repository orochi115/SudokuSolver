import { CELLS, ROW_OF, COL_OF, PEERS_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 48, // Suggested cost band: 50 wings, W-Wing is standard T3 difficulty

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    if (bivalueCells.length < 2) return null;

    for (let i = 0; i < bivalueCells.length; i++) {
      const W1 = bivalueCells[i]!;
      const mask1 = grid.candidatesOf(W1);
      const [d1, d2] = digitsOf(mask1);
      if (d1 === undefined || d2 === undefined) continue;

      for (let j = i + 1; j < bivalueCells.length; j++) {
        const W2 = bivalueCells[j]!;
        const mask2 = grid.candidatesOf(W2);

        if (mask1 !== mask2) continue; // Must be identical bivalue cells
        if (PEERS_OF[W1]!.includes(W2)) continue; // Must not see each other directly

        // We try d1 as the bridge digit, and d2 as the bridge digit
        const pairs = [
          { x: d1, y: d2 },
          { x: d2, y: d1 },
        ];

        for (const { x, y } of pairs) {
          // Search for a house with a strong link on digit x
          for (const house of HOUSES) {
            const possibleS = house.filter(c => grid.get(c) === 0 && grid.hasCandidate(c, x));
            if (possibleS.length !== 2) continue; // Must be a strong link on x

            const [S1, S2] = possibleS as [number, number];

            // W1 must see S1, and W2 must see S2 (or vice-versa)
            let match = false;
            let bridge1 = S1;
            let bridge2 = S2;

            if (PEERS_OF[W1]!.includes(S1) && PEERS_OF[W2]!.includes(S2) && W1 !== S1 && W2 !== S2) {
              match = true;
            } else if (PEERS_OF[W1]!.includes(S2) && PEERS_OF[W2]!.includes(S1) && W1 !== S2 && W2 !== S1) {
              match = true;
              bridge1 = S2;
              bridge2 = S1;
            }

            if (match) {
              // Find any cells E that see both W1 and W2 and have candidate y
              const eliminations: CellDigit[] = [];
              for (let cell = 0; cell < CELLS; cell++) {
                if (
                  cell !== W1 &&
                  cell !== W2 &&
                  grid.get(cell) === 0 &&
                  PEERS_OF[W1]!.includes(cell) &&
                  PEERS_OF[W2]!.includes(cell) &&
                  grid.hasCandidate(cell, y)
                ) {
                  eliminations.push({ cell, digit: y });
                }
              }

              if (eliminations.length > 0) {
                const r1 = ROW_OF[W1]! + 1;
                const c1 = COL_OF[W1]! + 1;
                const r2 = ROW_OF[W2]! + 1;
                const c2 = COL_OF[W2]! + 1;

                const links = [
                  { from: { cell: W1, digit: y }, to: { cell: W1, digit: x }, type: 'weak' as const },
                  { from: { cell: W1, digit: x }, to: { cell: bridge1, digit: x }, type: 'weak' as const },
                  { from: { cell: bridge1, digit: x }, to: { cell: bridge2, digit: x }, type: 'strong' as const },
                  { from: { cell: bridge2, digit: x }, to: { cell: W2, digit: x }, type: 'weak' as const },
                  { from: { cell: W2, digit: x }, to: { cell: W2, digit: y }, type: 'weak' as const },
                ];

                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [W1, W2, bridge1, bridge2],
                    candidates: [
                      { cell: W1, digit: x },
                      { cell: W1, digit: y },
                      { cell: W2, digit: x },
                      { cell: W2, digit: y },
                      { cell: bridge1, digit: x },
                      { cell: bridge2, digit: x },
                    ],
                    links,
                  },
                  explanation: {
                    zh: `格子 R${r1}C${c1} 和 R${r2}C${c2} 的候选数均为 {${x}, ${y}}。在其他区域中存在对候选数 ${x} 的强强联结（在同一单元内只有两个）。这构成 W翼。因此可排除它们共同可见的格子中的候选数 ${y}。`,
                    en: `Cells R${r1}C${c1} and R${r2}C${c2} both contain {${x}, ${y}}. There is a strong link for candidate ${x} acting as a bridge. This forms a W-Wing, eliminating candidate ${y} from cells seeing both wings.`,
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
