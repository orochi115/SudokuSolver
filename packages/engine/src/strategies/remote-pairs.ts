import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const bivalue: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
    }

    const pairMap = new Map<number, number[]>();
    for (const c of bivalue) {
      const mask = grid.candidatesOf(c);
      if (!pairMap.has(mask)) pairMap.set(mask, []);
      pairMap.get(mask)!.push(c);
    }

    for (const [mask, cells] of pairMap) {
      if (cells.length < 2) continue;
      const digits = digitsOf(mask);

      const adj = new Map<number, number[]>();
      for (const c of cells) {
        if (!adj.has(c)) adj.set(c, []);
        for (const other of cells) {
          if (other === c) continue;
          if (PEERS_OF[c]!.includes(other)) {
            adj.get(c)!.push(other);
          }
        }
      }

      for (const start of cells) {
        const visited = new Set<number>();
        const path: number[] = [];
        function dfs(current: number, depth: number): boolean {
          if (visited.has(current)) return false;
          visited.add(current);
          path.push(current);

          if (path.length >= 3 && (path.length % 2) === 1) {
            const first = path[0]!;
            const last = path[path.length - 1]!;
            const peersFirst = new Set(PEERS_OF[first]!);
            const commonPeers = PEERS_OF[last]!.filter((c) => peersFirst.has(c));
            const elims: { cell: number; digit: number }[] = [];
            for (const d of digits) {
              for (const cp of commonPeers) {
                if (cells.includes(cp)) continue;
                if (grid.hasCandidate(cp, d)) {
                  elims.push({ cell: cp, digit: d });
                }
              }
            }
            if (elims.length > 0) {
              return true;
            }
          }

          for (const neighbor of adj.get(current) ?? []) {
            if (!visited.has(neighbor)) {
              if (dfs(neighbor, depth + 1)) return true;
            }
          }
          path.pop();
          visited.delete(current);
          return false;
        }

        if (dfs(start, 0)) {
          const first = path[0]!;
          const last = path[path.length - 1]!;
          const peersFirst = new Set(PEERS_OF[first]!);
          const commonPeers = PEERS_OF[last]!.filter((c) => peersFirst.has(c));
          const elims: { cell: number; digit: number }[] = [];
          for (const d of digits) {
            for (const cp of commonPeers) {
              if (cells.includes(cp)) continue;
              if (grid.hasCandidate(cp, d)) {
                elims.push({ cell: cp, digit: d });
              }
            }
          }

          return {
            strategyId: 'remote-pairs',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...path, ...elims.map((e) => e.cell)],
              candidates: [
                ...path.flatMap((c) => digits.map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `远程对：双值对 {${digits.join(',')}} 通过链 ${path.map((c) => cellLabel(c)).join('-')} 连接，两端必为其一；消去公共可见格中的 ${digits.join(',')}。`,
              en: `Remote Pairs: bivalue pair {${digits.join(',')}} forms chain ${path.map((c) => cellLabel(c)).join('-')}; one end holds each digit; eliminate ${digits.join(',')} from common peers.`,
            },
          };
        }
      }
    }
    return null;
  },
};