import { maskOf, PEERS_OF, SIZE, ROW_OF, COL_OF, BOX_OF, HOUSES } from '../grid.js';
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

function getCommonHousesForNodes(u: ChainNode, v: ChainNode): number[] {
  const houses: number[] = [];
  for (let h = 0; h < 27; h++) {
    const houseCells = HOUSES[h]!;
    const uInHouse = u.cells.every(c => houseCells.includes(c));
    const vInHouse = v.cells.every(c => houseCells.includes(c));
    if (uInHouse && vInHouse) {
      houses.push(h);
    }
  }
  return houses;
}

function rule2Eliminations(grid: Grid, s: ChainNode): CellDigit[] {
  const elims: CellDigit[] = [];
  const cell = s.cells[0]!;
  const m = grid.candidatesOf(cell);
  for (let d = 1; d <= SIZE; d++) {
    if (d !== s.digit && (m & maskOf(d))) {
      elims.push({ cell, digit: d });
    }
  }
  return elims;
}

function rule3Eliminations(grid: Grid, s: ChainNode): CellDigit[] {
  const cell = s.cells[0]!;
  if (grid.hasCandidate(cell, s.digit)) {
    return [{ cell, digit: s.digit }];
  }
  return [];
}

function continuousLoopEliminations(grid: Grid, graph: LinkGraph, chain: Chain): CellDigit[] {
  const elims: CellDigit[] = [];
  const loopCells = new Set(chain.flatMap(s => graph.nodes[s.node]!.cells));

  for (let i = 0; i < chain.length - 1; i++) {
    const u = graph.nodes[chain[i]!.node]!;
    const v = graph.nodes[chain[i+1]!.node]!;
    const incomingType = chain[i+1]!.incoming;
    if (incomingType !== 'weak') continue;

    if (u.digit === v.digit) {
      const d = u.digit;
      const sharedHouses = getCommonHousesForNodes(u, v);
      for (const h of sharedHouses) {
        for (const c of HOUSES[h]!) {
          if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
            if (!loopCells.has(c)) {
              elims.push({ cell: c, digit: d });
            }
          }
        }
      }
    } else if (u.cells[0] === v.cells[0]) {
      const cell = u.cells[0]!;
      const m = grid.candidatesOf(cell);
      for (let d = 1; d <= SIZE; d++) {
        if (d !== u.digit && d !== v.digit && (m & maskOf(d))) {
          elims.push({ cell, digit: d });
        }
      }
    }
  }

  const seen = new Set<string>();
  return elims.filter(e => {
    const key = `${e.cell}:${e.digit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  interface QItem {
    node: number;
    nextType: LinkType;
    chain: Chain;
    visited: Set<number>;
  }

  function hasEdge(from: number, to: number, type: LinkType): boolean {
    return graph.adjacency[from]!.some(edge => edge.to === to && edge.type === type);
  }

  for (let s = 0; s < n; s++) {
    const startNode = graph.nodes[s]!;
    if (startNode.cells.length > 1) continue;

    // --- Search 1: Start with 'strong' link ---
    let budget = perStartBudget;
    const queue1: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];

    while (queue1.length > 0 && budget-- > 0) {
      const item = queue1.shift()!;
      const lastNodeIdx = item.node;

      if (item.chain.length >= 3) {
        if (item.nextType === 'strong') {
          if (hasEdge(lastNodeIdx, s, 'strong')) {
            const elims = rule2Eliminations(grid, startNode);
            if (elims.length > 0) {
              const fullChain = [...item.chain, { node: s, incoming: 'strong' as LinkType }];
              return {
                eliminations: elims,
                placements: [],
                links: chainToLinks(graph, fullChain),
                chainNodes: fullChain.map(step => step.node),
                kind: 'discontinuous-loop',
                startNode: s,
                endNode: s,
              };
            }
          }
        } else {
          if (hasEdge(lastNodeIdx, s, 'weak')) {
            const fullChain = [...item.chain, { node: s, incoming: 'weak' as LinkType }];
            const elims = continuousLoopEliminations(grid, graph, fullChain);
            if (elims.length > 0) {
              return {
                eliminations: elims,
                placements: [],
                links: chainToLinks(graph, fullChain),
                chainNodes: fullChain.map(step => step.node),
                kind: 'continuous-loop',
                startNode: s,
                endNode: s,
              };
            }
          }
        }
      }

      if (item.chain.length >= maxLen) continue;

      for (const edge of graph.adjacency[lastNodeIdx]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;

        const visited = new Set(item.visited);
        visited.add(edge.to);
        queue1.push({
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          visited,
        });
      }
    }

    // --- Search 2: Start with 'weak' link ---
    budget = perStartBudget;
    const queue2: QItem[] = [
      { node: s, nextType: 'weak', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];

    while (queue2.length > 0 && budget-- > 0) {
      const item = queue2.shift()!;
      const lastNodeIdx = item.node;

      if (item.chain.length >= 3) {
        if (item.nextType === 'weak') {
          if (hasEdge(lastNodeIdx, s, 'weak')) {
            const elims = rule3Eliminations(grid, startNode);
            if (elims.length > 0) {
              const fullChain = [...item.chain, { node: s, incoming: 'weak' as LinkType }];
              return {
                eliminations: elims,
                placements: [],
                links: chainToLinks(graph, fullChain),
                chainNodes: fullChain.map(step => step.node),
                kind: 'discontinuous-loop',
                startNode: s,
                endNode: s,
              };
            }
          }
        }
      }

      if (item.chain.length >= maxLen) continue;

      for (const edge of graph.adjacency[lastNodeIdx]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        queue2.push({
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
