import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // We search over all box + line pairs
    for (let b = 0; b < 9; b++) {
      const boxCells = HOUSES[18 + b]!;
      for (let l = 0; l < 18; l++) {
        const lineCells = HOUSES[l]!;

        // Check if they intersect (share at least one cell)
        const hasIntersection = boxCells.some(c => lineCells.includes(c));
        if (!hasIntersection) continue;

        // Union of unfilled cells in both
        const unionCells = [...new Set([...boxCells, ...lineCells])].filter(
          c => grid.get(c) === 0
        );

        if (unionCells.length < 4) continue;

        // Generate combinations of size 4 from unionCells
        const n = unionCells.length;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
              for (let m = k + 1; m < n; m++) {
                const c1 = unionCells[i]!;
                const c2 = unionCells[j]!;
                const c3 = unionCells[k]!;
                const c4 = unionCells[m]!;

                const combo = [c1, c2, c3, c4];

                // Union of candidate digits
                let digitMask = 0;
                for (const c of combo) {
                  digitMask |= grid.candidatesOf(c);
                }

                if (popcount(digitMask) !== 4) continue;

                const ds = digitsOf(digitMask);
                let nonRestrictedDigit: number | null = null;
                let nonRestrictedCount = 0;

                for (const d of ds) {
                  const dBit = maskOf(d);
                  const dCells = combo.filter(c => (grid.candidatesOf(c) & dBit) !== 0);

                  // Check if pairwise see each other
                  let restricted = true;
                  for (let x = 0; x < dCells.length; x++) {
                    for (let y = x + 1; y < dCells.length; y++) {
                      const u = dCells[x]!;
                      const v = dCells[y]!;
                      if (!PEERS_OF[u]!.includes(v)) {
                        restricted = false;
                        break;
                      }
                    }
                    if (!restricted) break;
                  }

                  if (!restricted) {
                    nonRestrictedDigit = d;
                    nonRestrictedCount++;
                  }
                }

                if (nonRestrictedCount === 1 && nonRestrictedDigit !== null) {
                  const z = nonRestrictedDigit;
                  const zBit = maskOf(z);
                  const zCells = combo.filter(c => (grid.candidatesOf(c) & zBit) !== 0);

                  // Find cells T outside combo seeing all cells in zCells and having candidate z
                  const elims: { cell: number; digit: number }[] = [];
                  for (let t = 0; t < CELLS; t++) {
                    if (grid.get(t) === 0 && !combo.includes(t) && (grid.candidatesOf(t) & zBit) !== 0) {
                      const seesAllZ = zCells.every(zc => PEERS_OF[t]!.includes(zc));
                      if (seesAllZ) {
                        elims.push({ cell: t, digit: z });
                      }
                    }
                  }

                  if (elims.length > 0) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: [...combo, ...elims.map(e => e.cell)],
                        candidates: [
                          ...combo.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                          ...elims
                        ],
                        links: []
                      },
                      explanation: {
                        zh: `WXYZ翼：格 ${combo.map(c => cellLabel(c)).join(', ')} 共同包含 4 个候选数 {${ds.join(',')}} 且分布在宫 B${b+1} 和行列的交叉中；其中仅有非受限数 ${z} 不能互相可见。消去看到所有着色数 ${z} 的格中的 ${z}。`,
                        en: `WXYZ-Wing: cells ${combo.map(c => cellLabel(c)).join(', ')} contain exactly 4 digits {${ds.join(',')}} and lie in box B${b+1} and a line; only digit ${z} is non-restricted. Eliminate ${z} from cells seeing all occurrences of ${z} in the wing.`
                      }
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
};
