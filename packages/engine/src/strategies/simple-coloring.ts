/**
 * Simple Coloring (T4, difficulty 60).
 *
 * For a single digit, find all conjugate pairs (houses where the digit appears
 * in exactly two cells — a strong link). Build connected components of these
 * conjugate pairs and 2-color each component. Then look for two types of
 * eliminations:
 *
 * Color Trap (Type 1):
 *   An uncolored candidate sees cells of BOTH colors. Since one color must be
 *   true and that color would eliminate this cell, the candidate can be removed.
 *
 * Color Wrap (Type 2):
 *   Two cells of the SAME color see each other — contradiction! That color
 *   must be false, so ALL cells of that color can have the digit eliminated.
 *
 * This is equivalent to finding single-digit X-chains (alternating chains of
 * strong links only). The "simple" qualifier means we only use strong links
 * (conjugate pairs), not mixed strong/weak AIC chains.
 */

import { HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Return cells in a house that have digit d as a candidate. */
function candidatesInHouse(grid: Grid, house: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

/** True if two cells are peers (share a house). */
function arePeers(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/**
 * Build an adjacency list of conjugate (strong-link) pairs for digit d.
 * A conjugate pair is a house where d appears in exactly 2 cells.
 */
function buildConjugateGraph(grid: Grid, d: number): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();

  for (const house of HOUSES) {
    const cells = candidatesInHouse(grid, house, d);
    if (cells.length === 2) {
      const [a, b] = cells as [number, number];
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }
  }

  return adj;
}

/**
 * BFS-color one connected component starting from `start`.
 * Returns a map: cell → color (0 or 1).
 */
function colorComponent(
  start: number,
  adj: Map<number, Set<number>>,
  visited: Set<number>,
): Map<number, number> {
  const color = new Map<number, number>();
  const queue: number[] = [start];
  color.set(start, 0);
  visited.add(start);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currColor = color.get(curr)!;
    for (const neighbor of adj.get(curr) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        color.set(neighbor, 1 - currColor);
        queue.push(neighbor);
      }
    }
  }

  return color;
}

function trySimpleColoring(grid: Grid): Step | null {
  for (let d = 1; d <= SIZE; d++) {
    const bit = maskOf(d);
    const adj = buildConjugateGraph(grid, d);
    if (adj.size === 0) continue;

    const visited = new Set<number>();

    for (const startNode of adj.keys()) {
      if (visited.has(startNode)) continue;

      const color = colorComponent(startNode, adj, visited);
      const color0 = [...color.entries()].filter(([, c]) => c === 0).map(([cell]) => cell);
      const color1 = [...color.entries()].filter(([, c]) => c === 1).map(([cell]) => cell);

      // ---- Color Wrap (Type 2): same color cells see each other ----
      for (const colorGroup of [color0, color1]) {
        for (let i = 0; i < colorGroup.length; i++) {
          for (let j = i + 1; j < colorGroup.length; j++) {
            const ca = colorGroup[i]!;
            const cb = colorGroup[j]!;
            if (arePeers(ca, cb)) {
              // This color is impossible — eliminate it from all cells of this color
              const elims = colorGroup.filter((c) => grid.hasCandidate(c, d));
              if (elims.length === 0) continue;

              // Build link chain for visualization
              const links: Link[] = buildColorLinks(color, adj, d);

              const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
              const colorIdx = colorGroup === color0 ? 0 : 1;
              const wrapA = `R${ROW_OF[ca]! + 1}C${COL_OF[ca]! + 1}`;
              const wrapB = `R${ROW_OF[cb]! + 1}C${COL_OF[cb]! + 1}`;

              return {
                strategyId: 'simple-coloring',
                placements: [],
                eliminations: elims.map((c) => ({ cell: c, digit: d })),
                highlights: {
                  cells: [...color.keys()],
                  candidates: [...color.entries()].map(([cell, c]) => ({ cell, digit: d })),
                  links,
                },
                explanation: {
                  zh: `数字 ${d} 的简单染色（颜色矛盾）：颜色${colorIdx === 0 ? 'A' : 'B'}的 ${wrapA} 与 ${wrapB} 互为同伴，产生矛盾，故颜色${colorIdx === 0 ? 'A' : 'B'}必为假。消除颜色${colorIdx === 0 ? 'A' : 'B'}的所有候选数 ${d}。消除：${elimStr}。`,
                  en: `Simple Coloring (Color Wrap) on digit ${d}: Color ${colorIdx === 0 ? 'A' : 'B'} cells ${wrapA} and ${wrapB} see each other — contradiction! Color ${colorIdx === 0 ? 'A' : 'B'} must be false. Eliminate ${d} from all color-${colorIdx === 0 ? 'A' : 'B'} cells. Eliminations: ${elimStr}.`,
                },
              };
            }
          }
        }
      }

      // ---- Color Trap (Type 1): uncolored candidate sees both colors ----
      // Collect all cells with digit d that are NOT in this component
      const componentCells = new Set(color.keys());
      const trapElims: number[] = [];

      for (let cell = 0; cell < 81; cell++) {
        if (!grid.hasCandidate(cell, d)) continue;
        if (componentCells.has(cell)) continue;

        // Check if this cell sees at least one cell from each color
        const seesColor0 = color0.some((c) => arePeers(cell, c));
        const seesColor1 = color1.some((c) => arePeers(cell, c));

        if (seesColor0 && seesColor1) {
          trapElims.push(cell);
        }
      }

      if (trapElims.length > 0) {
        const links: Link[] = buildColorLinks(color, adj, d);
        const elimStr = trapElims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');

        return {
          strategyId: 'simple-coloring',
          placements: [],
          eliminations: trapElims.map((c) => ({ cell: c, digit: d })),
          highlights: {
            cells: [...color.keys()],
            candidates: [
              ...[...color.entries()].map(([cell]) => ({ cell, digit: d })),
              ...trapElims.map((c) => ({ cell: c, digit: d })),
            ],
            links,
          },
          explanation: {
            zh: `数字 ${d} 的简单染色（颜色陷阱）：格 ${trapElims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、')} 同时能看到两种颜色的格，无论哪种颜色为真，该格的候选数 ${d} 都会被消除。消除：${elimStr}。`,
            en: `Simple Coloring (Color Trap) on digit ${d}: Cell(s) ${trapElims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ')} see both color groups. Whichever color is true, ${d} is eliminated from these cells. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }

  return null;
}

/** Build visualization links from the coloring map. */
function buildColorLinks(color: Map<number, number>, adj: Map<number, Set<number>>, d: number): Link[] {
  const links: Link[] = [];
  const seen = new Set<string>();

  for (const [cell, neighbors] of adj.entries()) {
    for (const nb of neighbors) {
      const key = cell < nb ? `${cell}-${nb}` : `${nb}-${cell}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        from: { cell, digit: d },
        to: { cell: nb, digit: d },
        type: 'strong',
      });
    }
  }

  return links;
}

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,
  apply: trySimpleColoring,
};
