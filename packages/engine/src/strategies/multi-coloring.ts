import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function buildChains(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];
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

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色法', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const components = buildChains(grid, d);
      if (components.length < 2) continue;

      const bit = maskOf(d);

      for (let ci = 0; ci < components.length; ci++) {
        for (let cj = ci + 1; cj < components.length; cj++) {
          const compA = components[ci]!;
          const compB = components[cj]!;

          const color0A: number[] = [];
          const color1A: number[] = [];
          for (const [cell, color] of compA) {
            if (color === 0) color0A.push(cell); else color1A.push(cell);
          }
          const color0B: number[] = [];
          const color1B: number[] = [];
          for (const [cell, color] of compB) {
            if (color === 0) color0B.push(cell); else color1B.push(cell);
          }

          let weakLinkFound = false;
          let weakA = 0;
          let weakB = 0;
          for (const ca of compA.keys()) {
            for (const cb of compB.keys()) {
              if (PEERS_OF[ca]!.includes(cb)) {
                weakLinkFound = true;
                weakA = compA.get(ca)!;
                weakB = compB.get(cb)!;
                break;
              }
            }
            if (weakLinkFound) break;
          }
          if (!weakLinkFound) continue;

          const oppositeA = weakA === 0 ? color1A : color0A;
          const oppositeB = weakB === 0 ? color1B : color0B;

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (compA.has(c) || compB.has(c) || grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & bit)) continue;
            const peers = new Set(PEERS_OF[c]!);
            const seesOppA = oppositeA.some((x) => peers.has(x));
            const seesOppB = oppositeB.some((x) => peers.has(x));
            if (seesOppA && seesOppB) {
              elims.push({ cell: c, digit: d });
            }
          }

          if (elims.length > 0) {
            const allChainCells = [...compA.keys(), ...compB.keys()];
            return {
              strategyId: 'multi-coloring',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...allChainCells, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...allChainCells.map((c) => ({ cell: c, digit: d })),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `多重染色法：数字 ${d} 的两个独立集群通过弱链连接；可见两集群反色的格可排除 ${d}。`,
                en: `Multi-Coloring: two independent clusters of digit ${d} are weakly linked; cells seeing opposite colors of both clusters can eliminate ${d}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};