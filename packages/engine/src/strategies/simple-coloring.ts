/**
 * T4: Simple Coloring (single-digit strong-link chain).
 *
 * A conjugate pair is two cells in the same house that both contain digit D,
 * with no other candidates for D in that house. Between them, D forms a
 * "strong link" — if one is false, the other must be true.
 *
 * Simple coloring builds a two-color bipartite graph from conjugate pairs
 * of a single digit. Two outcomes are possible:
 *   - Trap:   an uncolored candidate sees both colors → eliminate it
 *   - Wrap:   same color appears twice in a house → that color is false
 *
 * We implement trap elimination (removes candidates) — wrap returns null
 * because it doesn't directly yield eliminations; the solver will handle
 * the contradiction when the wrapped color's cells become singles.
 */

import { HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'simple-coloring';

function buildConjugatesForDigit(grid: Grid, digit: number): Map<number, number[]> {
  const conjugates = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    for (const c of house) {
      if (grid.values[c] === 0 && (grid.candidates[c]! & maskOf(digit))) {
        cellsWithDigit.push(c);
      }
    }
    if (cellsWithDigit.length === 2) {
      for (const c of cellsWithDigit) {
        if (!conjugates.has(c)) conjugates.set(c, []);
        conjugates.get(c)!.push(cellsWithDigit.find(x => x !== c)!);
      }
    }
  }
  return conjugates;
}

function buildGraph(grid: Grid, digit: number): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  const conjugates = buildConjugatesForDigit(grid, digit);
  for (const [c, peers] of conjugates) {
    if (!adj.has(c)) adj.set(c, []);
    for (const p of peers) {
      if (!adj.has(p)) adj.set(p, []);
      adj.get(p)!.push(c);
    }
  }
  return adj;
}

function bfsComponent(graph: Map<number, number[]>): Map<number, number> | null {
  const nodes = [...graph.keys()];
  if (nodes.length === 0) return null;

  const visited = new Map<number, number>();
  const queue: number[] = [nodes[0]!];
  visited.set(nodes[0]!, 0);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curColor = visited.get(cur)!;
    for (const nb of graph.get(cur) ?? []) {
      if (!visited.has(nb)) {
        visited.set(nb, 1 - curColor);
        queue.push(nb);
      }
    }
  }
  return visited;
}

function cellsSeeEachOther(c1: number, c2: number): boolean {
  return PEERS_OF[c1]!.includes(c2);
}

export const simpleColoring: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildGraph(grid, digit);
      if (graph.size < 4) continue;

      const component = bfsComponent(graph);
      if (!component || component.size < 4) continue;

      const color0: CellDigit[] = [];
      const color1: CellDigit[] = [];
      for (const [cell, color] of component) {
        const cd = { cell, digit };
        if (color === 0) color0.push(cd);
        else color1.push(cd);
      }

      const elims: CellDigit[] = [];
      const links: Link[] = [];

      for (const [cell, color] of component) {
        for (const nb of graph.get(cell) ?? []) {
          links.push({
            from: { cell, digit },
            to: { cell: nb, digit },
            type: 'strong',
          });
        }
      }

      for (let cell = 0; cell < 81; cell++) {
        if (grid.values[cell] !== 0) continue;
        if (!grid.hasCandidate(cell, digit)) continue;
        if (component.has(cell)) continue;

        let sees0 = false;
        let sees1 = false;
        for (const cd of color0) {
          if (PEERS_OF[cell]!.includes(cd.cell)) {
            sees0 = true;
            break;
          }
        }
        for (const cd of color1) {
          if (PEERS_OF[cell]!.includes(cd.cell)) {
            sees1 = true;
            break;
          }
        }
        if (sees0 && sees1) {
          elims.push({ cell, digit });
        }
      }

      if (elims.length > 0) {
        const coloredCells = [...component.keys()];
        return {
          strategyId: STRATEGY_ID,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: coloredCells,
            candidates: [...color0, ...color1],
            links,
          },
          explanation: {
            zh: `数字 ${digit} 的共轭对形成双色链，同时看到两色的候选 ${digit} 可被消去（Color Trap）。`,
            en: `Digit ${digit} conjugate pairs form a two-color chain. Candidates of ${digit} seeing both colors can be eliminated (Color Trap).`,
          },
        };
      }
    }
    return null;
  },
};