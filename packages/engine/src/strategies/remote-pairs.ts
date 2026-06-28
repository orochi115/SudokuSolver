import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
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
    // 1. Find all bivalue cells
    const bivalues: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalues.push(c);
      }
    }

    // Group bivalues by their candidate set (mask)
    const groups = new Map<number, number[]>();
    for (const c of bivalues) {
      const mask = grid.candidatesOf(c);
      if (!groups.has(mask)) {
        groups.set(mask, []);
      }
      groups.get(mask)!.push(c);
    }

    // 2. Search for Remote Pairs in each group
    for (const [mask, cells] of groups.entries()) {
      if (cells.length < 4) continue; // Need at least 4 cells to have a path of length >= 3

      const [A, B] = digitsOf(mask) as [number, number];
      const bitA = maskOf(A);
      const bitB = maskOf(B);

      // Build adjacency list for this group
      const adj = new Map<number, number[]>();
      for (const u of cells) {
        adj.set(u, []);
        for (const v of cells) {
          if (u !== v && PEERS_OF[u]!.includes(v)) {
            adj.get(u)!.push(v);
          }
        }
      }

      // For each cell u, run BFS to find shortest path to other cells
      for (const u of cells) {
        const dist = new Map<number, number>();
        const parent = new Map<number, number>();
        const queue = [u];
        dist.set(u, 0);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const d = dist.get(curr)!;

          for (const nb of adj.get(curr) ?? []) {
            if (!dist.has(nb)) {
              dist.set(nb, d + 1);
              parent.set(nb, curr);
              queue.push(nb);
            }
          }
        }

        // Check each cell v that is at an odd distance >= 3
        for (const v of cells) {
          if (u === v) continue;
          const d = dist.get(v);
          if (d !== undefined && d % 2 === 1 && d >= 3) {
            // Reconstruct path
            const path: number[] = [];
            let curr = v;
            while (curr !== u) {
              path.push(curr);
              curr = parent.get(curr)!;
            }
            path.push(u);

            // Find eliminations
            const elims: { cell: number; digit: number }[] = [];
            for (let t = 0; t < CELLS; t++) {
              if (grid.get(t) !== 0) continue;
              if (path.includes(t)) continue;

              if (PEERS_OF[t]!.includes(u) && PEERS_OF[t]!.includes(v)) {
                const tMask = grid.candidatesOf(t);
                if (tMask & bitA) elims.push({ cell: t, digit: A });
                if (tMask & bitB) elims.push({ cell: t, digit: B });
              }
            }

            if (elims.length > 0) {
              const links = [];
              for (let idx = 0; idx < path.length - 1; idx++) {
                const c1 = path[idx]!;
                const c2 = path[idx + 1]!;
                links.push({
                  from: { cell: c1, digit: A },
                  to: { cell: c2, digit: B },
                  type: 'weak' as const, // can label as alternating or weak links
                });
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...path, ...elims.map((e) => e.cell)],
                  candidates: [
                    ...path.flatMap((c) => [{ cell: c, digit: A }, { cell: c, digit: B }]),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `远程数对：相同双值格链 {${cellLabel(u)}} -- {${cellLabel(v)}} 的距离为奇数 ${d}；消去能同时看到两端点格子的候选数 ${A} 和 ${B}。`,
                  en: `Remote Pairs: chain of identical bivalue cells {${cellLabel(u)}} -- {${cellLabel(v)}} has odd distance ${d}; eliminate candidates ${A} and ${B} from cells seeing both endpoints.`,
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
