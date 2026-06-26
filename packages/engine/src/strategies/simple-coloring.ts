/**
 * Simple Coloring (T4) — 简单染色
 *
 * For a single digit d, build connected components of strong links
 * (conjugate pairs). Each component can be 2-colored. Two deduction rules:
 *
 * 1. Trap (Color Trap): a cell outside the chain sees nodes of BOTH colors.
 *    Since one color is true, the cell cannot be d → eliminate d.
 *
 * 2. Wrap (Color Wrap): two cells of the same color see each other (appear in
 *    the same house). That color must all be false → the OTHER color is all
 *    true → place d in all cells of the other color.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, PEERS_OF, digitsOf, popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Build connected components of conjugate pairs for digit d. */
function buildChains(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];

  // Strong links: house with exactly 2 candidates for d
  // Build adjacency: cell → cells with strong link
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  // BFS to form components
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

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 610,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const chains = buildChains(grid, d);

      for (const comp of chains) {
        const color0: number[] = [];
        const color1: number[] = [];
        for (const [cell, color] of comp) {
          if (color === 0) color0.push(cell);
          else color1.push(cell);
        }

        // Rule 1: Color Wrap — two same-color cells see each other
        for (const colorGroup of [color0, color1] as const) {
          const otherGroup = colorGroup === color0 ? color1 : color0;
          let wrapFound = false;
          outer: for (let i = 0; i < colorGroup.length; i++) {
            for (let j = i + 1; j < colorGroup.length; j++) {
              const a = colorGroup[i]!;
              const b = colorGroup[j]!;
              if (PEERS_OF[a]!.includes(b)) {
                // colorGroup is all false, otherGroup is all true
                // Place d in all cells of otherGroup
                const placements = otherGroup
                  .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
                  .map((c) => ({ cell: c, digit: d }));

                if (placements.length === 0) { wrapFound = true; break outer; }

                const allChainCells = [...comp.keys()];
                return {
                  strategyId: 'simple-coloring',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allChainCells,
                    candidates: allChainCells.map((c) => ({ cell: c, digit: d })),
                    links: buildLinkList(grid, d, comp),
                  },
                  explanation: {
                    zh: `简单染色（染色矛盾）：数字 ${d} 的强链中，同色的 R${ROW_OF[a]! + 1}C${COL_OF[a]! + 1} 和 R${ROW_OF[b]! + 1}C${COL_OF[b]! + 1} 互相可见；该色全部为假，另一色全部为 ${d}。`,
                    en: `Simple Coloring (Wrap): digit ${d}'s chain has same-color cells R${ROW_OF[a]! + 1}C${COL_OF[a]! + 1} and R${ROW_OF[b]! + 1}C${COL_OF[b]! + 1} seeing each other; that color is all false, the other color is all ${d}.`,
                  },
                };
              }
            }
            if (wrapFound) break;
          }
        }

        // Rule 2: Color Trap — a cell outside the chain sees both colors
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (comp.has(c)) continue;
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & bit)) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesColor0 = color0.some((x) => peers.has(x));
          const seesColor1 = color1.some((x) => peers.has(x));
          if (seesColor0 && seesColor1) {
            elims.push({ cell: c, digit: d });
          }
        }

        if (elims.length > 0) {
          const allChainCells = [...comp.keys()];
          return {
            strategyId: 'simple-coloring',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...allChainCells, ...elims.map((e) => e.cell)],
              candidates: [
                ...allChainCells.map((c) => ({ cell: c, digit: d })),
                ...elims,
              ],
              links: buildLinkList(grid, d, comp),
            },
            explanation: {
              zh: `简单染色（颜色陷阱）：数字 ${d} 的强链双色，某格同时看到两种颜色，必有一色为真；消去该格的 ${d}。`,
              en: `Simple Coloring (Trap): digit ${d}'s chain is 2-colored; a cell sees both colors, so one color must be true → eliminate ${d} from that cell.`,
            },
          };
        }
      }
    }

    return null;
  },
};

/** Build link list for visualization from a coloring component. */
function buildLinkList(
  grid: Grid,
  d: number,
  comp: Map<number, 0 | 1>,
): import('../trace.js').Link[] {
  const bit = maskOf(d);
  const links: import('../trace.js').Link[] = [];
  const seen = new Set<string>();

  for (const house of HOUSES) {
    const cands = house.filter((c) => comp.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' });
  }

  return links;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const chains = buildChains(grid, d);
      if (chains.length < 2) continue;

      // Try all pairs of chains
      for (let i = 0; i < chains.length; i++) {
        for (let j = i + 1; j < chains.length; j++) {
          const comp1 = chains[i]!;
          const comp2 = chains[j]!;

          const color0_1: number[] = [];
          const color1_1: number[] = [];
          for (const [cell, color] of comp1) {
            if (color === 0) color0_1.push(cell);
            else color1_1.push(cell);
          }

          const color0_2: number[] = [];
          const color1_2: number[] = [];
          for (const [cell, color] of comp2) {
            if (color === 0) color0_2.push(cell);
            else color1_2.push(cell);
          }

          // Type 1: Multi-Colors Type 1
          // Choice of which colors are linked (share a house)
          const link_choices = [
            { link1: color0_1, target1: color1_1, link2: color0_2, target2: color1_2 },
            { link1: color0_1, target1: color1_1, link2: color1_2, target2: color0_2 },
            { link1: color1_1, target1: color0_1, link2: color0_2, target2: color1_2 },
            { link1: color1_1, target1: color0_1, link2: color1_2, target2: color0_2 },
          ];

          for (const { link1, target1, link2, target2 } of link_choices) {
            // Check if there is a weak link between link1 and link2 (cells see each other)
            let weakLinkFound = false;
            for (const c1 of link1) {
              for (const c2 of link2) {
                if (PEERS_OF[c1]!.includes(c2)) {
                  weakLinkFound = true;
                  break;
                }
              }
              if (weakLinkFound) break;
            }

            if (weakLinkFound) {
              // z sees both target1 and target2 cells
              const elims: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (comp1.has(c) || comp2.has(c)) continue;
                if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;

                const peers = new Set(PEERS_OF[c]!);
                const seesTarget1 = target1.some(x => peers.has(x));
                const seesTarget2 = target2.some(x => peers.has(x));
                if (seesTarget1 && seesTarget2) {
                  elims.push({ cell: c, digit: d });
                }
              }

              if (elims.length > 0) {
                const allChainCells = [...comp1.keys(), ...comp2.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...allChainCells, ...elims.map(e => e.cell)],
                    candidates: [
                      ...allChainCells.map(c => ({ cell: c, digit: d })),
                      ...elims,
                    ],
                    links: [...buildLinkList(grid, d, comp1), ...buildLinkList(grid, d, comp2)],
                  },
                  explanation: {
                    zh: `多重染色 Type 1：数字 ${d} 的两个独立强链簇中，一组颜色之间存在弱双向关联，从而其对立颜色集合必有一个为真；消去同时能看到这两个对立颜色的格中的 ${d}。`,
                    en: `Multi-Coloring Type 1: for digit ${d}, two independent clusters have colored cells that see each other (weak link), meaning at least one of their opposite colors must be true; eliminate ${d} from cells seeing both opposite colors.`,
                  },
                };
              }
            }
          }

          // Type 2: Multi-Colors Type 2
          // One color group in comp1 sees both colors of comp2
          const group_choices = [
            { group1: color0_1, opp1: color1_1 },
            { group1: color1_1, opp1: color0_1 },
          ];

          for (const { group1, opp1 } of group_choices) {
            let seesColor0_2 = false;
            let seesColor1_2 = false;
            for (const c of group1) {
              const peers = PEERS_OF[c]!;
              if (color0_2.some(x => peers.includes(x))) seesColor0_2 = true;
              if (color1_2.some(x => peers.includes(x))) seesColor1_2 = true;
            }

            if (seesColor0_2 && seesColor1_2) {
              // group1 is all false! opp1 is all true
              const elims: { cell: number; digit: number }[] = [];
              for (const c of group1) {
                if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
                  elims.push({ cell: c, digit: d });
                }
              }

              if (elims.length > 0) {
                const allChainCells = [...comp1.keys(), ...comp2.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...allChainCells, ...elims.map(e => e.cell)],
                    candidates: [
                      ...allChainCells.map(c => ({ cell: c, digit: d })),
                      ...elims,
                    ],
                    links: [...buildLinkList(grid, d, comp1), ...buildLinkList(grid, d, comp2)],
                  },
                  explanation: {
                    zh: `多重染色 Type 2：数字 ${d} 的强链簇中，某同色组分别看到另一个簇的两个对立颜色，导致该同色组全部为假；消去该组中的所有 ${d}。`,
                    en: `Multi-Coloring Type 2: for digit ${d}, cells of one color group in a cluster see both opposite colors of another cluster, forcing that group to be false; eliminate ${d} from all cells in that group.`,
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

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Build the 3D Medusa graph
    // Vertices are cell_digit = c * 9 + (d - 1)
    const activeNodes: number[] = [];
    const activeSet = new Set<number>();
    const nodeCandidates = new Map<number, { cell: number; digit: number }>();

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        for (const d of digitsOf(mask)) {
          const v = c * 9 + (d - 1);
          activeNodes.push(v);
          activeSet.add(v);
          nodeCandidates.set(v, { cell: c, digit: d });
        }
      }
    }

    const adj = new Map<number, number[]>();
    function addEdge(u: number, v: number) {
      if (!adj.has(u)) adj.set(u, []);
      if (!adj.has(v)) adj.set(v, []);
      adj.get(u)!.push(v);
      adj.get(v)!.push(u);
    }

    // 1. Bi-location links (same digit, exactly 2 cells in a house)
    for (let d = 1; d <= 9; d++) {
      for (const house of HOUSES) {
        const cells = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(d)) !== 0);
        if (cells.length === 2) {
          const u = cells[0]! * 9 + (d - 1);
          const v = cells[1]! * 9 + (d - 1);
          if (activeSet.has(u) && activeSet.has(v)) {
            addEdge(u, v);
          }
        }
      }
    }

    // 2. Bi-value links (same cell, exactly 2 digits)
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        if (popcount(mask) === 2) {
          const ds = digitsOf(mask);
          const u = c * 9 + (ds[0]! - 1);
          const v = c * 9 + (ds[1]! - 1);
          if (activeSet.has(u) && activeSet.has(v)) {
            addEdge(u, v);
          }
        }
      }
    }

    // BFS to find components and 2-color them
    const visited = new Set<number>();
    const components: Array<Map<number, 0 | 1>> = [];

    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const comp = new Map<number, 0 | 1>();
      const queue: Array<{ node: number; color: 0 | 1 }> = [{ node: start, color: 0 }];
      visited.add(start);
      comp.set(start, 0);

      let isBipartite = true;
      while (queue.length > 0) {
        const { node, color } = queue.shift()!;
        for (const neighbor of adj.get(node) ?? []) {
          if (comp.has(neighbor)) {
            if (comp.get(neighbor) === color) {
              isBipartite = false; // Coloring conflict
            }
          } else {
            visited.add(neighbor);
            const ncolor = (1 - color) as 0 | 1;
            comp.set(neighbor, ncolor);
            queue.push({ node: neighbor, color: ncolor });
          }
        }
      }

      if (isBipartite && comp.size >= 2) {
        components.push(comp);
      }
    }

    // Apply the 3D Medusa rules
    for (const comp of components) {
      const color0: Array<{ cell: number; digit: number; node: number }> = [];
      const color1: Array<{ cell: number; digit: number; node: number }> = [];
      for (const [node, color] of comp) {
        const info = nodeCandidates.get(node)!;
        if (color === 0) color0.push({ ...info, node });
        else color1.push({ ...info, node });
      }

      // Helper to generate a full whole-color contradiction step
      const makeContradictionStep = (falseColor: 0 | 1, ruleName: string, ruleDescZh: string, ruleDescEn: string) => {
        const falseGroup = falseColor === 0 ? color0 : color1;
        const trueGroup = falseColor === 0 ? color1 : color0;

        // Placements are naked/hidden singles from the true group
        const placements: { cell: number; digit: number }[] = [];
        const eliminations: { cell: number; digit: number }[] = [];

        for (const item of trueGroup) {
          if (grid.get(item.cell) === 0 && (grid.candidatesOf(item.cell) & maskOf(item.digit))) {
            placements.push({ cell: item.cell, digit: item.digit });
          }
        }

        for (const item of falseGroup) {
          if (grid.get(item.cell) === 0 && (grid.candidatesOf(item.cell) & maskOf(item.digit))) {
            eliminations.push({ cell: item.cell, digit: item.digit });
          }
        }

        if (eliminations.length === 0 && placements.length === 0) return null;

        return {
          strategyId: '3d-medusa',
          placements,
          eliminations,
          highlights: {
            cells: allChainCells(comp, elims_and_places(eliminations, placements)),
            candidates: patternCandidates(comp, grid, target_eliminations(eliminations, placements)),
            links: buildMedusaLinks(grid, comp),
          },
          explanation: {
            zh: `三维美斗莎 (3D Medusa) ${ruleName}：${ruleDescZh}。此颜色组必定全部为假，另一色必定全部为真；消去/落子相应格。`,
            en: `3D Medusa ${ruleName}: ${ruleDescEn}. This color group must be all false, and the other color must be all true; apply eliminations and placements.`,
          },
        };
      };

      const allChainCells = (c: Map<number, 0 | 1>, extra: number[]) => {
        const res = new Set<number>();
        for (const node of c.keys()) {
          res.add(nodeCandidates.get(node)!.cell);
        }
        for (const cell of extra) res.add(cell);
        return [...res];
      };
      const elims_and_places = (e: any[], p: any[]) => [...e.map(x => x.cell), ...p.map(x => x.cell)];
      const target_eliminations = (e: any[], p: any[]) => [...e, ...p];
      const patternCandidates = (c: Map<number, 0 | 1>, g: Grid, extra: any[]) => {
        const res: { cell: number; digit: number }[] = [];
        for (const [node, _] of c) {
          const info = nodeCandidates.get(node)!;
          res.push({ cell: info.cell, digit: info.digit });
        }
        for (const ex of extra) {
          if (!res.some(r => r.cell === ex.cell && r.digit === ex.digit)) {
            res.push({ cell: ex.cell, digit: ex.digit });
          }
        }
        return res;
      };

      // RULE 1: Twice in a Cell
      // A cell has two candidates of the same color
      for (const colorGroup of [color0, color1] as const) {
        const cellsMap = new Map<number, number[]>();
        for (const item of colorGroup) {
          if (!cellsMap.has(item.cell)) cellsMap.set(item.cell, []);
          cellsMap.get(item.cell)!.push(item.digit);
        }
        for (const [cell, digits] of cellsMap) {
          if (digits.length >= 2) {
            const step = makeContradictionStep(
              colorGroup === color0 ? 0 : 1,
              'Rule 1',
              `格 R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} 含有同为该色的两个候选数 {${digits.join(',')}}`,
              `cell R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} contains two candidates {${digits.join(',')}} of the same color`
            );
            if (step) return step;
          }
        }
      }

      // RULE 2: Twice in a Unit
      for (const color of [0, 1]) {
        const currentGroup = color === 0 ? color0 : color1;
        for (const house of HOUSES) {
          const digitsMap = new Map<number, number[]>();
          for (const item of currentGroup) {
            if (house.includes(item.cell)) {
              if (!digitsMap.has(item.digit)) digitsMap.set(item.digit, []);
              digitsMap.get(item.digit)!.push(item.cell);
            }
          }
          for (const [digit, cells] of digitsMap) {
            if (cells.length >= 2) {
              const step = makeContradictionStep(
                color as 0 | 1,
                'Rule 2',
                `区域内在数字 ${digit} 上包含两个相同颜色的格 {${cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}}`,
                `a house has two cells with the same color on digit ${digit}: {${cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}}`
              );
              if (step) return step;
            }
          }
        }
      }

      // RULE 3: Two colors in a cell
      // An uncolored candidate sits in a cell that also holds both Green and Blue candidates
      const rule3_elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const color0_digits = color0.filter(item => item.cell === c).map(item => item.digit);
        const color1_digits = color1.filter(item => item.cell === c).map(item => item.digit);
        if (color0_digits.length > 0 && color1_digits.length > 0) {
          const uncolored_digits = digitsOf(grid.candidatesOf(c)).filter(d => {
            const node = c * 9 + (d - 1);
            return !comp.has(node);
          });
          for (const x of uncolored_digits) {
            rule3_elims.push({ cell: c, digit: x });
          }
        }
      }
      if (rule3_elims.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: rule3_elims,
          highlights: {
            cells: allChainCells(comp, rule3_elims.map(e => e.cell)),
            candidates: patternCandidates(comp, grid, rule3_elims),
            links: buildMedusaLinks(grid, comp),
          },
          explanation: {
            zh: `三维美杜莎 Rule 3：某格中同时含有这组染色组件的两种颜色，则该格中其他未上色的候选数必为假；消去它们。`,
            en: `3D Medusa Rule 3: a cell holds both colors of the colored component, so any uncolored candidates in this cell must be false; eliminate them.`,
          },
        };
      }

      // RULE 4: Two colors in a unit
      // An uncolored candidate sees Green d and Blue d
      const rule4_elims_correct: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const candidates = digitsOf(grid.candidatesOf(c));
        const peers = PEERS_OF[c]!;
        for (const d of candidates) {
          const isColored = color0.some(item => item.cell === c && item.digit === d) ||
                            color1.some(item => item.cell === c && item.digit === d);
          if (isColored) continue;

          const seesGreen = color0.some(item => item.digit === d && peers.includes(item.cell));
          const seesBlue = color1.some(item => item.digit === d && peers.includes(item.cell));
          if (seesGreen && seesBlue) {
            rule4_elims_correct.push({ cell: c, digit: d });
          }
        }
      }

      if (rule4_elims_correct.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: rule4_elims_correct,
          highlights: {
            cells: allChainCells(comp, rule4_elims_correct.map(e => e.cell)),
            candidates: patternCandidates(comp, grid, rule4_elims_correct),
            links: buildMedusaLinks(grid, comp),
          },
          explanation: {
            zh: `三维美杜莎 Rule 4：未上色的候选数在同区域中分别看到两种颜色的相同数字，该候选数必为假；消去它们。`,
            en: `3D Medusa Rule 4: an uncolored candidate sees both colors of the same digit in the same house, so it must be false; eliminate it.`,
          },
        };
      }

      // RULE 5: Two colors, unit + cell
      // An uncolored candidate (c, d) sees a colored d along a house, and has the opposite color in its cell
      const rule5_elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const candidates = digitsOf(grid.candidatesOf(c));
        const peers = PEERS_OF[c]!;
        for (const d of candidates) {
          const isColored = color0.some(item => item.cell === c && item.digit === d) ||
                            color1.some(item => item.cell === c && item.digit === d);
          if (isColored) continue;

          // Case A: sees Green d, has Blue in c (on any digit)
          const seesGreen = color0.some(item => item.digit === d && peers.includes(item.cell));
          const hasBlueInCell = color1.some(item => item.cell === c);

          // Case B: sees Blue d, has Green in c (on any digit)
          const seesBlue = color1.some(item => item.digit === d && peers.includes(item.cell));
          const hasGreenInCell = color0.some(item => item.cell === c);

          if ((seesGreen && hasBlueInCell) || (seesBlue && hasGreenInCell)) {
            rule5_elims.push({ cell: c, digit: d });
          }
        }
      }

      if (rule5_elims.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: rule5_elims,
          highlights: {
            cells: allChainCells(comp, rule5_elims.map(e => e.cell)),
            candidates: patternCandidates(comp, grid, rule5_elims),
            links: buildMedusaLinks(grid, comp),
          },
          explanation: {
            zh: `三维美杜莎 Rule 5：未上色的候选数同时看到同一数字的某种颜色，并在自己格中含有另一颜色的其他数字，必为假；消去它。`,
            en: `3D Medusa Rule 5: an uncolored candidate sees a colored digit of one color, and its cell has the opposite color, so it must be false; eliminate it.`,
          },
        };
      }

      // RULE 6: Cell Emptied by Color
      // An uncolored cell whose every candidate sees the same single color
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const candidates = digitsOf(grid.candidatesOf(c));
        const isAnyColored = candidates.some(d => {
          const node = c * 9 + (d - 1);
          return comp.has(node);
        });
        if (isAnyColored) continue;

        const peers = PEERS_OF[c]!;
        for (const color of [0, 1]) {
          const currentGroup = color === 0 ? color0 : color1;
          const allSeen = candidates.every(d => {
            return currentGroup.some(item => item.digit === d && peers.includes(item.cell));
          });
          if (allSeen) {
            const step = makeContradictionStep(
              color as 0 | 1,
              'Rule 6',
              `格 R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1} 的所有候选数均看到该颜色的相应数字，若该颜色为真，此格将被清空（无解）`,
              `cell R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1} has all its candidates seen by color ${color === 0 ? 'Green' : 'Blue'}, which would empty the cell if true`
            );
            if (step) return step;
          }
        }
      }
    }
    return null;
  },
};

function buildMedusaLinks(grid: Grid, comp: Map<number, 0 | 1>): import('../trace.js').Link[] {
  const links: import('../trace.js').Link[] = [];
  const seen = new Set<string>();

  // 1. Same digit bi-location links
  for (let d = 1; d <= 9; d++) {
    for (const house of HOUSES) {
      const cells = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(d)) !== 0);
      if (cells.length === 2) {
        const u = cells[0]! * 9 + (d - 1);
        const v = cells[1]! * 9 + (d - 1);
        if (comp.has(u) && comp.has(v)) {
          const key = `biloc-${Math.min(u, v)}-${Math.max(u, v)}`;
          if (!seen.has(key)) {
            seen.add(key);
            links.push({
              from: { cell: cells[0]!, digit: d },
              to: { cell: cells[1]!, digit: d },
              type: 'strong',
            });
          }
        }
      }
    }
  }

  // 2. Same cell bi-value links
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) {
      const mask = grid.candidatesOf(c);
      if (popcount(mask) === 2) {
        const ds = digitsOf(mask);
        const u = c * 9 + (ds[0]! - 1);
        const v = c * 9 + (ds[1]! - 1);
        if (comp.has(u) && comp.has(v)) {
          const key = `bival-${c}-${ds[0]}-${ds[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            links.push({
              from: { cell: c, digit: ds[0]! },
              to: { cell: c, digit: ds[1]! },
              type: 'strong',
            });
          }
        }
      }
    }
  }

  return links;
}
