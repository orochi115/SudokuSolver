import { maskOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link } from '../trace.js';
import type { LinkGraph } from './graph.js';
import { chainToLinks, type Chain } from './graph.js';
import type { ChainPolicy } from './policy.js';
import { isBivalueNode } from './loop-search.js';

export interface XyChainResult {
  eliminations: CellDigit[];
  links: Link[];
  chainNodes: number[];
  startNode: number;
  endNode: number;
  endDigit: number;
}

function seesAllOfNode(cell: number, nodeCells: readonly number[]): boolean {
  if (nodeCells.includes(cell)) return false;
  for (const nc of nodeCells) if (!PEERS_OF[cell]!.includes(nc)) return false;
  return true;
}

function endpointEliminations(grid: Grid, start: { cells: number[]; digit: number }, end: { cells: number[]; digit: number }): CellDigit[] {
  if (start.digit !== end.digit) return [];
  const digit = start.digit;
  const bit = maskOf(digit);
  const out: CellDigit[] = [];
  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (start.cells.includes(c) || end.cells.includes(c)) continue;
    if (seesAllOfNode(c, start.cells) && seesAllOfNode(c, end.cells)) out.push({ cell: c, digit });
  }
  return out;
}

function bivalueNodeIndices(graph: LinkGraph, grid: Grid): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < graph.nodes.length; i++) {
    if (isBivalueNode(grid, graph.nodes[i]!)) out.add(i);
  }
  return out;
}

export function searchXyChain(grid: Grid, graph: LinkGraph, policy: ChainPolicy): XyChainResult | null {
  const allowed = bivalueNodeIndices(graph, grid);
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  interface QItem {
    node: number;
    nextType: 'strong' | 'weak';
    chain: Chain;
    visited: Set<number>;
  }

  for (let s = 0; s < n; s++) {
    if (!allowed.has(s)) continue;
    let budget = perStartBudget;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];

    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      const last = item.chain[item.chain.length - 1]!;

      if (item.chain.length >= 3 && last.incoming === 'strong') {
        const startIdx = item.chain[0]!.node;
        const endIdx = last.node;
        if (startIdx !== endIdx) {
          const A = graph.nodes[startIdx]!;
          const B = graph.nodes[endIdx]!;
          if (allowed.has(endIdx) && A.digit === B.digit) {
            const elims = endpointEliminations(grid, A, B);
            if (elims.length > 0) {
              return {
                eliminations: elims,
                links: chainToLinks(graph, item.chain),
                chainNodes: item.chain.map((st) => st.node),
                startNode: startIdx,
                endNode: endIdx,
                endDigit: A.digit,
              };
            }
          }
        }
      }

      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (!allowed.has(edge.to)) continue;
        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        queue.push({
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          visited,
        });
      }
    }
  }
  return null;
}