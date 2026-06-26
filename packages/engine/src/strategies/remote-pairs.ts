import {
  CELLS, PEERS_OF, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // Collect all bivalue cells in the grid
    const bivalueCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    // Group bivalue cells by their candidate digit pair
    const groups = new Map<string, number[]>();
    for (const c of bivalueCells) {
      const ds = digitsOf(grid.candidatesOf(c));
      const key = `${ds[0]!},${ds[1]!}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(c);
    }

    // For each identical bivalue pair group:
    for (const [key, cells] of groups.entries()) {
      const [A, B] = key.split(',').map(Number) as [number, number];
      const maskAB = maskOf(A) | maskOf(B);

      // We build components of the sight-graph among these cells
      const n = cells.length;
      if (n < 4) continue; // Remote Pairs need at least 4 cells for length 3+ path (since distance >= 3)

      const visited = new Set<number>();
      for (let s = 0; s < n; s++) {
        if (visited.has(s)) continue;

        // BFS to find connected component and 2-color it
        const color = new Map<number, number>();
        const queue = [s];
        color.set(s, 0);

        const compIndices: number[] = [];
        let isBipartite = true;

        while (queue.length > 0) {
          const u = queue.shift()!;
          compIndices.push(u);
          const cU = color.get(u)!;
          const cOpp = 1 - cU;

          const cellU = cells[u]!;
          for (let v = 0; v < n; v++) {
            if (u === v) continue;
            const cellV = cells[v]!;
            if (PEERS_OF[cellU]!.includes(cellV)) {
              if (color.has(v)) {
                if (color.get(v) === cU) {
                  isBipartite = false;
                }
              } else {
                color.set(v, cOpp);
                queue.push(v);
              }
            }
          }
        }

        // Add to visited
        for (const idx of compIndices) visited.add(idx);

        if (!isBipartite) continue; // Skip if sight graph is not bipartite (contradiction in candidates)

        const group0 = compIndices.filter(idx => color.get(idx) === 0).map(idx => cells[idx]!);
        const group1 = compIndices.filter(idx => color.get(idx) === 1).map(idx => cells[idx]!);

        // Find pairs of (u, v) with opposite colors (odd distance)
        for (const u of group0) {
          for (const v of group1) {
            // Check if they don't see each other (since if they do, it's just a Naked Pair or trivial)
            if (PEERS_OF[u]!.includes(v)) continue;

            // Find common peers seeing both u and v having candidates A or B
            const elims: { cell: number; digit: number }[] = [];
            for (let t = 0; t < CELLS; t++) {
              if (grid.get(t) === 0 && t !== u && t !== v) {
                const hasA = (grid.candidatesOf(t) & maskOf(A)) !== 0;
                const hasB = (grid.candidatesOf(t) & maskOf(B)) !== 0;
                if (hasA || hasB) {
                  const seesU = PEERS_OF[t]!.includes(u);
                  const seesV = PEERS_OF[t]!.includes(v);
                  if (seesU && seesV) {
                    if (hasA) elims.push({ cell: t, digit: A });
                    if (hasB) elims.push({ cell: t, digit: B });
                  }
                }
              }
            }

            if (elims.length > 0) {
              const chainCells = compIndices.map(idx => cells[idx]!);
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...chainCells, ...elims.map(e => e.cell)])],
                  candidates: [
                    ...chainCells.flatMap(c => [{ cell: c, digit: A }, { cell: c, digit: B }]),
                    ...elims
                  ],
                  links: []
                },
                explanation: {
                  zh: `远程数对：格 ${cellLabel(u)} 和 ${cellLabel(v)} 均含数对 {${A},${B}}，它们在相同双值数对连通块中处于奇数距离；因此一格为 ${A} 时另一格必为 ${B}。消去同时看到两格的格子中的 ${A} 和 ${B}。`,
                  en: `Remote Pairs: cells ${cellLabel(u)} and ${cellLabel(v)} share pair {${A},${B}} and are at odd distance in the bivalue component; one must be ${A} and the other ${B}. Eliminate ${A} and ${B} from cells seeing both.`
                }
              };
            }
          }
        }
      }
    }
    return null;
  }
};
