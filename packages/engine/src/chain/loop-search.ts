import { HOUSES, UNITS_OF, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import type { LinkGraph } from './graph.js';
import { chainToLinks, type Chain } from './graph.js';
import type { ChainPolicy } from './policy.js';
import { popcount } from '../grid.js';
import type { ChainNode } from './graph.js';

export interface LoopResult {
  eliminations: CellDigit[];
  placements: CellDigit[];
  links: Link[];
  chainNodes: number[];
  kind: 'continuous-loop' | 'discontinuous-loop';
  startNode: number;
  placementDigit?: number;
}

function loopHasCandidate(graph: LinkGraph, loopNodes: readonly number[], cell: number, digit: number): boolean {
  for (const ni of loopNodes) {
    const n = graph.nodes[ni]!;
    if (n.digit === digit && n.cells.includes(cell)) return true;
  }
  return false;
}

function commonHouses(c1: number, c2: number): number[] {
  return UNITS_OF[c1]!.filter((h) => HOUSES[h]!.includes(c2));
}

function weakLinkEliminations(
  grid: Grid,
  graph: LinkGraph,
  loopNodes: readonly number[],
  fromIdx: number,
  toIdx: number,
): CellDigit[] {
  const A = graph.nodes[fromIdx]!;
  const B = graph.nodes[toIdx]!;
  const out: CellDigit[] = [];

  if (A.digit === B.digit) {
    const digit = A.digit;
    const bit = maskOf(digit);
    for (const ac of A.cells) {
      for (const bc of B.cells) {
        for (const h of commonHouses(ac, bc)) {
          for (const c of HOUSES[h]!) {
            if (loopHasCandidate(graph, loopNodes, c, digit)) continue;
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) out.push({ cell: c, digit });
          }
        }
      }
    }
    return out;
  }

  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
    const cell = A.cells[0]!;
    const keep = maskOf(A.digit) | maskOf(B.digit);
    for (let d = 1; d <= 9; d++) {
      if (keep & maskOf(d)) continue;
      if (grid.hasCandidate(cell, d)) out.push({ cell, digit: d });
    }
  }
  return out;
}

function continuousEliminations(grid: Grid, graph: LinkGraph, path: number[], closeType: LinkType): CellDigit[] {
  const seen = new Set<number>();
  const out: CellDigit[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const linkType: LinkType = i % 2 === 0 ? 'strong' : 'weak';
    if (linkType !== 'weak') continue;
    for (const e of weakLinkEliminations(grid, graph, path, path[i]!, path[i + 1]!)) {
      const key = e.cell * 10 + e.digit;
      if (!seen.has(key)) { seen.add(key); out.push(e); }
    }
  }
  if (closeType === 'weak') {
    for (const e of weakLinkEliminations(grid, graph, path, path[path.length - 1]!, path[0]!)) {
      const key = e.cell * 10 + e.digit;
      if (!seen.has(key)) { seen.add(key); out.push(e); }
    }
  }
  return out.filter((e) => grid.hasCandidate(e.cell, e.digit));
}

function edgeBetween(graph: LinkGraph, a: number, b: number, type: LinkType): boolean {
  return graph.adjacency[a]!.some((e) => e.to === b && e.type === type);
}

function makeLoopResult(
  grid: Grid,
  graph: LinkGraph,
  path: number[],
  closeType: LinkType,
  kind: LoopResult['kind'],
  opts?: { placement?: CellDigit },
): LoopResult | null {
  const linkTypes: LinkType[] = [];
  for (let i = 0; i < path.length - 1; i++) linkTypes.push(i % 2 === 0 ? 'strong' : 'weak');
  linkTypes.push(closeType);

  const chain: Chain = [{ node: path[0]!, incoming: null }];
  for (let i = 1; i < path.length; i++) chain.push({ node: path[i]!, incoming: linkTypes[i - 1]! });

  const loopLinks = chainToLinks(graph, chain);
  const lastNode = graph.nodes[path[path.length - 1]!]!;
  const firstNode = graph.nodes[path[0]!]!;
  loopLinks.push({
    from: { cell: lastNode.cells[0]!, digit: lastNode.digit },
    to: { cell: firstNode.cells[0]!, digit: firstNode.digit },
    type: closeType,
  });

  let eliminations: CellDigit[] = [];
  let placements: CellDigit[] = [];

  if (kind === 'continuous-loop') {
    eliminations = continuousEliminations(grid, graph, path, closeType);
  } else if (opts?.placement) {
    placements = [opts.placement];
  } else {
    const breakNode = graph.nodes[path[0]!]!;
    eliminations = [{ cell: breakNode.cells[0]!, digit: breakNode.digit }];
  }

  eliminations = eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
  placements = placements.filter((p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit));
  if (eliminations.length === 0 && placements.length === 0) return null;

  return {
    eliminations,
    placements,
    links: loopLinks,
    chainNodes: path,
    kind,
    startNode: path[0]!,
    placementDigit: opts?.placement?.digit,
  };
}

export function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): LoopResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;

  for (let start = 0; start < n; start++) {
    interface State {
      path: number[];
      visited: Set<number>;
    }

    const queue: State[] = [{ path: [start], visited: new Set([start]) }];

    while (queue.length) {
      const state = queue.shift()!;
      const cur = state.path[state.path.length - 1]!;
      const depth = state.path.length;

      if (depth >= 3 && depth <= maxLen) {
        const firstLinkType: LinkType = 'strong';
        const expectedClose: LinkType = depth % 2 === 1 ? 'weak' : 'strong';

        if (edgeBetween(graph, cur, start, expectedClose)) {
          if (depth % 2 === 1 && expectedClose === 'weak') {
            const res = makeLoopResult(grid, graph, state.path, expectedClose, 'discontinuous-loop');
            if (res) return res;
          }
          if (depth % 2 === 1 && expectedClose === 'strong') {
            const breakNode = graph.nodes[start]!;
            const res = makeLoopResult(grid, graph, state.path, expectedClose, 'discontinuous-loop', {
              placement: { cell: breakNode.cells[0]!, digit: breakNode.digit },
            });
            if (res) return res;
          }
          if (depth % 2 === 0 && expectedClose === 'weak' && firstLinkType === 'strong') {
            const res = makeLoopResult(grid, graph, state.path, expectedClose, 'continuous-loop');
            if (res) return res;
          }
        }
      }

      if (depth >= maxLen) continue;
      const nextType: LinkType = depth % 2 === 1 ? 'weak' : 'strong';

      for (const edge of graph.adjacency[cur]!) {
        if (edge.type !== nextType) continue;
        if (edge.to === start) continue;
        if (state.visited.has(edge.to)) continue;
        const visited = new Set(state.visited);
        visited.add(edge.to);
        queue.push({ path: [...state.path, edge.to], visited });
      }
    }
  }
  return null;
}

export function isBivalueNode(grid: Grid, node: ChainNode): boolean {
  return node.cells.length === 1 && popcount(grid.candidatesOf(node.cells[0]!)) === 2;
}