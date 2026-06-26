import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function tryRemotePairs(grid: Grid): Step | null {
  const bivalue: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
  }

  for (const startCell of bivalue) {
    const startMask = grid.candidatesOf(startCell);
    const [d1, d2] = digitsOf(startMask) as [number, number];
    const startKey = `${Math.min(d1, d2)}-${Math.max(d1, d2)}`;

    const visited = new Set<number>([startCell]);
    const path: number[] = [startCell];
    const maxDepth = 10;

    function dfs(cell: number): Step | null {
      if (path.length >= 3) {
        const last = path[path.length - 1]!;
        const first = path[0]!;
        if (last !== first && (PEERS_OF[first]!.includes(last))) {
          const sharedPeers = commonPeers(first, last).filter(
            (c) => !path.includes(c) && grid.hasCandidate(c, d1) && grid.hasCandidate(c, d2),
          );
          if (sharedPeers.length > 0) {
            const links: Link[] = [];
            for (let i = 0; i < path.length - 1; i++) {
              links.push({
                from: { cell: path[i]!, digit: d1 },
                to: { cell: path[i + 1]!, digit: d1 },
                type: i % 2 === 0 ? 'strong' : 'weak',
              });
            }
            const eliminations = sharedPeers.map((c) => ({ cell: c, digit: d1 }));
            const eliminations2 = sharedPeers.map((c) => ({ cell: c, digit: d2 }));
            return {
              strategyId: 'remote-pairs',
              placements: [],
              eliminations: [...eliminations, ...eliminations2],
              highlights: {
                cells: [...path, ...sharedPeers],
                candidates: [
                  ...path.flatMap((c) => [{ cell: c, digit: d1 }, { cell: c, digit: d2 }]),
                  ...eliminations,
                  ...eliminations2,
                ],
                links,
              },
              explanation: {
                zh: `远程双值数：双值链 ${path.map((c) => cellLabel(c)).join('→')} 两端均为 {${d1},${d2}}，消去同时可见两端格中的 ${d1} 和 ${d2}。`,
                en: `Remote Pairs: bivalue chain ${path.map((c) => cellLabel(c)).join('→')} has {${d1},${d2}} at both ends; eliminate ${d1} and ${d2} from peers of both endpoints.`,
              },
            };
          }
        }
      }

      if (path.length >= maxDepth) return null;
      const peers = PEERS_OF[cell]!;

      for (const next of bivalue) {
        if (visited.has(next)) continue;
        if (!peers.includes(next)) continue;
        const nextMask = grid.candidatesOf(next);
        const nextPair = `${Math.min(...digitsOf(nextMask))}-${Math.max(...digitsOf(nextMask))}`;
        if (nextPair !== startKey) continue;

        visited.add(next);
        path.push(next);
        const result = dfs(next);
        path.pop();
        visited.delete(next);
        if (result) return result;
      }

      return null;
    }

    const result = dfs(startCell);
    if (result) return result;
  }

  return null;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程双值数', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid: Grid): Step | null {
    return tryRemotePairs(grid);
  },
};