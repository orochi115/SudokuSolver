/**
 * Nice-Loop search over the unified AIC graph.
 *
 * A Nice Loop is a cycle of alternating strong/weak links where the start node
 * equals the end node (continuous) or where the start/end nodes are conjugate
 * within the same cell (discontinuous).
 */

import { maskOf, PEERS_OF, HOUSES, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { AicResult } from './aic-search.js';
import type { LinkGraph, ChainNode, ChainStep, Chain } from './graph.js';
import { chainToLinks } from './graph.js';
import type { ChainPolicy } from './policy.js';
import type { CellDigit } from '../trace.js';

function seesAllOfNode(cell: number, node: ChainNode): boolean {
  if (node.cells.includes(cell)) return false;
  for (const nc of node.cells) {
    if (cell === nc) continue;
    if (Math.floor(ROW_OF[cell]! / 3) !== Math.floor(ROW_OF[nc]! / 3) ||
        Math.floor(COL_OF[cell]! / 3) !== Math.floor(COL_OF[nc]! / 3) ||
        ROW_OF[cell]! !== ROW_OF[nc]! ||
        COL_OF[cell]! !== COL_OF[nc]!) continue;
    return true;
  }
  return false;
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

  // W-Wing / XY-Chain cell: single cell with both A.digit and B.digit
  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
    const cell = A.cells[0]!;
    const m = grid.candidatesOf(cell);
    for (let d = 1; d <= 9; d++) {
      if (d === A.digit || d === B.digit) continue;
      if (m & maskOf(d)) out.push({ cell, digit: d });
    }
  }

  // Remote-Pairs / XY-Chain peer: two cells seeing one another
  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] !== B.cells[0]) {
    const aCell = A.cells[0]!;
    const bCell = B.cells[0]!;
    if (PEERS_OF[aCell]!.includes(bCell)) {
      if (grid.hasCandidate(aCell, B.digit)) out.push({ cell: aCell, digit: B.digit });
      if (grid.hasCandidate(bCell, A.digit)) out.push({ cell: bCell, digit: A.digit });
    }
  }

  return out;
}

export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  function tryContinuous(path: Chain): AicResult | null {
    const start = graph.nodes[path[0]!.node]!;
    const end = graph.nodes[path[path.length - 1]!.node]!;
    if (start.digit !== end.digit) return null; // not on the same digit for a true loop

    // For continuous loops, any cell seeing a strong node on both sides can be eliminated
    const eliminations: CellDigit[] = [];
    for (let i = 0; i < path.length; i += 2) { // strong nodes are at even indices in the chain
      const node = graph.nodes[path[i]!.node]!;
      const digit = node.digit;
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0 || !grid.hasCandidate(c, digit)) continue;
        if (node.cells.includes(c)) continue; // skip self
        if (!seesAllOfNode(c, node)) continue; // must see all cells in node
        eliminations.push({ cell: c, digit });
      }
    }

    if (eliminations.length === 0) return null;

    return {
      eliminations,
      placements: [],
      links: chainToLinks(graph, path),
      chainNodes: path.map((s) => s.node),
      kind: 'continuous-loop',
      startNode: path[0]!.node,
      endNode: path[0]!.node, // loop closure
    };
  }

  function tryDiscontinuous(path: Chain): AicResult | null {
    const start = graph.nodes[path[0]!.node]!;
    const end = graph.nodes[path[path.length - 1]!.node]!;
    if (start.cells.length === 1 && end.cells.length === 1 && start.cells[0] === end.cells[0]) {
      // W-Wing: single cell with two digits
      return null; // handled in regular loop search via AIC
    }
    // Two cells that are peers -> Remote Pairs / XY-Chain
    if (start.cells.length === 1 && end.cells.length === 1 && 
        start.cells[0] !== end.cells[0] && 
        PEERS_OF[start.cells[0]!]!.includes(end.cells[0]!)) {
      const elims = endpointEliminations(grid, start, end);
      if (elims.length === 0) return null;
      return {
        eliminations: elims,
        placements: [],
        links: chainToLinks(graph, path),
        chainNodes: path.map((s) => s.node),
        kind: 'discontinuous-loop',
        startNode: path[0]!.node,
        endNode: path[path.length - 1]!.node,
      };
    }
    return null;
  }

  interface QItem {
    node: number;
    nextType: 'strong' | 'weak';
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

      // Try continuous loop (start == current)
      if (s === item.node && item.chain.length >= 4) {
        const res = tryContinuous(item.chain);
        if (res) return res;
      }

      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        const next: QItem = {
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          visited,
        };
        queue.push(next);
      }
    }
  }

  return null;
}
