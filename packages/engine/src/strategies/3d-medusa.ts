import { CELLS, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const n_vertices = 729;
    const medusa_adj: number[][] = Array.from({ length: n_vertices }, () => []);

    // 1. Bi-location strong links (2D)
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      for (const house of HOUSES) {
        const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cands.length === 2) {
          const [c1, c2] = cands as [number, number];
          const v1 = c1 * 9 + (d - 1);
          const v2 = c2 * 9 + (d - 1);
          medusa_adj[v1]!.push(v2);
          medusa_adj[v2]!.push(v1);
        }
      }
    }

    // 2. Bi-value strong links (3D)
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        if (popcount(mask) === 2) {
          const [d1, d2] = digitsOf(mask) as [number, number];
          const v1 = c * 9 + (d1 - 1);
          const v2 = c * 9 + (d2 - 1);
          medusa_adj[v1]!.push(v2);
          medusa_adj[v2]!.push(v1);
        }
      }
    }

    // Find bipartite components
    const visited = new Set<number>();
    const components: Array<Map<number, 0 | 1>> = [];

    for (let s = 0; s < n_vertices; s++) {
      if (medusa_adj[s]!.length === 0 || visited.has(s)) continue;

      const comp = new Map<number, 0 | 1>();
      const queue: Array<{ v: number; col: 0 | 1 }> = [{ v: s, col: 0 }];
      visited.add(s);
      comp.set(s, 0);

      let isBipartite = true;
      while (queue.length > 0) {
        const { v, col } = queue.shift()!;
        for (const nb of medusa_adj[v]!) {
          if (comp.has(nb)) {
            if (comp.get(nb) === col) {
              isBipartite = false;
            }
          } else {
            visited.add(nb);
            const ncol = (1 - col) as 0 | 1;
            comp.set(nb, ncol);
            queue.push({ v: nb, col: ncol });
          }
        }
      }

      if (isBipartite && comp.size >= 2) {
        components.push(comp);
      }
    }

    // For each bipartite component, check the 6 rules
    for (const comp of components) {
      const color0 = [...comp.entries()].filter(([_, col]) => col === 0).map(([v, _]) => v);
      const color1 = [...comp.entries()].filter(([_, col]) => col === 1).map(([v, _]) => v);

      // --- Rule 1: Twice in a Cell ---
      for (const col of [0, 1] as const) {
        const color_vertices = col === 0 ? color0 : color1;
        const opposite_vertices = col === 0 ? color1 : color0;

        for (let c = 0; c < 81; c++) {
          const in_cell = color_vertices.filter((v) => Math.floor(v / 9) === c);
          if (in_cell.length >= 2) {
            // Contradiction! opposite is true
            const placements = opposite_vertices.map((v) => ({
              cell: Math.floor(v / 9),
              digit: (v % 9) + 1,
            }));
            const elims = color_vertices.map((v) => ({
              cell: Math.floor(v / 9),
              digit: (v % 9) + 1,
            }));

            if (placements.length > 0 || elims.length > 0) {
              return {
                strategyId: this.id,
                placements,
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                  candidates: [...comp.entries()].map(([v, _]) => ({
                    cell: Math.floor(v / 9),
                    digit: (v % 9) + 1,
                  })),
                  links: [],
                },
                explanation: {
                  zh: `三维美杜莎（Rule 1）：在格 ${cellLabel(c)} 中出现两个同色候选数，产生单元冲突；该颜色必假，另一颜色必真。`,
                  en: `3D Medusa (Rule 1): cell ${cellLabel(c)} has two candidates of the same color, causing a cell clash; that color is false, opposite color is true.`,
                },
              };
            }
          }
        }
      }

      // --- Rule 2: Twice in a Unit ---
      for (const col of [0, 1] as const) {
        const color_vertices = col === 0 ? color0 : color1;
        const opposite_vertices = col === 0 ? color1 : color0;

        for (const house of HOUSES) {
          for (let d = 1; d <= 9; d++) {
            const in_house = color_vertices.filter(
              (v) => (v % 9) + 1 === d && house.includes(Math.floor(v / 9)),
            );
            if (in_house.length >= 2) {
              const placements = opposite_vertices.map((v) => ({
                cell: Math.floor(v / 9),
                digit: (v % 9) + 1,
              }));
              const elims = color_vertices.map((v) => ({
                cell: Math.floor(v / 9),
                digit: (v % 9) + 1,
              }));

              if (placements.length > 0 || elims.length > 0) {
                return {
                  strategyId: this.id,
                  placements,
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                    candidates: [...comp.entries()].map(([v, _]) => ({
                      cell: Math.floor(v / 9),
                      digit: (v % 9) + 1,
                    })),
                    links: [],
                  },
                  explanation: {
                    zh: `三维美杜莎（Rule 2）：在某个单元中数字 ${d} 出现两个同色候选数，产生区域冲突；该颜色必假，另一颜色必真。`,
                    en: `3D Medusa (Rule 2): digit ${d} has two candidates of the same color in a house, causing a house clash; that color is false, opposite color is true.`,
                  },
                };
              }
            }
          }
        }
      }

      // --- Rule 3: Two colors in a cell ---
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0) continue;
        const colored_in_c = [...comp.keys()].filter((v) => Math.floor(v / 9) === c);
        const color_types = new Set(colored_in_c.map((v) => comp.get(v)!));
        if (color_types.has(0) && color_types.has(1)) {
          const elims: { cell: number; digit: number }[] = [];
          const bit = grid.candidatesOf(c);
          for (let x = 1; x <= 9; x++) {
            if (bit & maskOf(x)) {
              const v = c * 9 + (x - 1);
              if (!comp.has(v)) {
                elims.push({ cell: c, digit: x });
              }
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                candidates: [
                  ...comp.entries()].map(([v, _]) => ({
                    cell: Math.floor(v / 9),
                    digit: (v % 9) + 1,
                  })),
                links: [],
              },
              explanation: {
                zh: `三维美杜莎（Rule 3）：格 ${cellLabel(c)} 中同时包含两种颜色的候选数；任何其他未染色的候选数必然被消去。`,
                en: `3D Medusa (Rule 3): cell ${cellLabel(c)} contains candidates of both colors; eliminate any uncolored candidate in this cell.`,
              },
            };
          }
        }
      }

      // --- Rule 4: Two colors in a unit ---
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0) continue;
        const bit = grid.candidatesOf(c);
        for (let d = 1; d <= 9; d++) {
          if (!(bit & maskOf(d))) continue;
          const v = c * 9 + (d - 1);
          if (comp.has(v)) continue;

          let sees0 = false;
          let sees1 = false;
          for (const peer of PEERS_OF[c]!) {
            const v_peer = peer * 9 + (d - 1);
            if (comp.has(v_peer)) {
              if (comp.get(v_peer) === 0) sees0 = true;
              if (comp.get(v_peer) === 1) sees1 = true;
            }
          }
          if (sees0 && sees1) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: [{ cell: c, digit: d }],
              highlights: {
                cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                candidates: [...comp.entries()].map(([v, _]) => ({
                  cell: Math.floor(v / 9),
                  digit: (v % 9) + 1,
                })),
                links: [],
              },
              explanation: {
                zh: `三维美杜莎（Rule 4）：格 ${cellLabel(c)} 的数字 ${d} 同时看到该数字的两种颜色，产生冲突；消去该格的 ${d}。`,
                en: `3D Medusa (Rule 4): cell ${cellLabel(c)} candidate ${d} sees both colors of digit ${d} in peer cells; eliminate ${d} from ${cellLabel(c)}.`,
              },
            };
          }
        }
      }

      // --- Rule 5: Two colors, unit + cell ---
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0) continue;
        const bit = grid.candidatesOf(c);
        for (let d = 1; d <= 9; d++) {
          if (!(bit & maskOf(d))) continue;
          const v = c * 9 + (d - 1);
          if (comp.has(v)) continue;

          for (const col of [0, 1] as const) {
            let sees_col = false;
            for (const peer of PEERS_OF[c]!) {
              const v_peer = peer * 9 + (d - 1);
              if (comp.has(v_peer) && comp.get(v_peer) === col) {
                sees_col = true;
                break;
              }
            }
            if (sees_col) {
              let has_opposite = false;
              for (let d2 = 1; d2 <= 9; d2++) {
                if (d2 === d) continue;
                const v2 = c * 9 + (d2 - 1);
                if (comp.has(v2) && comp.get(v2) === (1 - col)) {
                  has_opposite = true;
                  break;
                }
              }
              if (has_opposite) {
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: [{ cell: c, digit: d }],
                  highlights: {
                    cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                    candidates: [...comp.entries()].map(([v, _]) => ({
                      cell: Math.floor(v / 9),
                      digit: (v % 9) + 1,
                    })),
                    links: [],
                  },
                  explanation: {
                    zh: `三维美杜莎（Rule 5）：格 ${cellLabel(c)} 的数字 ${d} 看到同数字的 ${col === 0 ? '蓝' : '绿'}色，且格内有相反颜色，必产生冲突；消去该格的 ${d}。`,
                    en: `3D Medusa (Rule 5): cell ${cellLabel(c)} candidate ${d} sees same-digit color ${col === 0 ? 'Blue' : 'Green'} in a peer and cell ${cellLabel(c)} holds opposite color on another candidate; eliminate ${d} from ${cellLabel(c)}.`,
                  },
                };
              }
            }
          }
        }
      }

      // --- Rule 6: Cell Emptied by Color ---
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0) continue;
        const bit = grid.candidatesOf(c);
        const cands = digitsOf(bit);

        const has_colored = cands.some((d) => comp.has(c * 9 + (d - 1)));
        if (!has_colored) {
          for (const col of [0, 1] as const) {
            const all_see = cands.every((d) => {
              return PEERS_OF[c]!.some((peer) => {
                const v_peer = peer * 9 + (d - 1);
                return comp.has(v_peer) && comp.get(v_peer) === col;
              });
            });

            if (all_see) {
              const opposite_vertices = col === 0 ? color1 : color0;
              const color_vertices = col === 0 ? color0 : color1;

              const placements = opposite_vertices.map((v) => ({
                cell: Math.floor(v / 9),
                digit: (v % 9) + 1,
              }));
              const elims = color_vertices.map((v) => ({
                cell: Math.floor(v / 9),
                digit: (v % 9) + 1,
              }));

              if (placements.length > 0 || elims.length > 0) {
                return {
                  strategyId: this.id,
                  placements,
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set([...comp.keys()].map((v) => Math.floor(v / 9)))],
                    candidates: [...comp.entries()].map(([v, _]) => ({
                      cell: Math.floor(v / 9),
                      digit: (v % 9) + 1,
                    })),
                    links: [],
                  },
                  explanation: {
                    zh: `三维美杜莎（Rule 6）：若颜色 ${col === 0 ? '蓝' : '绿'} 为真，则格 ${cellLabel(c)} 将无可填数字；故该颜色必假，相反颜色为真。`,
                    en: `3D Medusa (Rule 6): if color ${col === 0 ? 'Blue' : 'Green'} were true, cell ${cellLabel(c)} would be emptied; so that color is false, opposite is true.`,
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
