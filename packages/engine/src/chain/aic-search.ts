import { maskOf, PEERS_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import type { LinkGraph, ChainNode } from './graph.js';
import { chainToLinks, type Chain } from './graph.js';
import type { ChainPolicy } from './policy.js';

export interface AicResult {
  eliminations: CellDigit[];
  placements: CellDigit[];
  links: Link[];
  chainNodes: number[];
  kind: 'type1' | 'type2' | 'discontinuous-loop' | 'continuous-loop';
  startNode: number;
  endNode: number;
}

function candSees(c1: number, c2: number): boolean {
  return c1 !== c2 && PEERS_OF[c1]!.includes(c2);
}

function seesAllOfNode(cell: number, node: ChainNode): boolean {
  if (node.cells.includes(cell)) return false;
  for (const nc of node.cells) if (!candSees(cell, nc)) return false;
  return true;
}

function endpointEliminations(grid: Grid, A: ChainNode, B: ChainNode): CellDigit[] {
  const out: CellDigit[] = [];
  if (A.digit === B.digit) {
    const digit = A.digit;
    const bit = maskOf(digit);
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
      if (A.cells.includes(c) || B.cells.includes(c)) continue;
      if (seesAllOfNode(c, A) && seesAllOfNode(c, B)) out.push({ cell: c, digit });
    }
    return out;
  }

  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
    const cell = A.cells[0]!;
    const m = grid.candidatesOf(cell);
    for (let d = 1; d <= SIZE; d++) {
      if (d === A.digit || d === B.digit) continue;
      if (m & maskOf(d)) out.push({ cell, digit: d });
    }
  }

  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] !== B.cells[0] && candSees(A.cells[0]!, B.cells[0]!)) {
    const aCell = A.cells[0]!;
    const bCell = B.cells[0]!;
    if (grid.hasCandidate(aCell, B.digit)) out.push({ cell: aCell, digit: B.digit });
    if (grid.hasCandidate(bCell, A.digit)) out.push({ cell: bCell, digit: A.digit });
  }
  return out;
}

export function searchAic(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  function tryEndpoints(chain: Chain): AicResult | null {
    if (chain.length < 2) return null;
    const startIdx = chain[0]!.node;
    const endIdx = chain[chain.length - 1]!.node;
    if (startIdx === endIdx) return null;
    const A = graph.nodes[startIdx]!;
    const B = graph.nodes[endIdx]!;
    const elims = endpointEliminations(grid, A, B);
    if (elims.length === 0) return null;
    return {
      eliminations: elims,
      placements: [],
      links: chainToLinks(graph, chain),
      chainNodes: chain.map((s) => s.node),
      kind: A.digit === B.digit ? 'type1' : 'type2',
      startNode: startIdx,
      endNode: endIdx,
    };
  }

  interface QItem {
    node: number;
    nextType: LinkType;
    chain: Chain;
    visited: Set<number>;
  }

  for (let s = 0; s < n; s++) {
    let budget = perStartBudget;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      const last = item.chain[item.chain.length - 1]!;
      if (item.chain.length >= 2 && last.incoming === 'strong') {
        const res = tryEndpoints(item.chain);
        if (res) return res;
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
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

export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const maxLen = policy.maxChainLength;

  function weakLinkEliminations(A: ChainNode, B: ChainNode): CellDigit[] {
    if (A.digit !== B.digit) return [];
    const out: CellDigit[] = [];
    const bit = maskOf(A.digit);
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
      if (A.cells.includes(cell) || B.cells.includes(cell)) continue;
      if (seesAllOfNode(cell, A) && seesAllOfNode(cell, B)) out.push({ cell, digit: A.digit });
    }
    return out;
  }

  for (let start = 0; start < graph.nodes.length; start++) {
    const stack: Array<{ node: number; nextType: LinkType; chain: Chain; visited: Set<number> }> = [
      { node: start, nextType: 'strong', chain: [{ node: start, incoming: null }], visited: new Set([start]) },
    ];
    while (stack.length > 0) {
      const item = stack.pop()!;
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (edge.to === start && item.chain.length >= 4) {
          const closed = [...item.chain, { node: start, incoming: edge.type }];
          const links = chainToLinks(graph, closed);
          const eliminations: CellDigit[] = [];
          for (let i = 1; i < closed.length; i++) {
            if (closed[i]!.incoming !== 'weak') continue;
            const a = graph.nodes[closed[i - 1]!.node]!;
            const b = graph.nodes[closed[i]!.node]!;
            eliminations.push(...weakLinkEliminations(a, b));
          }
          const seen = new Set<string>();
          const deduped = eliminations.filter((e) => {
            const key = `${e.cell}:${e.digit}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (deduped.length > 0) {
            return {
              eliminations: deduped,
              placements: [],
              links,
              chainNodes: closed.map((s) => s.node),
              kind: 'continuous-loop',
              startNode: start,
              endNode: start,
            };
          }
          continue;
        }
        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        stack.push({
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
