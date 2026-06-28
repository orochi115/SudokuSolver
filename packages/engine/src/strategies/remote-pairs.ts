import {
  CELLS, ROW_OF, COL_OF, maskOf, popcount, digitsOf, PEERS_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findRemotePairs(grid: Grid): Step | null {
  const bivalueCells: Array<{ cell: number; mask: number }> = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) === 2) bivalueCells.push({ cell: c, mask: m });
  }

  const byMask = new Map<number, number[]>();
  for (const { cell, mask } of bivalueCells) {
    if (!byMask.has(mask)) byMask.set(mask, []);
    byMask.get(mask)!.push(cell);
  }

  for (const [mask, cells] of byMask) {
    if (cells.length < 4) continue;
    const digits = digitsOf(mask);
    if (digits.length !== 2) continue;
    const [a, b] = digits as [number, number];

    const adj = new Map<number, number[]>();
    for (const ci of cells) {
      for (const cj of cells) {
        if (ci >= cj) continue;
        if (PEERS_OF[ci]!.includes(cj)) {
          if (!adj.has(ci)) adj.set(ci, []);
          if (!adj.has(cj)) adj.set(cj, []);
          adj.get(ci)!.push(cj);
          adj.get(cj)!.push(ci);
        }
      }
    }

    for (const start of cells) {
      const dist = new Map<number, number>();
      const queue: number[] = [start];
      dist.set(start, 0);
      while (queue.length > 0) {
        const cur = queue.shift()!;
        const curDist = dist.get(cur)!;
        for (const nb of adj.get(cur) ?? []) {
          if (!dist.has(nb)) {
            dist.set(nb, curDist + 1);
            if (curDist + 1 < 6) queue.push(nb);
          }
        }
      }

      for (const [end, d] of dist) {
        if (d < 3 || d % 2 === 0) continue;

        const eliminations: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (c === start || c === end) continue;
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & mask)) continue;
          if (PEERS_OF[c]!.includes(start) && PEERS_OF[c]!.includes(end)) {
            for (const digit of [a, b]) {
              if (grid.hasCandidate(c, digit)) {
                eliminations.push({ cell: c, digit });
              }
            }
          }
        }

        if (eliminations.length > 0) {
          return {
            strategyId: 'remote-pairs',
            placements: [],
            eliminations,
            highlights: {
              cells: [...new Set([start, end, ...eliminations.map((e) => e.cell)])],
              candidates: [
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `远程数对：同值 {${a},${b}} 链在格间形成远程对；消去能同时看到两端的格中的 ${a} 和 ${b}。`,
              en: `Remote Pairs: same-value {${a},${b}} chain forms remote pair; eliminate ${a} and ${b} from cells seeing both endpoints.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return findRemotePairs(grid);
  },
};