/**
 * XY-Chain (T4) — XY 链
 */

import { buildLinkGraph, nodeKey, type ChainNode, type GraphEdge } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';
import type { Grid } from '../grid.js';
import { CELLS, PEERS_OF, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Step, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function buildXYChainGraph(grid: Grid): import('../chain/graph.js').LinkGraph {
  const nodes: ChainNode[] = [];
  const indexOfKey = new Map<string, number>();

  function ensureNode(digit: number, cell: number): number {
    const key = nodeKey(digit, [cell]);
    let idx = indexOfKey.get(key);
    if (idx === undefined) {
      idx = nodes.length;
      nodes.push({ digit, cells: [cell], key });
      indexOfKey.set(key, idx);
    }
    return idx;
  }

  const bivalues: { cell: number; ds: [number, number] }[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) === 2) {
      const ds = digitsOf(m) as [number, number];
      bivalues.push({ cell: c, ds });
      ensureNode(ds[0], c);
      ensureNode(ds[1], c);
    }
  }

  const adjacency: GraphEdge[][] = nodes.map(() => []);
  const seenEdge = new Set<string>();

  function addEdge(i: number, j: number, type: LinkType): void {
    if (i === j) return;
    const k = `${i}|${j}|${type}`;
    if (seenEdge.has(k)) return;
    seenEdge.add(k);
    adjacency[i]!.push({ to: j, type });
    adjacency[j]!.push({ to: i, type });
  }

  // 1. Add strong links inside each bivalue cell
  for (const bv of bivalues) {
    const i1 = indexOfKey.get(nodeKey(bv.ds[0], [bv.cell]))!;
    const i2 = indexOfKey.get(nodeKey(bv.ds[1], [bv.cell]))!;
    addEdge(i1, i2, 'strong');
  }

  // 2. Add weak links between bivalue cells that see each other and share a digit
  for (let a = 0; a < bivalues.length; a++) {
    for (let b = a + 1; b < bivalues.length; b++) {
      const ba = bivalues[a]!;
      const bb = bivalues[b]!;
      if (PEERS_OF[ba.cell]!.includes(bb.cell)) {
        for (const d of ba.ds) {
          if (bb.ds.includes(d)) {
            const i1 = indexOfKey.get(nodeKey(d, [ba.cell]))!;
            const i2 = indexOfKey.get(nodeKey(d, [bb.cell]))!;
            addEdge(i1, i2, 'weak');
          }
        }
      }
    }
  }

  return { nodes, adjacency, indexOfKey };
}

export function makeXYChain(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'xy-chain',
    name: { zh: 'XY-Chain', en: 'XY-Chain' },
    difficulty: 715,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: false }); // Wait, let's build the bivalue only graph
      // To ensure we only visit bivalue cells:
      const xyGraph = buildXYChainGraph(grid);
      const result = searchAic(grid, xyGraph, policy);

      if (result && result.eliminations.length > 0) {
        const start = xyGraph.nodes[result.startNode]!;
        const end = xyGraph.nodes[result.endNode]!;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i) => xyGraph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i) =>
              xyGraph.nodes[i]!.cells.map((c) => ({ cell: c, digit: xyGraph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `XY-Chain：双值格链，数字 ${start.digit} 沿双值格首尾连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故其公共可见格可排除 ${start.digit}。`,
            en: `XY-Chain: bivalue-cell chain, digit ${start.digit} forms alternating chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${start.digit}.`,
          },
        };
      }
      return null;
    },
  };
}

export const xyChain: Strategy = makeXYChain();

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const pairsMap = new Map<string, number[]>();
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        if (popcount(mask) === 2) {
          const digits = digitsOf(mask);
          const key = `${digits[0]}-${digits[1]}`;
          if (!pairsMap.has(key)) pairsMap.set(key, []);
          pairsMap.get(key)!.push(c);
        }
      }
    }

    for (const [key, cells] of pairsMap) {
      const [d1, d2] = key.split('-').map(Number) as [number, number];
      const bit1 = maskOf(d1);
      const bit2 = maskOf(d2);

      const adj = new Map<number, number[]>();
      for (const u of cells) {
        adj.set(u, []);
        for (const v of cells) {
          if (u !== v && PEERS_OF[u]!.includes(v)) {
            adj.get(u)!.push(v);
          }
        }
      }

      for (const start of cells) {
        const dist = new Map<number, number>();
        const parent = new Map<number, number>();
        const queue: number[] = [start];
        dist.set(start, 0);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const currDist = dist.get(curr)!;
          for (const neighbor of adj.get(curr) ?? []) {
            if (!dist.has(neighbor)) {
              dist.set(neighbor, currDist + 1);
              parent.set(neighbor, curr);
              queue.push(neighbor);
            }
          }
        }

        for (const end of cells) {
          if (start === end) continue;
          const d = dist.get(end);
          if (d !== undefined && d % 2 === 1 && d >= 3) {
            const elims: { cell: number; digit: number }[] = [];
            const peersStart = new Set(PEERS_OF[start]!);
            const peersEnd = new Set(PEERS_OF[end]!);

            const pathCells: number[] = [];
            let curr = end;
            while (curr !== start) {
              pathCells.push(curr);
              curr = parent.get(curr)!;
            }
            pathCells.push(start);

            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (pathCells.includes(c)) continue;
              if (peersStart.has(c) && peersEnd.has(c)) {
                const mask = grid.candidatesOf(c);
                if (mask & bit1) elims.push({ cell: c, digit: d1 });
                if (mask & bit2) elims.push({ cell: c, digit: d2 });
              }
            }

            if (elims.length > 0) {
              return {
                strategyId: 'remote-pairs',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...pathCells, ...elims.map(e => e.cell)],
                  candidates: [
                    ...pathCells.flatMap(c => [{ cell: c, digit: d1 }, { cell: c, digit: d2 }]),
                    ...elims,
                  ],
                  links: Array.from({ length: pathCells.length - 1 }, (_, idx) => ({
                    from: { cell: pathCells[idx]!, digit: d1 },
                    to: { cell: pathCells[idx + 1]!, digit: d1 },
                    type: 'strong' as const,
                  })),
                },
                explanation: {
                  zh: `远程数对：格 R${ROW_OF[start]!+1}C${COL_OF[start]!+1} 和 R${ROW_OF[end]!+1}C${COL_OF[end]!+1} 之间有一条由相同双值数对 {${d1},${d2}} 构成的奇数长度链（距离为 ${d}）；首尾格必定互为对立，消去共同能看到的格子中的 ${d1} 和 ${d2}。`,
                  en: `Remote Pairs: a chain of identical bivalue cells {${d1},${d2}} of odd distance ${d} between cells R${ROW_OF[start]!+1}C${COL_OF[start]!+1} and R${ROW_OF[end]!+1}C${COL_OF[end]!+1}; they must hold opposite values; eliminate ${d1} and ${d2} from their common peers.`,
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
