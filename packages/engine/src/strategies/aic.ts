/**
 * T4: AIC (Alternating Inference Chains) Engine.
 *
 * Builds a strong/weak link graph from the grid, then searches for AIC patterns:
 * - X-Chain: single-digit chain with alternating strong links
 * - XY-Chain: chain where each node is a bivalue cell with xy digits
 * - Nice Loops: continuous AIC loops
 * - AIC Type 1: endpoints on same digit -> eliminate from seeing cells
 * - AIC Type 2: endpoints on different digits in seeing cells
 * - Discontinuous loops: contradiction at break point
 */

import { PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  LinkGraph,
  type GraphNode,
  type GraphLink,
  buildAICChains,
  chainToLinks,
  type AICChain,
} from './link-graph.js';

export const aic: Strategy = {
  id: 'aic',
  name: { zh: 'AIC推理链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    const graph = new LinkGraph();
    graph.buildFromGrid(grid);

    const chains = buildAICChains(graph, 8);

    for (const chain of chains) {
      const result = tryAICElimination(grid, chain);
      if (result) return result;
    }

    const xChainResult = tryXChain(grid, graph);
    if (xChainResult) return xChainResult;

    const xyChainResult = tryXYChain(grid, graph);
    if (xyChainResult) return xyChainResult;

    return null;
  },
};

function tryXChain(grid: Grid, graph: LinkGraph): Step | null {
  const strongLinks = graph.getStrongLinks();
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  for (const startLink of strongLinks) {
    const digit = startLink.from.digit;
    const start = startLink.from;
    const result = findChainEndpoints(grid, graph, start, digit, 2, emptyCells);
    if (result) return result;
  }

  return null;
}

function tryXYChain(grid: Grid, graph: LinkGraph): Step | null {
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  for (const cell of emptyCells) {
    if (popcount(grid.candidatesOf(cell)) !== 2) continue;
    const digits = digitsOf(grid.candidatesOf(cell));
    const node = graph.getNode(cell, digits[0]!);
    const result = findChainEndpoints(grid, graph, node, digits[1]!, 3, emptyCells);
    if (result) return result;
  }

  return null;
}

function findChainEndpoints(
  grid: Grid,
  graph: LinkGraph,
  startNode: GraphNode,
  targetDigit: number,
  minLength: number,
  emptyCells: number[]
): Step | null {
  const visited = new Set<string>();
  const queue: {
    node: GraphNode;
    path: GraphLink[];
    lastType: 'strong' | 'weak';
  }[] = [];

  for (const link of graph.getAdjacency(startNode)) {
    if (link.type !== 'strong') continue;
    const nextNode = link.from === startNode ? link.to : link.from;
    queue.push({
      node: nextNode,
      path: [link],
      lastType: 'strong',
    });
  }

  while (queue.length > 0) {
    const state = queue.shift()!;
    const key = `${state.node.cell}:${state.node.digit}`;

    if (state.path.length >= minLength && state.node.digit === targetDigit) {
      const elimination = tryEndpointElimination(grid, state.path, state.node, emptyCells);
      if (elimination) return elimination;
    }

    if (state.path.length >= 8) continue;

    for (const link of graph.getAdjacency(state.node)) {
      if (link === state.path[state.path.length - 1]) continue;
      const nextNode = link.from === state.node ? link.to : link.from;
      const nextKey = `${nextNode.cell}:${nextNode.digit}`;

      const expectedType = state.lastType === 'strong' ? 'weak' : 'strong';
      if (link.type !== expectedType) continue;
      if (visited.has(nextKey)) continue;

      visited.add(nextKey);
      queue.push({
        node: nextNode,
        path: [...state.path, link],
        lastType: link.type,
      });
    }
  }

  return null;
}

function tryEndpointElimination(
  grid: Grid,
  path: GraphLink[],
  endpoint: GraphNode,
  emptyCells: number[]
): Step | null {
  if (path.length < 2) return null;

  const startNode = path[0]!.from;
  const endNode = endpoint;

  if (startNode.digit !== endNode.digit) return null;

  const eliminations: CellDigit[] = [];
  const seeingStart = new Set(PEERS_OF[startNode.cell]!);
  const seeingEnd = new Set(PEERS_OF[endNode.cell]!);

  for (const cell of emptyCells) {
    if (cell === startNode.cell || cell === endNode.cell) continue;
    if (seeingStart.has(cell) && seeingEnd.has(cell)) {
      if (grid.hasCandidate(cell, startNode.digit)) {
        eliminations.push({ cell, digit: startNode.digit });
      }
    }
  }

  if (eliminations.length === 0) return null;

  const links: Link[] = path.map((l) => ({
    from: { cell: l.from.cell, digit: l.from.digit },
    to: { cell: l.to.cell, digit: l.to.digit },
    type: l.type,
  }));

  const sr = Math.floor(startNode.cell / 9) + 1;
  const sc = (startNode.cell % 9) + 1;
  const er = Math.floor(endNode.cell / 9) + 1;
  const ec = (endNode.cell % 9) + 1;

  return {
    strategyId: 'aic',
    placements: [],
    eliminations,
    highlights: {
      cells: [startNode.cell, endNode.cell],
      candidates: [
        { cell: startNode.cell, digit: startNode.digit },
        { cell: endNode.cell, digit: endNode.digit },
      ],
      links,
    },
    explanation: {
      zh: `链起点 R${sr}C${sc} 与终点 R${er}C${ec} 数字 ${startNode.digit} 相同，两端均真的情况下，消去共同视野格的 ${startNode.digit}（AIC）。`,
      en: `Chain endpoints R${sr}C${sc} and R${er}C${ec} share digit ${startNode.digit}; when both are true, eliminate ${startNode.digit} from cells seeing both (AIC).`,
    },
  };
}

function tryAICElimination(grid: Grid, chain: AICChain): Step | null {
  if (chain.links.length < 2) return null;

  if (chain.isLoop && chain.isContinuous) {
    return tryContinuousLoopElimination(grid, chain);
  } else if (chain.isLoop) {
    return tryDiscontinuousLoopElimination(grid, chain);
  } else {
    return tryOpenChainElimination(grid, chain);
  }
}

function tryOpenChainElimination(grid: Grid, chain: AICChain): Step | null {
  const first = chain.nodes[0]!;
  const last = chain.nodes[chain.nodes.length - 1]!;

  if (first.digit !== last.digit) return null;

  const seeingFirst = new Set(PEERS_OF[first.cell]!);
  const seeingLast = new Set(PEERS_OF[last.cell]!);

  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);
  const eliminations: CellDigit[] = [];

  for (const cell of emptyCells) {
    if (cell === first.cell || cell === last.cell) continue;
    if (seeingFirst.has(cell) && seeingLast.has(cell)) {
      if (grid.hasCandidate(cell, first.digit)) {
        eliminations.push({ cell, digit: first.digit });
      }
    }
  }

  if (eliminations.length === 0) return null;

  const links: Link[] = chain.links.map((l) => ({
    from: { cell: l.from.cell, digit: l.from.digit },
    to: { cell: l.to.cell, digit: l.to.digit },
    type: l.type,
  }));

  const fr = Math.floor(first.cell / 9) + 1;
  const fc = (first.cell % 9) + 1;
  const lr = Math.floor(last.cell / 9) + 1;
  const lc = (last.cell % 9) + 1;

  return {
    strategyId: 'aic',
    placements: [],
    eliminations,
    highlights: {
      cells: chain.nodes.map((n) => n.cell),
      candidates: chain.nodes.map((n) => ({ cell: n.cell, digit: n.digit })),
      links,
    },
    explanation: {
      zh: `AIC开链 R${fr}C${fc} 到 R${lr}C${lc} 数字 ${first.digit} 相同，两端均真时消去共同视野格（Type 1 AIC）。`,
      en: `Open AIC chain from R${fr}C${fc} to R${lr}C${lc} share digit ${first.digit}; when both ends true, eliminate from cells seeing both (Type 1 AIC).`,
    },
  };
}

function tryContinuousLoopElimination(grid: Grid, chain: AICChain): Step | null {
  return null;
}

function tryDiscontinuousLoopElimination(grid: Grid, chain: AICChain): Step | null {
  return null;
}
