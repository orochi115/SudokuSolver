import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const PERMUTATIONS: readonly [number, number, number][] = [
  [0, 1, 2], // parity: 0 (even)
  [0, 2, 1], // parity: 1 (odd)
  [1, 0, 2], // parity: 1 (odd)
  [1, 2, 0], // parity: 0 (even)
  [2, 0, 1], // parity: 0 (even)
  [2, 1, 0], // parity: 1 (odd)
];

const PERM_PARITY = [0, 1, 1, 0, 0, 1];

interface TransversalMatch {
  cells: [number, number, number];
  parity: number;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // Loop over combinations of 4 boxes forming a rectangle
    for (let br1 = 0; br1 < 3; br1++) {
      for (let br2 = br1 + 1; br2 < 3; br2++) {
        for (let bc1 = 0; bc1 < 3; bc1++) {
          for (let bc2 = bc1 + 1; bc2 < 3; bc2++) {
            const b11 = br1 * 3 + bc1;
            const b12 = br1 * 3 + bc2;
            const b21 = br2 * 3 + bc1;
            const b22 = br2 * 3 + bc2;

            const boxes = [b11, b12, b21, b22];

            // Loop over combinations of 3 digits D
            for (let d1 = 1; d1 <= 9; d1++) {
              for (let d2 = d1 + 1; d2 <= 9; d2++) {
                for (let d3 = d2 + 1; d3 <= 9; d3++) {
                  const D = [d1, d2, d3];
                  const D_mask = maskOf(d1) | maskOf(d2) | maskOf(d3);

                  // Find transversals in each of the 4 boxes
                  const matches: Record<number, TransversalMatch[]> = {
                    [b11]: [],
                    [b12]: [],
                    [b21]: [],
                    [b22]: [],
                  };

                  let possible = true;
                  for (const b of boxes) {
                    const rowStart = Math.floor(b / 3) * 3;
                    const colStart = (b % 3) * 3;

                    for (let pIdx = 0; pIdx < PERMUTATIONS.length; pIdx++) {
                      const p = PERMUTATIONS[pIdx]!;
                      const c0 = (rowStart + 0) * 9 + (colStart + p[0]);
                      const c1 = (rowStart + 1) * 9 + (colStart + p[1]);
                      const c2 = (rowStart + 2) * 9 + (colStart + p[2]);

                      const tCells: [number, number, number] = [c0, c1, c2];

                      if (tCells.some((c) => grid.get(c) !== 0)) continue;

                      const cand0 = grid.candidatesOf(c0);
                      const cand1 = grid.candidatesOf(c1);
                      const cand2 = grid.candidatesOf(c2);

                      if ((cand0 & D_mask) === 0 || (cand1 & D_mask) === 0 || (cand2 & D_mask) === 0) {
                        continue;
                      }

                      const union_D_mask = (cand0 | cand1 | cand2) & D_mask;
                      if (union_D_mask !== D_mask) continue;

                      matches[b]!.push({
                        cells: tCells,
                        parity: PERM_PARITY[pIdx]!,
                      });
                    }

                    if (matches[b]!.length === 0) {
                      possible = false;
                      break;
                    }
                  }

                  if (!possible) continue;

                  // Try all combinations of transversals across the 4 boxes
                  for (const t11 of matches[b11]!) {
                    for (const t12 of matches[b12]!) {
                      for (const t21 of matches[b21]!) {
                        for (const t22 of matches[b22]!) {
                          const paritySum = t11.parity + t12.parity + t21.parity + t22.parity;
                          if (paritySum % 2 !== 1) continue;

                          const allCells = [...t11.cells, ...t12.cells, ...t21.cells, ...t22.cells];

                          // Collect extra candidates
                          const extraCands = allCells.map((c) => {
                            const cands = grid.candidatesOf(c);
                            const extra = cands & ~D_mask;
                            return { cell: c, extra };
                          });

                          const G_cells = extraCands.filter((x) => x.extra !== 0);

                          if (G_cells.length === 1) {
                            // Type-1
                            const target = G_cells[0]!;
                            const target_cell = target.cell;
                            const target_cands_in_D = grid.candidatesOf(target_cell) & D_mask;
                            if (target_cands_in_D === 0) continue;

                            const elims: { cell: number; digit: number }[] = [];
                            for (const d of D) {
                              if (grid.hasCandidate(target_cell, d)) {
                                elims.push({ cell: target_cell, digit: d });
                              }
                            }

                            if (elims.length > 0) {
                              const bLabels = boxes.map((bx) => `B${bx + 1}`).join(',');
                              const dLabels = D.join(',');
                              return {
                                strategyId: this.id,
                                placements: [],
                                eliminations: elims,
                                highlights: {
                                  cells: allCells,
                                  candidates: [
                                    ...allCells.flatMap((c) =>
                                      digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                                    ),
                                  ],
                                  links: [],
                                },
                                explanation: {
                                  zh: `三值死环（Type-1）：在宫 ${bLabels}，数字 {${dLabels}} 构成三值死环结构，守护者为 ${cellLabel(target_cell)} 处的其他候选数；故在该格中消去数字 {${dLabels}}。`,
                                  en: `Tridagon (Type-1): in boxes ${bLabels}, digits {${dLabels}} form a tridagon deadly pattern with a guardian in cell ${cellLabel(target_cell)}; eliminate digits {${dLabels}} from the guardian cell.`,
                                },
                              };
                            }
                          } else if (G_cells.length > 1) {
                            // Type-2 (multiple guardians of the same digit g)
                            let g_mask = 0;
                            for (const x of G_cells) {
                              g_mask |= x.extra;
                            }
                            if (popcount(g_mask) === 1) {
                              const g = digitsOf(g_mask)[0]!;
                              const g_cell_indices = G_cells.map((x) => x.cell);
                              const elims: { cell: number; digit: number }[] = [];

                              for (let z = 0; z < CELLS; z++) {
                                if (grid.get(z) !== 0) continue;
                                if (allCells.includes(z)) continue;
                                if (!grid.hasCandidate(z, g)) continue;

                                const seesAll = g_cell_indices.every((gc) => PEERS_OF[z]!.includes(gc));
                                if (seesAll) {
                                  elims.push({ cell: z, digit: g });
                                }
                              }

                              if (elims.length > 0) {
                                const bLabels = boxes.map((bx) => `B${bx + 1}`).join(',');
                                const dLabels = D.join(',');
                                const guardianLabels = g_cell_indices.map((c) => cellLabel(c)).join(', ');
                                return {
                                  strategyId: this.id,
                                  placements: [],
                                  eliminations: elims,
                                  highlights: {
                                    cells: [...allCells, ...elims.map((e) => e.cell)],
                                    candidates: [
                                      ...allCells.flatMap((c) =>
                                        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                                      ),
                                      ...elims,
                                    ],
                                    links: [],
                                  },
                                  explanation: {
                                    zh: `三值死环（Type-2）：在宫 ${bLabels}，数字 {${dLabels}} 构成三值死环结构，守护者为格 {${guardianLabels}} 处的相同数字 ${g}；消去所有能看到这组守护者的格子中的候选数 ${g}。`,
                                    en: `Tridagon (Type-2): in boxes ${bLabels}, digits {${dLabels}} form a tridagon deadly pattern with guardians of digit ${g} in cells {${guardianLabels}}; eliminate candidate ${g} from cells seeing all guardians.`,
                                  },
                                };
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};
