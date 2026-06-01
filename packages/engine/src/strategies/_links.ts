import { CELLS, HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link, LinkType } from '../trace.js';

export interface CandidateNode {
  id: number;
  cell: number;
  digit: number;
}

export interface LinkEdge {
  from: number;
  to: number;
  type: LinkType;
}

export interface LinkGraph {
  nodes: CandidateNode[];
  edges: LinkEdge[];
  adjacency: LinkEdge[][];
  nodeIdByCellDigit: Map<string, number>;
}

export interface ChainPath {
  nodeIds: number[];
  edges: LinkEdge[];
}

export function nodeKey(cell: number, digit: number): string {
  return `${cell}:${digit}`;
}

export function buildLinkGraph(grid: Grid): LinkGraph {
  const nodes: CandidateNode[] = [];
  const nodeIdByCellDigit = new Map<string, number>();

  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const digits = digitsOf(grid.candidatesOf(cell));
    for (const digit of digits) {
      const id = nodes.length;
      nodes.push({ id, cell, digit });
      nodeIdByCellDigit.set(nodeKey(cell, digit), id);
    }
  }

  const edgeSet = new Set<string>();
  const edges: LinkEdge[] = [];

  const addEdge = (a: number, b: number, type: LinkType): void => {
    if (a === b) return;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = `${lo}-${hi}-${type}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ from: lo, to: hi, type });
  };

  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const ds = digitsOf(grid.candidatesOf(cell));
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        const a = nodeIdByCellDigit.get(nodeKey(cell, ds[i]!));
        const b = nodeIdByCellDigit.get(nodeKey(cell, ds[j]!));
        if (a === undefined || b === undefined) continue;
        addEdge(a, b, 'weak');
      }
    }
    if (popcount(grid.candidatesOf(cell)) === 2) {
      const [d1, d2] = ds;
      if (d1 && d2) {
        const a = nodeIdByCellDigit.get(nodeKey(cell, d1));
        const b = nodeIdByCellDigit.get(nodeKey(cell, d2));
        if (a !== undefined && b !== undefined) addEdge(a, b, 'strong');
      }
    }
  }

  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const hits = house.filter((cell) => grid.hasCandidate(cell, digit));
      for (let i = 0; i < hits.length; i++) {
        for (let j = i + 1; j < hits.length; j++) {
          const a = nodeIdByCellDigit.get(nodeKey(hits[i]!, digit));
          const b = nodeIdByCellDigit.get(nodeKey(hits[j]!, digit));
          if (a === undefined || b === undefined) continue;
          addEdge(a, b, 'weak');
        }
      }
      if (hits.length === 2) {
        const a = nodeIdByCellDigit.get(nodeKey(hits[0]!, digit));
        const b = nodeIdByCellDigit.get(nodeKey(hits[1]!, digit));
        if (a !== undefined && b !== undefined) addEdge(a, b, 'strong');
      }
    }
  }

  const adjacency: LinkEdge[][] = Array.from({ length: nodes.length }, () => []);
  for (const edge of edges) {
    adjacency[edge.from]!.push(edge);
    adjacency[edge.to]!.push(edge);
  }

  return { nodes, edges, adjacency, nodeIdByCellDigit };
}

export function edgeOther(edge: LinkEdge, nodeId: number): number {
  return edge.from === nodeId ? edge.to : edge.from;
}

export function chainToLinks(path: ChainPath, nodes: CandidateNode[]): Link[] {
  return path.edges.map((edge, i) => {
    const from = nodes[path.nodeIds[i]!]!;
    const to = nodes[path.nodeIds[i + 1]!]!;
    return {
      from: { cell: from.cell, digit: from.digit },
      to: { cell: to.cell, digit: to.digit },
      type: edge.type,
    };
  });
}

export function commonPeersWithDigit(grid: Grid, aCell: number, bCell: number, digit: number): number[] {
  const seenB = new Set(PEERS_OF[bCell]!);
  const out: number[] = [];
  for (const p of PEERS_OF[aCell]!) {
    if (p === aCell || p === bCell) continue;
    if (!seenB.has(p)) continue;
    if (!grid.hasCandidate(p, digit)) continue;
    out.push(p);
  }
  return out;
}

export function peersAll(cell: number, others: readonly number[]): boolean {
  const peerSet = new Set(PEERS_OF[cell]!);
  return others.every((x) => peerSet.has(x));
}
