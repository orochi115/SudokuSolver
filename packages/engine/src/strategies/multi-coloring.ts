import { CELLS, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

/** Build connected components of conjugate pairs for digit d (verbatim from simple-coloring). */
function buildChains(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];

  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length === 2) {
      const [a, b] = cands as [number, number];
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    }
  }

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = new Map<number, 0 | 1>();
    const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);

    while (queue.length > 0) {
      const { cell, color } = queue.shift()!;
      for (const neighbor of adj.get(cell) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        const ncolor = (1 - color) as 0 | 1;
        comp.set(neighbor, ncolor);
        queue.push({ cell: neighbor, color: ncolor });
      }
    }

    if (comp.size >= 2) components.push(comp);
  }

  return components;
}

function shareHouse(c1: number, c2: number): boolean {
  return PEERS_OF[c1]!.includes(c2);
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色法', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const chains = buildChains(grid, d);
      if (chains.length < 2) continue;

      // Try all pairs of independent chains
      for (let i = 0; i < chains.length; i++) {
        for (let j = i + 1; j < chains.length; j++) {
          const comp1 = chains[i]!;
          const comp2 = chains[j]!;

          const g1_0 = [...comp1.entries()].filter(([_, col]) => col === 0).map(([c, _]) => c);
          const g1_1 = [...comp1.entries()].filter(([_, col]) => col === 1).map(([c, _]) => c);

          const g2_0 = [...comp2.entries()].filter(([_, col]) => col === 0).map(([c, _]) => c);
          const g2_1 = [...comp2.entries()].filter(([_, col]) => col === 1).map(([c, _]) => c);

          // Type 1: Link pair A1 - A2 share a house
          for (const [g1, opp1] of [[g1_0, g1_1], [g1_1, g1_0]] as const) {
            for (const [g2, opp2] of [[g2_0, g2_1], [g2_1, g2_0]] as const) {
              // Check if any cell in g1 shares a house with any cell in g2
              let linked = false;
              for (const x1 of g1) {
                for (const x2 of g2) {
                  if (shareHouse(x1, x2)) {
                    linked = true;
                    break;
                  }
                }
                if (linked) break;
              }

              if (linked) {
                // Eliminate d from cells seeing all cells of opp1 AND all cells of opp2
                const elims: { cell: number; digit: number }[] = [];
                for (let z = 0; z < CELLS; z++) {
                  if (grid.get(z) !== 0) continue;
                  if (!(grid.candidatesOf(z) & bit)) continue;
                  if (comp1.has(z) || comp2.has(z)) continue;

                  const peers = new Set(PEERS_OF[z]!);
                  const sees_all_opp1 = opp1.every((c) => peers.has(c));
                  const sees_all_opp2 = opp2.every((c) => peers.has(c));

                  if (sees_all_opp1 && sees_all_opp2) {
                    elims.push({ cell: z, digit: d });
                  }
                }

                if (elims.length > 0) {
                  const allColored = [...comp1.keys(), ...comp2.keys()];
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [...allColored, ...elims.map((e) => e.cell)],
                      candidates: [...allColored.map((c) => ({ cell: c, digit: d })), ...elims],
                      links: [],
                    },
                    explanation: {
                      zh: `多重染色法（Type 1）：数字 ${d} 包含两个独立染色网络，其色组间存在弱链接；消去同时看到另两色组中所有格子的 ${d}。`,
                      en: `Multi-Coloring (Type 1): digit ${d} has two independent colored components with a weak link between them; eliminate ${d} from cells seeing all cells of the opposite color groups.`,
                    },
                  };
                }
              }
            }
          }

          // Type 2: Two same-color cells each see an opposite color of the other pair
          for (const [g1, opp1] of [[g1_0, g1_1], [g1_1, g1_0]] as const) {
            for (const [g2, opp2] of [[g2_0, g2_1], [g2_1, g2_0]] as const) {
              if (g1.length < 2) continue;

              // Find if there are x, y in g1 such that x sees some g2 and y sees some opp2
              let x_sees_g2 = -1;
              let y_sees_opp2 = -1;

              for (const x of g1) {
                if (g2.some((c) => shareHouse(x, c))) {
                  x_sees_g2 = x;
                  break;
                }
              }

              for (const y of g1) {
                if (opp2.some((c) => shareHouse(y, c))) {
                  y_sees_opp2 = y;
                  break;
                }
              }

              if (x_sees_g2 !== -1 && y_sees_opp2 !== -1) {
                // g1 must be false! Eliminate d from all cells in g1.
                const elims = g1.map((c) => ({ cell: c, digit: d }));
                const allColored = [...comp1.keys(), ...comp2.keys()];
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...allColored, ...elims.map((e) => e.cell)],
                    candidates: [...allColored.map((c) => ({ cell: c, digit: d })), ...elims],
                    links: [],
                  },
                  explanation: {
                    zh: `多重染色法（Type 2）：数字 ${d} 包含两个独立染色网络，色组中的两格各看到另一网络的相反颜色；该色组必假，消去其上所有的 ${d}。`,
                    en: `Multi-Coloring (Type 2): digit ${d} has two independent colored components, two cells of one color group see opposite colors of the other component; that group is false, eliminate all ${d} from it.`,
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
