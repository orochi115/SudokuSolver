import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface Vertex {
  cell: number;
  digit: number;
}

function key(c: number, d: number): string {
  return `${c},${d}`;
}

function buildNetwork(grid: Grid, startCell: number, startDigit: number): Map<string, 0 | 1> | null {
  const coloring = new Map<string, 0 | 1>();
  const queue: Array<{ v: Vertex; color: 0 | 1 }> = [{ v: { cell: startCell, digit: startDigit }, color: 0 }];
  coloring.set(key(startCell, startDigit), 0);

  while (queue.length > 0) {
    const { v, color } = queue.shift()!;
    const ncolor = (1 - color) as 0 | 1;

    for (const house of HOUSES) {
      if (!house.includes(v.cell)) continue;
      const sameDigit = house.filter(
        (c) => c !== v.cell && grid.get(c) === 0 && grid.hasCandidate(c, v.digit),
      );
      if (sameDigit.length === 1) {
        const nk = key(sameDigit[0]!, v.digit);
        if (coloring.has(nk)) {
          if (coloring.get(nk) !== ncolor) return null;
        } else {
          coloring.set(nk, ncolor);
          queue.push({ v: { cell: sameDigit[0]!, digit: v.digit }, color: ncolor });
        }
      }
    }

    if (popcount(grid.candidatesOf(v.cell)) === 2) {
      for (const d of digitsOf(grid.candidatesOf(v.cell))) {
        if (d === v.digit) continue;
        const nk = key(v.cell, d);
        if (coloring.has(nk)) {
          if (coloring.get(nk) !== ncolor) return null;
        } else {
          coloring.set(nk, ncolor);
          queue.push({ v: { cell: v.cell, digit: d }, color: ncolor });
        }
      }
    }
  }

  return coloring;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎染色', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const globalVisited = new Set<string>();

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        if (globalVisited.has(key(cell, d))) continue;

        const network = buildNetwork(grid, cell, d);
        if (!network || network.size < 4) continue;

        for (const k of network.keys()) globalVisited.add(k);

        const green: Vertex[] = [];
        const blue: Vertex[] = [];
        for (const [k, color] of network) {
          const [cStr, dStr] = k.split(',');
          const v: Vertex = { cell: Number(cStr), digit: Number(dStr) };
          if (color === 0) green.push(v);
          else blue.push(v);
        }

        const greenByCell = new Map<number, Vertex[]>();
        const blueByCell = new Map<number, Vertex[]>();
        for (const v of green) {
          if (!greenByCell.has(v.cell)) greenByCell.set(v.cell, []);
          greenByCell.get(v.cell)!.push(v);
        }
        for (const v of blue) {
          if (!blueByCell.has(v.cell)) blueByCell.set(v.cell, []);
          blueByCell.get(v.cell)!.push(v);
        }

        for (const [c, gvs] of greenByCell) {
          if (gvs.length >= 2) {
            const placements: CellDigit[] = [];
            for (const bv of blue) {
              if (grid.hasCandidate(bv.cell, bv.digit)) {
                placements.push({ cell: bv.cell, digit: bv.digit });
              }
            }
            if (placements.length > 0) {
              const allCells = [...new Set([...green.map(v => v.cell), ...blue.map(v => v.cell)])];
              return {
                strategyId: '3d-medusa',
                placements,
                eliminations: [],
                highlights: {
                  cells: allCells,
                  candidates: [
                    ...green.map(v => ({ cell: v.cell, digit: v.digit })),
                    ...blue.map(v => ({ cell: v.cell, digit: v.digit })),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `3D美杜莎R1：${c} 有两个同色候选，该色全假；另一色全真。`,
                  en: `3D Medusa R1: cell ${c} has two same-color candidates; that color is false, the other is true.`,
                },
              };
            }
          }
        }
        for (const [c, bvs] of blueByCell) {
          if (bvs.length >= 2) {
            const placements: CellDigit[] = [];
            for (const gv of green) {
              if (grid.hasCandidate(gv.cell, gv.digit)) {
                placements.push({ cell: gv.cell, digit: gv.digit });
              }
            }
            if (placements.length > 0) {
              const allCells = [...new Set([...green.map(v => v.cell), ...blue.map(v => v.cell)])];
              return {
                strategyId: '3d-medusa',
                placements,
                eliminations: [],
                highlights: {
                  cells: allCells,
                  candidates: [
                    ...green.map(v => ({ cell: v.cell, digit: v.digit })),
                    ...blue.map(v => ({ cell: v.cell, digit: v.digit })),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `3D美杜莎R1：${c} 有两个同色候选，该色全假；另一色全真。`,
                  en: `3D Medusa R1: cell ${c} has two same-color candidates; that color is false, the other is true.`,
                },
              };
            }
          }
        }

        for (const house of HOUSES) {
          for (const dig of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
            const gSame = green.filter(v => v.digit === dig && house.includes(v.cell));
            if (gSame.length >= 2) {
              const placements: CellDigit[] = [];
              for (const bv of blue) {
                if (grid.hasCandidate(bv.cell, bv.digit)) {
                  placements.push({ cell: bv.cell, digit: bv.digit });
                }
              }
              if (placements.length > 0) {
                const allCells = [...new Set([...green.map(v => v.cell), ...blue.map(v => v.cell)])];
                return {
                  strategyId: '3d-medusa',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allCells,
                    candidates: [
                      ...green.map(v => ({ cell: v.cell, digit: v.digit })),
                      ...blue.map(v => ({ cell: v.cell, digit: v.digit })),
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `3D美杜莎R2：数字 ${dig} 在宫/行/列中有两个同色候选，该色全假；另一色全真。`,
                    en: `3D Medusa R2: digit ${dig} has two same-color candidates in a house; that color is false, the other is true.`,
                  },
                };
              }
            }
            const bSame = blue.filter(v => v.digit === dig && house.includes(v.cell));
            if (bSame.length >= 2) {
              const placements: CellDigit[] = [];
              for (const gv of green) {
                if (grid.hasCandidate(gv.cell, gv.digit)) {
                  placements.push({ cell: gv.cell, digit: gv.digit });
                }
              }
              if (placements.length > 0) {
                const allCells = [...new Set([...green.map(v => v.cell), ...blue.map(v => v.cell)])];
                return {
                  strategyId: '3d-medusa',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allCells,
                    candidates: [
                      ...green.map(v => ({ cell: v.cell, digit: v.digit })),
                      ...blue.map(v => ({ cell: v.cell, digit: v.digit })),
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `3D美杜莎R2：数字 ${dig} 在宫/行/列中有两个同色候选，该色全假；另一色全真。`,
                    en: `3D Medusa R2: digit ${dig} has two same-color candidates in a house; that color is false, the other is true.`,
                  },
                };
              }
            }
          }
        }

        const eliminations: CellDigit[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          const peers = new Set(PEERS_OF[c]!);
          for (const dig of digitsOf(grid.candidatesOf(c))) {
            if (network.has(key(c, dig))) continue;
            const seesGreen = green.some(v => v.digit === dig && peers.has(v.cell));
            const seesBlue = blue.some(v => v.digit === dig && peers.has(v.cell));
            if (seesGreen && seesBlue) {
              eliminations.push({ cell: c, digit: dig });
            }
          }
        }
        if (eliminations.length > 0) {
          const allCells = [...new Set([...green.map(v => v.cell), ...blue.map(v => v.cell), ...eliminations.map(e => e.cell)])];
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations,
            highlights: {
              cells: allCells,
              candidates: [
                ...green.map(v => ({ cell: v.cell, digit: v.digit })),
                ...blue.map(v => ({ cell: v.cell, digit: v.digit })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `3D美杜莎R4：未染色候选被双色同数字看见，消去之。`,
              en: `3D Medusa R4: uncolored candidate sees both colors of same digit; eliminate.`,
            },
          };
        }
      }
    }
    return null;
  },
};