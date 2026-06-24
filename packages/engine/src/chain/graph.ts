import {
  CELLS,
  SIZE,
  HOUSES,
  UNITS_OF,
  ROW_OF,
  COL_OF,
  BOX_OF,
  PEERS_OF,
  maskOf,
  popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';

export interface ChainNode {
  digit: number;
  cells: number[];
  key: string;
}

export interface GraphEdge {
  to: number;
  type: LinkType;
}

export function nodeKey(digit: number, cells: readonly number[]): string {
  return `${digit}:${[...cells].sort((a, b) => a - b).join(',')}`;
}

function singleSeesSingle(aCell: number, bCell: number, sameDigit: boolean): boolean {
  if (aCell === bCell) return !sameDigit;
  return ROW_OF[aCell] === ROW_OF[bCell] || COL_OF[aCell] === COL_OF[bCell] || BOX_OF[aCell] === BOX_OF[bCell];
}

function groupSeesGroup(a: ChainNode, b: ChainNode): boolean {
  if (a.digit !== b.digit) return false;
  for (const ca of a.cells) {
    for (const cb of b.cells) {
      if (ca === cb) return false;
      if (!singleSeesSingle(ca, cb, true)) return false;
    }
  }
  return true;
}

export interface LinkGraph {
  nodes: ChainNode[];
  adjacency: GraphEdge[][];
  indexOfKey: Map<string, number>;
}

interface BuildOptions {
  grouped?: boolean;
  digit?: number;
}

export function buildLinkGraph(grid: Grid, opts: BuildOptions = {}): LinkGraph {
  const grouped = opts.grouped ?? true;
  const onlyDigit = opts.digit;
  const nodes: ChainNode[] = [];
  const indexOfKey = new Map<string, number>();

  function ensureNode(digit: number, cells: number[]): number {
    const key = nodeKey(digit, cells);
    let idx = indexOfKey.get(key);
    if (idx === undefined) {
      idx = nodes.length;
      nodes.push({ digit, cells: [...cells], key });
      indexOfKey.set(key, idx);
    }
    return idx;
  }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    for (let d = 1; d <= SIZE; d++) {
      if (onlyDigit !== undefined && d !== onlyDigit) continue;
      if (m & maskOf(d)) ensureNode(d, [c]);
    }
  }

  if (grouped) {
    for (let b = 0; b < 9; b++) {
      for (let d = 1; d <= SIZE; d++) {
        if (onlyDigit !== undefined && d !== onlyDigit) continue;
        const bit = maskOf(d);
        const cellsIn: number[] = [];
        for (const c of HOUSES[18 + b]!) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) cellsIn.push(c);
        }
        if (cellsIn.length < 2) continue;
        const byRow = new Map<number, number[]>();
        const byCol = new Map<number, number[]>();
        for (const c of cellsIn) {
          (byRow.get(ROW_OF[c]!) ?? byRow.set(ROW_OF[c]!, []).get(ROW_OF[c]!)!).push(c);
          (byCol.get(COL_OF[c]!) ?? byCol.set(COL_OF[c]!, []).get(COL_OF[c]!)!).push(c);
        }
        for (const g of byRow.values()) if (g.length >= 2) ensureNode(d, g);
        for (const g of byCol.values()) if (g.length >= 2) ensureNode(d, g);
      }
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

  for (let h = 0; h < HOUSES.length; h++) {
    for (let d = 1; d <= SIZE; d++) {
      if (onlyDigit !== undefined && d !== onlyDigit) continue;
      const bit = maskOf(d);
      const cellsIn: number[] = [];
      for (const c of HOUSES[h]!) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) cellsIn.push(c);
      }
      if (cellsIn.length < 2) continue;
      const positions: number[][] = [];
      if (h < 18) {
        const byBox = new Map<number, number[]>();
        for (const c of cellsIn) (byBox.get(BOX_OF[c]!) ?? byBox.set(BOX_OF[c]!, []).get(BOX_OF[c]!)!).push(c);
        for (const g of byBox.values()) positions.push(g);
      } else {
        for (const c of cellsIn) positions.push([c]);
      }
      if (positions.length !== 2) continue;
      const [pa, pb] = positions as [number[], number[]];
      const ia = indexOfKey.get(nodeKey(d, pa));
      const ib = indexOfKey.get(nodeKey(d, pb));
      if (ia !== undefined && ib !== undefined) addEdge(ia, ib, 'strong');
    }
  }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const ds: number[] = [];
    for (let d = 1; d <= SIZE; d++) if (m & maskOf(d)) ds.push(d);
    const [d1, d2] = ds as [number, number];
    if (onlyDigit !== undefined && d1 !== onlyDigit && d2 !== onlyDigit) continue;
    const i1 = indexOfKey.get(nodeKey(d1, [c]));
    const i2 = indexOfKey.get(nodeKey(d2, [c]));
    if (i1 !== undefined && i2 !== undefined && onlyDigit === undefined) addEdge(i1, i2, 'strong');
  }

  const byDigit = new Map<number, number[]>();
  for (let i = 0; i < nodes.length; i++) {
    const d = nodes[i]!.digit;
    (byDigit.get(d) ?? byDigit.set(d, []).get(d)!).push(i);
  }
  for (const idxs of byDigit.values()) {
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        const na = nodes[idxs[a]!]!;
        const nb = nodes[idxs[b]!]!;
        if (groupSeesGroup(na, nb)) addEdge(idxs[a]!, idxs[b]!, 'weak');
      }
    }
  }

  if (onlyDigit === undefined) {
    const singleByCell = new Map<number, number[]>();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (n.cells.length !== 1) continue;
      const c = n.cells[0]!;
      (singleByCell.get(c) ?? singleByCell.set(c, []).get(c)!).push(i);
    }
    for (const idxs of singleByCell.values()) {
      for (let a = 0; a < idxs.length; a++) {
        for (let b = a + 1; b < idxs.length; b++) addEdge(idxs[a]!, idxs[b]!, 'weak');
      }
    }
  }

  return { nodes, adjacency, indexOfKey };
}

export interface ChainStep {
  node: number;
  incoming: LinkType | null;
}

export type Chain = ChainStep[];

export function chainToLinks(graph: LinkGraph, chain: Chain): Link[] {
  const links: Link[] = [];
  for (let i = 1; i < chain.length; i++) {
    const a = graph.nodes[chain[i - 1]!.node]!;
    const b = graph.nodes[chain[i]!.node]!;
    // `from`/`to` keep the single representative cell (cells[0]); group nodes
    // (cells.length > 1) additionally expose every group cell via fromCells/toCells
    // so the trace can express grouped AIC / grouped X-Cycle nodes (gate 7).
    const from: CellDigit = { cell: a.cells[0]!, digit: a.digit };
    const to: CellDigit = { cell: b.cells[0]!, digit: b.digit };
    const link: Link = { from, to, type: chain[i]!.incoming! };
    if (a.cells.length > 1) link.fromCells = [...a.cells];
    if (b.cells.length > 1) link.toCells = [...b.cells];
    links.push(link);
  }
  return links;
}

export { UNITS_OF };
