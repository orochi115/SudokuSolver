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
  CELLS, HOUSES, ROW_OF, COL_OF, maskOf, PEERS_OF,
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
  tieBreak: ['digit', 'cell-index'],

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
