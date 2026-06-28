import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf, UNITS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function findSharedHouses(a: number, b: number): number[] {
  const common = [];
  const u_a = UNITS_OF[a]!;
  const u_b = UNITS_OF[b]!;
  for (const h of u_a) {
    if (u_b.includes(h)) {
      common.push(h);
    }
  }
  return common;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼（守护者）', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cells_d: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          cells_d.push(c);
        }
      }

      if (cells_d.length < 5) continue;

      // Build graph on cells_d where edges share a house
      const adj = new Map<number, number[]>();
      for (const u of cells_d) {
        adj.set(u, []);
        const peers_u = PEERS_OF[u]!;
        for (const v of cells_d) {
          if (u !== v && peers_u.includes(v)) {
            adj.get(u)!.push(v);
          }
        }
      }

      // BFS/DFS to find simple odd cycles of length 5
      const loops: number[][] = [];
      const runDFS = (u: number, path: number[]) => {
        if (path.length === 5) {
          const first = path[0]!;
          if (adj.get(u)!.includes(first)) {
            // Found a cycle of length 5
            loops.push([...path]);
          }
          return;
        }
        for (const v of adj.get(u) ?? []) {
          if (v < path[0]!) continue; // Enforce minimum start node to avoid permutations/duplicates
          if (!path.includes(v)) {
            path.push(v);
            runDFS(v, path);
            path.pop();
          }
        }
      };

      for (const start of cells_d) {
        runDFS(start, [start]);
      }

      // Check each loop
      for (const loop of loops) {
        // Chord check: no non-consecutive cells in the loop may see each other
        let hasChords = false;
        for (let aIdx = 0; aIdx < 5; aIdx++) {
          const aCell = loop[aIdx]!;
          const peers_a = PEERS_OF[aCell]!;
          for (let bIdx = aIdx + 2; bIdx < 5; bIdx++) {
            if (aIdx === 0 && bIdx === 4) continue;
            const bCell = loop[bIdx]!;
            if (peers_a.includes(bCell)) {
              hasChords = true;
              break;
            }
          }
          if (hasChords) break;
        }
        if (hasChords) continue;

        const G_set = new Set<number>();

        for (let idx = 0; idx < 5; idx++) {
          const a = loop[idx]!;
          const b = loop[(idx + 1) % 5]!;
          const shared = findSharedHouses(a, b);

          let best_guardians: number[] = [];
          let min_count = 999;

          for (const h of shared) {
            const house_cells = HOUSES[h]!.filter(
              (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
            );
            if (house_cells.length < min_count) {
              min_count = house_cells.length;
              best_guardians = house_cells.filter((c) => c !== a && c !== b);
            }
          }

          for (const gCell of best_guardians) {
            G_set.add(gCell);
          }
        }

        // Exclude loop cells from guardians
        const G = [...G_set].filter((c) => !loop.includes(c));

        if (G.length === 1) {
          const g = G[0]!;
          return {
            strategyId: this.id,
            placements: [{ cell: g, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...loop, g],
              candidates: [
                ...loop.map((c) => ({ cell: c, digit: d })),
                { cell: g, digit: d },
              ],
              links: [],
            },
            explanation: {
              zh: `断翼（单守护者）：数字 ${d} 的五格奇环中，存在单一守护者格 ${cellLabel(g)}；强制填入 ${d}。`,
              en: `Broken Wing (Single Guardian): digit ${d} forms a 5-cell odd loop with a single guardian ${cellLabel(g)}; place ${d} in the guardian cell.`,
            },
          };
        } else if (G.length > 1) {
          const elims: { cell: number; digit: number }[] = [];
          for (let t = 0; t < CELLS; t++) {
            if (grid.get(t) !== 0) continue;
            if (G.includes(t)) continue;
            if (!(grid.candidatesOf(t) & bit)) continue;

            const seesAll = G.every((g) => PEERS_OF[t]!.includes(g));
            if (seesAll) {
              elims.push({ cell: t, digit: d });
            }
          }

          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...loop, ...G, ...elims.map((e) => e.cell)],
                candidates: [
                  ...loop.map((c) => ({ cell: c, digit: d })),
                  ...G.map((c) => ({ cell: c, digit: d })),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `断翼（多守护者）：数字 ${d} 的五格奇环中，存在多个守护者格 {${G.map((g) => cellLabel(g)).join(', ')}}；消去能看到所有守护者的格子中的 ${d}。`,
                en: `Broken Wing (Multiple Guardians): digit ${d} forms a 5-cell odd loop with guardians {${G.map((g) => cellLabel(g)).join(', ')}}; eliminate ${d} from cells seeing all guardians.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
