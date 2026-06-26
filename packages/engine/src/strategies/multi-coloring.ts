/**
 * Multi-Coloring (P1) — 多重染色法 / Multi-Colors
 *
 * Single-digit extension of Simple Coloring across multiple conjugate-pair
 * clusters. Implements Multi-Colors Type 1: two disjoint clusters with a weak
 * link between them yield eliminations on cells seeing the two opposite colors.
 */

import { CELLS, HOUSES, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function buildClusters(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
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
  const visited = new Set<number>();
  const comps: Array<Map<number, 0 | 1>> = [];
  for (const start of [...adj.keys()].sort((a, b) => a - b)) {
    if (visited.has(start)) continue;
    const comp = new Map<number, 0 | 1>();
    const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);
    while (queue.length) {
      const { cell, color } = queue.shift()!;
      for (const nb of adj.get(cell) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const nextColor = (1 - color) as 0 | 1;
        comp.set(nb, nextColor);
        queue.push({ cell: nb, color: nextColor });
      }
    }
    if (comp.size >= 2) comps.push(comp);
  }
  return comps;
}

function clusterColorCells(comp: Map<number, 0 | 1>): { color0: number[]; color1: number[] } {
  const color0: number[] = [];
  const color1: number[] = [];
  for (const [cell, color] of comp) {
    if (color === 0) color0.push(cell);
    else color1.push(cell);
  }
  return { color0, color1 };
}

function shareHouse(a: number, b: number): boolean {
  const ra = Math.floor(a / 9), ca = a % 9;
  const rb = Math.floor(b / 9), cb = b % 9;
  return ra === rb || ca === cb || (Math.floor(ra / 3) * 3 + Math.floor(ca / 3)) === (Math.floor(rb / 3) * 3 + Math.floor(cb / 3));
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色法', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const clusters = buildClusters(grid, d);
      if (clusters.length < 2) continue;

      // Multi-Colors Type 1: weak link between clusters.
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const ci = clusters[i]!;
          const cj = clusters[j]!;
          const { color0: ci0, color1: ci1 } = clusterColorCells(ci);
          const { color0: cj0, color1: cj1 } = clusterColorCells(cj);

          for (const [linkedA, linkedB, oppositeA, oppositeB] of [
            [ci0, cj0, ci1, cj1],
            [ci0, cj1, ci1, cj0],
            [ci1, cj0, ci0, cj1],
            [ci1, cj1, ci0, cj0],
          ] as const) {
            let linked = false;
            for (const a of linkedA) {
              for (const aa of linkedB) {
                if (shareHouse(a, aa)) { linked = true; break; }
              }
              if (linked) break;
            }
            if (!linked) continue;

            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & bit)) continue;
              if (ci.has(c) || cj.has(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (oppositeA.some((x) => peers.has(x)) && oppositeB.some((x) => peers.has(x))) {
                elims.push({ cell: c, digit: d });
              }
            }
            if (elims.length === 0) continue;

            const allCells = [...ci.keys(), ...cj.keys()];
            const links: Link[] = [];
            for (const comp of [ci, cj]) {
              for (const house of HOUSES) {
                const pair = [...house].filter((c) => comp.has(c) && (grid.candidatesOf(c) & bit)).sort((a, b) => a - b);
                if (pair.length === 2) {
                  links.push({ from: { cell: pair[0]!, digit: d }, to: { cell: pair[1]!, digit: d }, type: 'strong' });
                }
              }
            }
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...allCells, ...elims.map((e) => e.cell)],
                candidates: [...allCells.map((c) => ({ cell: c, digit: d })), ...elims],
                links,
              },
              explanation: {
                zh: `多重染色法：数字 ${d} 的两簇存在弱链，至少一簇的异色为真；消去同时看到两异色的格中的 ${d}。`,
                en: `Multi-Coloring: digit ${d} clusters have a weak link; at least one opposite color is true, eliminating ${d} from cells seeing both opposites.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
