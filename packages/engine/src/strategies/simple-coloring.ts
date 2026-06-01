/**
 * Simple Coloring (T4) — 简单染色.
 *
 * For ONE digit, build the conjugate-pair graph (a digit has exactly two
 * placements in a house → a strong link). 2-colour each connected component by
 * alternating colours across strong links. Two outcomes (per the research note):
 *
 *  - Color Wrap 同色互见: if two SAME-coloured candidates see each other, that
 *    colour is impossible (a digit can't be placed twice in a house), so ALL
 *    candidates of that colour are eliminated. (The opposite colour is then the
 *    solution for those cells, but we conservatively only emit eliminations.)
 *  - Color Trap 异色夹击: an UNCOLOURED candidate of the digit that sees both a
 *    colour-A candidate and a colour-B candidate is eliminated (one of the two
 *    colours is true, and either way that uncoloured cell loses the digit).
 *
 * This is the single-digit special case of an AIC, kept as its own (cheaper)
 * strategy so the trace prefers it before the general chain search (FR-7).
 */

import {
  SIZE,
  CELLS,
  HOUSES,
  cellsWithCandidate,
  sees,
  cellLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ColorComponent {
  /** cell → 0 | 1 colour. */
  color: Map<number, 0 | 1>;
  /** strong-link edges (for the highlight path). */
  edges: [number, number][];
}

/** Build conjugate-pair components for `digit` via union over strong links. */
function buildComponents(grid: Grid, digit: number): ColorComponent[] {
  // adjacency = conjugate pairs
  const adj = new Map<number, number[]>();
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  const addEdge = (a: number, b: number) => {
    const k = a < b ? `${a},${b}` : `${b},${a}`;
    if (edgeSet.has(k)) return;
    edgeSet.add(k);
    edges.push([a, b]);
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  };

  for (let h = 0; h < HOUSES.length; h++) {
    const cells = cellsWithCandidate(grid, HOUSES[h]!, digit);
    if (cells.length === 2) addEdge(cells[0]!, cells[1]!);
  }

  const comps: ColorComponent[] = [];
  const globalSeen = new Set<number>();
  for (const start of adj.keys()) {
    if (globalSeen.has(start)) continue;
    const color = new Map<number, 0 | 1>();
    const compEdges: [number, number][] = [];
    const queue: number[] = [start];
    color.set(start, 0);
    globalSeen.add(start);
    while (queue.length) {
      const cur = queue.shift()!;
      const cc = color.get(cur)!;
      for (const nb of adj.get(cur) ?? []) {
        if (!color.has(nb)) {
          color.set(nb, (cc === 0 ? 1 : 0) as 0 | 1);
          globalSeen.add(nb);
          queue.push(nb);
        }
      }
    }
    // collect edges within this component
    for (const [a, b] of edges) {
      if (color.has(a) && color.has(b)) compEdges.push([a, b]);
    }
    if (color.size >= 2) comps.push({ color, edges: compEdges });
  }
  return comps;
}

function colorCells(comp: ColorComponent, which: 0 | 1): number[] {
  const out: number[] = [];
  for (const [cell, col] of comp.color) if (col === which) out.push(cell);
  return out;
}

function pathLinks(comp: ColorComponent, digit: number): Link[] {
  return comp.edges.map(([a, b]) => ({
    from: { cell: a, digit },
    to: { cell: b, digit },
    type: 'strong' as const,
  }));
}

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      const comps = buildComponents(grid, digit);
      for (const comp of comps) {
        const colorA = colorCells(comp, 0);
        const colorB = colorCells(comp, 1);

        // --- Color Wrap: two same-coloured candidates see each other. ---
        for (const [cells, which] of [
          [colorA, 0],
          [colorB, 1],
        ] as const) {
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
              if (sees(cells[i]!, cells[j]!)) {
                // that colour is false → eliminate all candidates of that colour.
                const elims: CellDigit[] = cells.map((c) => ({ cell: c, digit }));
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...comp.color.keys()],
                    candidates: [...comp.color.keys()].map((c) => ({ cell: c, digit })),
                    links: pathLinks(comp, digit),
                  },
                  explanation: {
                    zh: `简单染色(同色互见 Color Wrap):数字 ${digit} 的共轭链中,同色格 ${cellLabel(cells[i]!)} 与 ${cellLabel(cells[j]!)} 互相可见,该色不可能成立,故该色全部候选可排除 ${digit}。`,
                    en: `Simple Coloring (Color Wrap): in the conjugate chain of ${digit}, same-colour cells ${cellLabel(cells[i]!)} and ${cellLabel(cells[j]!)} see each other, so that colour is false; all its candidates drop ${digit}.`,
                  },
                };
              }
            }
          }
          void which;
        }

        // --- Color Trap: uncoloured candidate seeing both colours. ---
        const colored = new Set(comp.color.keys());
        const elims: CellDigit[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || !grid.hasCandidate(c, digit)) continue;
          if (colored.has(c)) continue;
          const seesA = colorA.some((x) => sees(c, x));
          const seesB = colorB.some((x) => sees(c, x));
          if (seesA && seesB) elims.push({ cell: c, digit });
        }
        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...comp.color.keys()],
              candidates: [...comp.color.keys()].map((c) => ({ cell: c, digit })),
              links: pathLinks(comp, digit),
            },
            explanation: {
              zh: `简单染色(异色夹击 Color Trap):数字 ${digit} 的双色链中,某未染色候选同时可见两种颜色;两色必有一真,故该候选可排除 ${digit}。`,
              en: `Simple Coloring (Color Trap): an uncoloured ${digit} candidate sees both colours of the conjugate chain; one colour must be true, so it can drop ${digit}.`,
            },
          };
        }
      }
    }
    return null;
  },
};
