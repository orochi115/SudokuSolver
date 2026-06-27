import { maskOf, PEERS_OF, ROWS, COLS, BOXES, BOX_OF, SIZE } from '../grid.js';
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

/**
 * Search for a NICE LOOP — a cyclic alternating chain that closes back on
 * itself. Two outcomes:
 *
 *   - **continuous-loop** (Rule 1): the alternation holds all the way around
 *     and the last link is the same type as the first (even-length chain). On
 *     every between-cell weak link we remove the link's digit from every
 *     other candidate cell in that link's shared unit / cell. On every in-cell
 *     weak link we remove all other candidates from that cell.
 *   - **discontinuous-loop** (Rules 2 & 3): at exactly one node the alternation
 *     breaks. If both terminal links are strong (Rule 2) we place that node's
 *     digit. If both are weak (Rule 3) we eliminate that node's digit.
 *
 * Returns the first usable loop it finds, or null.
 */
export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  function continuousElims(chain: Chain): CellDigit[] {
    const out: CellDigit[] = [];
    for (let i = 1; i < chain.length; i++) {
      const prev = graph.nodes[chain[i - 1]!.node]!;
      const curr = graph.nodes[chain[i]!.node]!;
      const type = chain[i]!.incoming!;
      if (type !== 'weak') continue;
      if (prev.digit === curr.digit && prev.cells.length === 1 && curr.cells.length === 1 && prev.cells[0] === curr.cells[0]) {
        // in-cell weak link: remove every other candidate from the cell
        const cell = prev.cells[0]!;
        const mask = grid.candidatesOf(cell);
        for (let d = 1; d <= SIZE; d++) {
          if (d === prev.digit || d === curr.digit) continue;
          if (mask & maskOf(d)) out.push({ cell, digit: d });
        }
        continue;
      }
      if (prev.digit !== curr.digit || prev.cells.length !== 1 || curr.cells.length !== 1) continue;
      // between-cell weak link on a single digit: remove the digit from every
      // other cell in any shared house.
      const digit = prev.digit;
      const bit = maskOf(digit);
      const a = prev.cells[0]!;
      const b = curr.cells[0]!;
      const cells = new Set<number>([a, b]);
      // find shared houses (row/col/box)
      const shared: number[][] = [];
      if (Math.floor(a / 9) === Math.floor(b / 9)) shared.push([...ROWS[Math.floor(a / 9)!]!]);
      if ((a % 9) === (b % 9)) shared.push([...COLS[a % 9]!]);
      const ab = BOX_OF[a]!;
      const bb = BOX_OF[b]!;
      if (ab === bb) shared.push([...BOXES[ab]!]);
      for (const house of shared) {
        for (const c of house) {
          if (cells.has(c)) continue;
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
          out.push({ cell: c, digit });
        }
      }
    }
    return out;
  }

  function rule2Placement(idx: number): CellDigit | null {
    const node = graph.nodes[idx]!;
    if (node.cells.length !== 1) return null;
    const cell = node.cells[0]!;
    if (!grid.hasCandidate(cell, node.digit)) return null;
    return { cell, digit: node.digit };
  }

  function rule3Elim(idx: number): CellDigit | null {
    const node = graph.nodes[idx]!;
    if (node.cells.length !== 1) return null;
    const cell = node.cells[0]!;
    if (!grid.hasCandidate(cell, node.digit)) return null;
    return { cell, digit: node.digit };
  }

  function collectLoopLinks(chain: Chain, closingType: LinkType): Link[] {
    const links = chainToLinks(graph, chain);
    const first = graph.nodes[chain[0]!.node]!;
    const last = graph.nodes[chain[chain.length - 1]!.node]!;
    const closing: Link = {
      from: { cell: last.cells[0]!, digit: last.digit },
      to: { cell: first.cells[0]!, digit: first.digit },
      type: closingType,
    };
    if (last.cells.length > 1) closing.fromCells = [...last.cells];
    if (first.cells.length > 1) closing.toCells = [...first.cells];
    links.push(closing);
    return links;
  }

  interface QItem {
    node: number;
    nextType: LinkType;
    chain: Chain;
    visited: Set<number>;
  }

  const n = graph.nodes.length;
  for (let s = 0; s < n; s++) {
    let budget = perStartBudget;
    const startNode = graph.nodes[s]!;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      if (item.chain.length >= 2) {
        const last = item.chain[item.chain.length - 1]!;
        // Try to close back to start.
        for (const edge of graph.adjacency[item.node]!) {
          if (edge.to !== s) continue;
          // The closing link's type is whatever the edge actually is. We allow
          // either matching the alternation (continuous) or breaking it
          // (discontinuous).
          const closingType: LinkType = edge.type;
          // Continuous: alternation preserved ⇒ last.incoming must equal closingType.
          // Discontinuous: alternation broken ⇒ last.incoming must NOT equal closingType.
          if (closingType === last.incoming) {
            // Continuous loop (Rule 1). Requires at least one weak link.
            const chainLen = item.chain.length;
            if (chainLen < 4) continue; // too short — degenerate
            if (chainLen % 2 !== 0) continue; // need even node count
            const elims = continuousElims(item.chain);
            if (elims.length === 0) continue;
            return {
              eliminations: elims,
              placements: [],
              links: collectLoopLinks(item.chain, closingType),
              chainNodes: item.chain.map((c) => c.node),
              kind: 'continuous-loop',
              startNode: s,
              endNode: s,
            };
          } else {
            // Discontinuous loop: closing link breaks alternation at start.
            // Two terminal links at start node are both strong (Rule 2) or both
            // weak (Rule 3). In our encoding, the closing link is `closingType`
            // and the FIRST chain link has type determined by the alternation
            // starting at `null` (we used 'strong' as the first link type when
            // starting). So the first link's type equals item.chain[1].incoming.
            const firstIncoming = item.chain[1]?.incoming;
            if (firstIncoming === undefined) continue;
            if (firstIncoming === closingType) {
              // Two terminals of same type at start ⇒ Rule 2 (strong) / Rule 3 (weak)
              if (closingType === 'strong') {
                const p = rule2Placement(s);
                if (p) {
                  return {
                    eliminations: [],
                    placements: [p],
                    links: collectLoopLinks(item.chain, closingType),
                    chainNodes: item.chain.map((c) => c.node),
                    kind: 'discontinuous-loop',
                    startNode: s,
                    endNode: s,
                  };
                }
              } else {
                const e = rule3Elim(s);
                if (e) {
                  return {
                    eliminations: [e],
                    placements: [],
                    links: collectLoopLinks(item.chain, closingType),
                    chainNodes: item.chain.map((c) => c.node),
                    kind: 'discontinuous-loop',
                    startNode: s,
                    endNode: s,
                  };
                }
              }
            }
          }
        }
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
    void startNode;
  }
  return null;
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
