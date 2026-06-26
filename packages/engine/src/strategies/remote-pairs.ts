/**
 * Remote Pairs (P1) — 远程对
 *
 * A chain of bivalue cells all carrying the same candidate pair {a,b},
 * where consecutive cells see each other. Cells at an odd graph distance
 * (i.e., an even number of cells in the chain) hold the same digit;
 * any outside cell that sees both endpoints cannot be a or b.
 */

import { CELLS, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const pairGroups = new Map<string, number[]>();
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const mask = grid.candidatesOf(cell);
      if (popcount(mask) !== 2) continue;
      const [d1, d2] = digitsOf(mask) as [number, number];
      const key = `${Math.min(d1, d2)}-${Math.max(d1, d2)}`;
      pairGroups.set(key, [...(pairGroups.get(key) ?? []), cell]);
    }

    for (const [pairKey, cells] of pairGroups) {
      if (cells.length < 2) continue;
      const [a, b] = pairKey.split('-').map(Number) as [number, number];

      const adj = new Map<number, number[]>();
      for (const c of cells) adj.set(c, []);
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const u = cells[i]!;
          const v = cells[j]!;
          if (PEERS_OF[u]!.includes(v)) {
            adj.get(u)!.push(v);
            adj.get(v)!.push(u);
          }
        }
      }

      const color = new Map<number, 0 | 1>();
      for (const start of cells.sort((x, y) => x - y)) {
        if (color.has(start)) continue;
        const comp: number[] = [];
        const queue: Array<{ cell: number; c: 0 | 1 }> = [{ cell: start, c: 0 }];
        color.set(start, 0);
        while (queue.length) {
          const { cell, c } = queue.shift()!;
          comp.push(cell);
          for (const nb of adj.get(cell) ?? []) {
            if (color.has(nb)) continue;
            color.set(nb, (1 - c) as 0 | 1);
            queue.push({ cell: nb, c: (1 - c) as 0 | 1 });
          }
        }

        // Opposite colors have the same digit (odd graph distance = even cell count).
        for (const [colA, colB] of [[0, 1], [1, 0]] as const) {
          const groupA = comp.filter((c) => color.get(c) === colA).sort((x, y) => x - y);
          const groupB = comp.filter((c) => color.get(c) === colB).sort((x, y) => x - y);
          for (let i = 0; i < groupA.length; i++) {
            for (let j = 0; j < groupB.length; j++) {
              const u = groupA[i]!;
              const v = groupB[j]!;
              const peers = commonPeers(u, v).filter((c) => c !== u && c !== v);
              const elims: { cell: number; digit: number }[] = [];
              for (const c of peers) {
                if (grid.get(c) !== 0) continue;
                if (grid.hasCandidate(c, a)) elims.push({ cell: c, digit: a });
                if (grid.hasCandidate(c, b)) elims.push({ cell: c, digit: b });
              }
              if (elims.length === 0) continue;

              const path = bfsPath(adj, u, v);
              const links: Link[] = [];
              if (path) {
                for (let k = 0; k < path.length; k++) {
                  links.push({ from: { cell: path[k]!, digit: a }, to: { cell: path[k]!, digit: b }, type: 'strong' });
                  if (k < path.length - 1) {
                    links.push({ from: { cell: path[k]!, digit: b }, to: { cell: path[k + 1]!, digit: a }, type: 'weak' });
                  }
                }
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...(path ?? [u, v]), ...elims.map((e) => e.cell)],
                  candidates: [
                    ...(path ?? [u, v]).flatMap((c) => [
                      { cell: c, digit: a },
                      { cell: c, digit: b },
                    ]),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `远程对：所有格均为 {${a},${b}} 的双值链 ${(path ?? [u, v]).map(cellLabel).join('→')}，异色端必为同一数字；消去能看到两端格的 ${a} 与 ${b}。`,
                  en: `Remote Pairs: all cells are {${a},${b}} bivalue chain ${(path ?? [u, v]).map(cellLabel).join('→')}; opposite-color endpoints hold the same digit, eliminating ${a} and ${b} from cells seeing both.`,
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

function bfsPath(adj: Map<number, number[]>, start: number, end: number): number[] | null {
  const queue: Array<{ cell: number; path: number[] }> = [{ cell: start, path: [start] }];
  const seen = new Set<number>([start]);
  while (queue.length) {
    const { cell, path } = queue.shift()!;
    if (cell === end) return path;
    for (const nb of adj.get(cell) ?? []) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      queue.push({ cell: nb, path: [...path, nb] });
    }
  }
  return null;
}
