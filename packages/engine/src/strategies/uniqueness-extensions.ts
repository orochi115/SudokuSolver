import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, UNITS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// Find even bivalue loops of size 6, 8, 10 on digits {a,b}
function* findUniqueLoops(grid: Grid, maxLen: number): Generator<{ loop: number[], a: number, b: number }> {
  const unsolved: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) {
      unsolved.push(c);
    }
  }

  // Loop over digit pairs {a,b}
  for (let a = 1; a <= 8; a++) {
    for (let b = a + 1; b <= 9; b++) {
      const bitA = maskOf(a);
      const bitB = maskOf(b);
      const ab_mask = bitA | bitB;

      // Filter cells that have candidates {a,b}
      const potential = unsolved.filter((c) => {
        const cands = grid.candidatesOf(c);
        return (cands & bitA) !== 0 && (cands & bitB) !== 0;
      });

      if (potential.length < 6) continue;

      // Build adjacency: u and v see each other
      const adj = new Map<number, number[]>();
      for (const u of potential) {
        adj.set(u, []);
        for (const v of potential) {
          if (u !== v && PEERS_OF[u]!.includes(v)) {
            adj.get(u)!.push(v);
          }
        }
      }

      // Find simple even cycles of length 6, 8, 10
      const seen = new Set<string>();
      let budget = 2000;
      const runDFS = (u: number, path: number[]) => {
        if (budget-- <= 0) return;
        if (path.length >= 6 && path.length % 2 === 0) {
          const first = path[0]!;
          if (adj.get(u)!.includes(first)) {
            const loop = [...path];
            const sorted_key = [...loop].sort((x, y) => x - y).join(',');
            if (!seen.has(sorted_key)) {
              seen.add(sorted_key);

              // Check if loop is deadly: for every house H, |loop ∩ H| is either 0 or 2
              let isDeadly = true;
              for (const house of HOUSES) {
                const count = loop.filter((c) => house.includes(c)).length;
                if (count !== 0 && count !== 2) {
                  isDeadly = false;
                  break;
                }
              }

              if (isDeadly) {
                loops_found.push({ loop, a, b });
              }
            }
          }
        }
        if (path.length >= maxLen) return;

        for (const v of adj.get(u) ?? []) {
          if (!path.includes(v)) {
            path.push(v);
            runDFS(v, path);
            path.pop();
          }
        }
      };

      const loops_found: { loop: number[], a: number, b: number }[] = [];
      for (const start of potential) {
        runDFS(start, [start]);
      }

      for (const item of loops_found) {
        yield item;
      }
    }
  }
}

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // We can search for Unique Loops of size up to 8
    for (const { loop, a, b } of findUniqueLoops(grid, 8)) {
      const bitA = maskOf(a);
      const bitB = maskOf(b);
      const ab_mask = bitA | bitB;

      const extras = loop.map((c) => {
        const extraMask = grid.candidatesOf(c) & ~ab_mask;
        return { cell: c, extraMask };
      });

      const with_extras = extras.filter((x) => x.extraMask !== 0);

      if (with_extras.length === 1) {
        // Type 1: exactly one cell has extra candidates
        const target = with_extras[0]!;
        const tgt = target.cell;

        const elims: { cell: number; digit: number }[] = [];
        if (grid.hasCandidate(tgt, a)) elims.push({ cell: tgt, digit: a });
        if (grid.hasCandidate(tgt, b)) elims.push({ cell: tgt, digit: b });

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: loop,
              candidates: [
                ...loop.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                ),
              ],
              links: [],
            },
            explanation: {
              zh: `唯一环（Type 1）：在格 {${loop.map((c) => cellLabel(c)).join(', ')}}，除了格 ${cellLabel(tgt)} 外所有格均仅含 {${a},${b}}；消去该格中的 {${a},${b}}。`,
              en: `Unique Loop (Type 1): in cells {${loop.map((c) => cellLabel(c)).join(', ')}}, only ${cellLabel(tgt)} has extra candidates beyond {${a},${b}}; eliminate {${a},${b}} from ${cellLabel(tgt)}.`,
            },
          };
        }
      } else if (with_extras.length === 2) {
        // Type 2: two adjacent cells in the loop have the same single extra candidate z
        const [x1, x2] = with_extras as [typeof extras[0], typeof extras[0]];
        if (x1.extraMask === x2.extraMask && popcount(x1.extraMask) === 1) {
          const z = digitsOf(x1.extraMask)[0]!;

          // u1 and u2 must share a house
          const u1 = x1.cell;
          const u2 = x2.cell;
          const common_houses = UNITS_OF[u1]!.filter((h) => UNITS_OF[u2]!.includes(h));

          if (common_houses.length > 0) {
            const peersU1 = new Set(PEERS_OF[u1]!);
            const elims: { cell: number; digit: number }[] = [];

            for (const t of PEERS_OF[u2]!) {
              if (!peersU1.has(t)) continue;
              if (loop.includes(t)) continue;
              if (grid.hasCandidate(t, z)) {
                elims.push({ cell: t, digit: z });
              }
            }

            if (elims.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...loop, ...elims.map((e) => e.cell)],
                  candidates: [
                    ...loop.flatMap((c) =>
                      digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                    ),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `唯一环（Type 2）：在格 {${loop.map((c) => cellLabel(c)).join(', ')}}，两格含有相同额外候选数 ${z}；消去其共同可见格中的 ${z}。`,
                  en: `Unique Loop (Type 2): in cells {${loop.map((c) => cellLabel(c)).join(', ')}}, two cells have extra candidate ${z}; eliminate ${z} from their common peers.`,
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

// BUG-Lite: Structurally identical to Unique Loop but with bivalue cells only, acting as a delegator
export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 986,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // We can delegate to Unique Loop logic but emit with bug-lite strategyId!
    const step = uniqueLoop.apply(grid);
    if (step) {
      return {
        ...step,
        strategyId: this.id,
        explanation: {
          zh: step.explanation.zh.replace('唯一环', 'BUG-Lite'),
          en: step.explanation.en.replace('Unique Loop', 'BUG-Lite'),
        },
      };
    }
    return null;
  },
};

// BUG-Plus-N (BUG+N)
export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 987,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    const unsolved: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        unsolved.push(c);
      }
    }

    if (unsolved.length === 0) return null;

    // We check if all but some cells are bivalue
    // And for some digit d, we have excess candidates in some houses
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      // Find all houses with count(d, H) > 2
      const excess_houses: number[] = [];
      for (let h = 0; h < HOUSES.length; h++) {
        const count = HOUSES[h]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
        if (count > 2) {
          excess_houses.push(h);
        }
      }

      if (excess_houses.length === 0) continue;

      // Check if all other digits d' are perfectly balanced (count <= 2 in all houses)
      let other_digits_balanced = true;
      for (let d2 = 1; d2 <= 9; d2++) {
        if (d2 === d) continue;
        const bit2 = maskOf(d2);
        for (const house of HOUSES) {
          const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit2) !== 0).length;
          if (count > 2) {
            other_digits_balanced = false;
            break;
          }
        }
        if (!other_digits_balanced) break;
      }

      if (!other_digits_balanced) continue;

      // Collect all guardian cells: cells containing d in excess houses
      const G_cells_set = new Set<number>();
      for (const h of excess_houses) {
        const house_cells = HOUSES[h]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        for (const c of house_cells) {
          G_cells_set.add(c);
        }
      }

      const G_cells = [...G_cells_set];
      if (G_cells.length > 0) {
        // Find T outside G_cells that sees all of G_cells and has candidate d
        const elims: { cell: number; digit: number }[] = [];
        for (let t = 0; t < CELLS; t++) {
          if (grid.get(t) !== 0) continue;
          if (G_cells.includes(t)) continue;
          if (!(grid.candidatesOf(t) & bit)) continue;

          const seesAll = G_cells.every((g) => PEERS_OF[t]!.includes(g));
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
              cells: [...G_cells, ...elims.map((e) => e.cell)],
              candidates: [
                ...G_cells.map((c) => ({ cell: c, digit: d })),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `BUG+N：由于数字 ${d} 在多个单元中超量出现，其守护格为 {${G_cells.map((c) => cellLabel(c)).join(', ')}}；消去能看到所有守护格的格子中的 ${d}。`,
              en: `BUG+N: digit ${d} is in excess across multiple houses with guardians {${G_cells.map((c) => cellLabel(c)).join(', ')}}; eliminate ${d} from cells seeing all guardians.`,
            },
          };
        }
      }
    }

    return null;
  },
};
