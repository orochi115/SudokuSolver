import { ROW_OF, COL_OF, BOX_OF, maskOf, popcount, PEERS_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import type { LinkGraph, ChainNode } from './graph.js';
import { chainToLinks, type Chain } from './graph.js';
import type { ChainPolicy } from './policy.js';

function encCellDigit(cell: number, digit: number): string {
  return `${cell}:${digit}`;
}

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

/** Primary unit for a same-digit weak link (row preferred over col over box). */
function weakLinkUnitTag(a: ChainNode, b: ChainNode): number | null {
  if (a.digit !== b.digit || a.cells.length !== 1 || b.cells.length !== 1) return null;
  const ca = a.cells[0]!;
  const cb = b.cells[0]!;
  if (ROW_OF[ca] === ROW_OF[cb]) return ROW_OF[ca]!;
  if (COL_OF[ca] === COL_OF[cb]) return 9 + COL_OF[cb]!;
  if (BOX_OF[ca] === BOX_OF[cb]) return 18 + BOX_OF[cb]!;
  return null;
}

function cellsInUnitByTag(unitTag: number): number[] {
  if (unitTag < 9) {
    const out: number[] = [];
    for (let c = 0; c < 9; c++) out.push(unitTag * 9 + c);
    return out;
  }
  if (unitTag < 18) {
    const col = unitTag - 9;
    const out: number[] = [];
    for (let r = 0; r < 9; r++) out.push(r * 9 + col);
    return out;
  }
  const box = unitTag - 18;
  const br = Math.floor(box / 3) * 3;
  const bc = (box % 3) * 3;
  const out: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) out.push((br + r) * 9 + (bc + c));
  }
  return out;
}

function continuousLoopEliminations(
  grid: Grid,
  graph: LinkGraph,
  loop: Chain,
  loopNodeIdxs: readonly number[],
): CellDigit[] {
  const loopCells = new Set<number>();
  for (const ni of loopNodeIdxs) {
    for (const c of graph.nodes[ni]!.cells) loopCells.add(c);
  }
  const out: CellDigit[] = [];
  const seen = new Set<string>();

  function push(cell: number, digit: number): void {
    if (!grid.hasCandidate(cell, digit)) return;
    const k = encCellDigit(cell, digit);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ cell, digit });
  }

  for (let i = 1; i < loop.length; i++) {
    if (loop[i]!.incoming !== 'weak') continue;
    const A = graph.nodes[loop[i - 1]!.node]!;
    const B = graph.nodes[loop[i]!.node]!;

    if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
      const cell = A.cells[0]!;
      const keep = maskOf(A.digit) | maskOf(B.digit);
      const m = grid.candidatesOf(cell);
      for (let d = 1; d <= SIZE; d++) {
        if ((keep & maskOf(d)) !== 0) continue;
        if (m & maskOf(d)) push(cell, d);
      }
      continue;
    }

    if (A.digit !== B.digit) continue;
    const digit = A.digit;
    const unitTag = weakLinkUnitTag(A, B);
    if (unitTag === null) continue;
    for (const c of cellsInUnitByTag(unitTag)) {
      if (loopCells.has(c)) continue;
      push(c, digit);
    }
  }
  return out;
}

function chainAlternates(chain: Chain): boolean {
  for (let i = 1; i < chain.length; i++) {
    const t = chain[i]!.incoming;
    if (t === null) return false;
    const expected = i % 2 === 1 ? 'strong' : 'weak';
    if (t !== expected) return false;
  }
  return true;
}

function tryLoopClose(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
  closingType: LinkType,
  startIdx: number,
): AicResult | null {
  if (chain.length < 3) return null;
  const firstLink = chain[1]!.incoming;
  if (firstLink === null) return null;

  const loopNodeIdxs = chain.map((s) => s.node);
  const start = graph.nodes[startIdx]!;
  const startCell = start.cells[0]!;
  const startDigit = start.digit;

  const fullLoop: Chain = [...chain, { node: startIdx, incoming: closingType }];

  if (firstLink === closingType && firstLink === 'strong') {
    if (!grid.hasCandidate(startCell, startDigit)) return null;
    return {
      eliminations: [],
      placements: [{ cell: startCell, digit: startDigit }],
      links: chainToLinks(graph, fullLoop),
      chainNodes: loopNodeIdxs,
      kind: 'discontinuous-loop',
      startNode: startIdx,
      endNode: startIdx,
    };
  }

  if (firstLink === closingType && firstLink === 'weak') {
    if (!grid.hasCandidate(startCell, startDigit)) return null;
    return {
      eliminations: [{ cell: startCell, digit: startDigit }],
      placements: [],
      links: chainToLinks(graph, fullLoop),
      chainNodes: loopNodeIdxs,
      kind: 'discontinuous-loop',
      startNode: startIdx,
      endNode: startIdx,
    };
  }

  if (chain.length < 4 || chain.length % 2 !== 0) return null;
  if (firstLink === closingType) return null;
  if (!chainAlternates(chain)) return null;

  const elims = continuousLoopEliminations(grid, graph, fullLoop, loopNodeIdxs);
  if (elims.length === 0) return null;
  return {
    eliminations: elims,
    placements: [],
    links: chainToLinks(graph, fullLoop),
    chainNodes: loopNodeIdxs,
    kind: 'continuous-loop',
    startNode: startIdx,
    endNode: startIdx,
  };
}

function searchNiceLoopPass(
  grid: Grid,
  graph: LinkGraph,
  policy: ChainPolicy,
  kinds: readonly AicResult['kind'][],
): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

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
      if (item.chain.length >= 3) {
        for (const edge of graph.adjacency[item.node]!) {
          if (edge.type !== item.nextType) continue;
          if (edge.to === s && item.node !== s) {
            const res = tryLoopClose(grid, graph, item.chain, edge.type, s);
            if (res && kinds.includes(res.kind)) return res;
          }
        }
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (edge.to === s) continue;
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

/** Search for continuous / discontinuous Nice Loops (E6 — owned by nice-loop strategy). */
export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  // Discontinuous (Rule 2/3) first — more common and less prone to over-elimination.
  const disc = searchNiceLoopPass(grid, graph, policy, ['discontinuous-loop']);
  if (disc) return disc;
  return searchNiceLoopPass(grid, graph, policy, ['continuous-loop']);
}

function isBivalueNode(grid: Grid, node: ChainNode): boolean {
  if (node.cells.length !== 1) return false;
  const c = node.cells[0]!;
  return grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2;
}

function isInCellStrong(graph: LinkGraph, from: number, to: number): boolean {
  const A = graph.nodes[from]!;
  const B = graph.nodes[to]!;
  return A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0];
}

function chainIsXyChain(grid: Grid, graph: LinkGraph, chain: Chain): boolean {
  for (const step of chain) {
    if (!isBivalueNode(grid, graph.nodes[step.node]!)) return false;
  }
  for (let i = 1; i < chain.length; i++) {
    const type = chain[i]!.incoming!;
    const prev = chain[i - 1]!.node;
    const cur = chain[i]!.node;
    if (type === 'strong' && !isInCellStrong(graph, prev, cur)) return false;
    if (type === 'weak') {
      const A = graph.nodes[prev]!;
      const B = graph.nodes[cur]!;
      if (A.cells[0] === B.cells[0] || A.digit !== B.digit) return false;
    }
  }
  return true;
}

/** XY-Chain: bivalue-cell chain with in-cell strong links; Type-1 same end-digit. */
export function searchXyChain(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  function tryEndpoints(chain: Chain): AicResult | null {
    if (chain.length < 3) return null;
    if (!chainIsXyChain(grid, graph, chain)) return null;
    const startIdx = chain[0]!.node;
    const endIdx = chain[chain.length - 1]!.node;
    if (startIdx === endIdx) return null;
    const A = graph.nodes[startIdx]!;
    const B = graph.nodes[endIdx]!;
    if (A.digit !== B.digit) return null;
    const elims = endpointEliminations(grid, A, B);
    if (elims.length === 0) return null;
    return {
      eliminations: elims,
      placements: [],
      links: chainToLinks(graph, chain),
      chainNodes: chain.map((s) => s.node),
      kind: 'type1',
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
    if (!isBivalueNode(grid, graph.nodes[s]!)) continue;
    let budget = perStartBudget;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      const last = item.chain[item.chain.length - 1]!;
      if (item.chain.length >= 3 && last.incoming === 'strong') {
        const res = tryEndpoints(item.chain);
        if (res) return res;
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;
        if (!isBivalueNode(grid, graph.nodes[edge.to]!)) continue;
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

/** Turbot Fish: 4-node single-digit strong-weak-strong chain (presentation filter). */
export function isTurbotFishPattern(graph: LinkGraph, result: AicResult): boolean {
  if (result.chainNodes.length !== 4) return false;
  if (result.links.length !== 3) return false;
  for (const ni of result.chainNodes) {
    if (graph.nodes[ni]!.cells.length !== 1) return false;
  }
  const [l0, l1, l2] = result.links;
  return l0!.type === 'strong' && l1!.type === 'weak' && l2!.type === 'strong';
}
