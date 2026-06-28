import {
  CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    const pairGroups = new Map<string, number[]>();
    for (const c of bivalueCells) {
      const digits = digitsOf(grid.candidatesOf(c));
      const key = `${digits[0]},${digits[1]}`;
      if (!pairGroups.has(key)) pairGroups.set(key, []);
      pairGroups.get(key)!.push(c);
    }

    for (const [key, cells] of pairGroups) {
      if (cells.length < 4) continue;
      const [d1, d2] = key.split(',').map(Number) as [number, number];

      const adj = new Map<number, number[]>();
      for (const c of cells) adj.set(c, []);
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (PEERS_OF[cells[i]!]!.includes(cells[j]!)) {
            adj.get(cells[i]!)!.push(cells[j]!);
            adj.get(cells[j]!)!.push(cells[i]!);
          }
        }
      }

      for (const start of cells) {
        const visited = new Map<number, number>();
        visited.set(start, 0);
        const queue = [start];
        while (queue.length > 0) {
          const cur = queue.shift()!;
          const dist = visited.get(cur)!;
          for (const next of adj.get(cur)!) {
            if (!visited.has(next)) {
              visited.set(next, dist + 1);
              queue.push(next);
            }
          }
        }

        for (const [end, dist] of visited) {
          if (dist < 3 || dist % 2 === 0) continue;
          if (end <= start) continue;

          const peersStart = new Set(PEERS_OF[start]!);
          const peersEnd = new Set(PEERS_OF[end]!);
          const elims: { cell: number; digit: number }[] = [];

          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (c === start || c === end) continue;
            if (!peersStart.has(c) || !peersEnd.has(c)) continue;
            if (grid.hasCandidate(c, d1)) elims.push({ cell: c, digit: d1 });
            if (grid.hasCandidate(c, d2)) elims.push({ cell: c, digit: d2 });
          }

          if (elims.length === 0) continue;

          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [start, end, ...elims.map((e) => e.cell)],
              candidates: [
                { cell: start, digit: d1 }, { cell: start, digit: d2 },
                { cell: end, digit: d1 }, { cell: end, digit: d2 },
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `远程数对：${cellLabel(start)}和${cellLabel(end)}（均含{${d1},${d2}}）通过${dist}条链连接（奇数距离）；消去同时看到两端的格中的${d1}和${d2}。`,
              en: `Remote Pairs: ${cellLabel(start)} and ${cellLabel(end)} (both {${d1},${d2}}) connected by ${dist} links (odd distance); eliminate ${d1} and ${d2} from cells seeing both endpoints.`,
            },
          };
        }
      }
    }
    return null;
  },
};
