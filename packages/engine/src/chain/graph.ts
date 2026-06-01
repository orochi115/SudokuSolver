/**
 * Strong/weak link graph — the shared substrate for all chain strategies (M3).
 *
 * A NODE is a candidate-set assertion "one of these (cell,digit) entries is the
 * true placement". For a plain node that set has size 1 (a single candidate); a
 * GROUPED node holds 2-3 collinear candidates of the same digit inside one box
 * (a "group"), which lets chains traverse box/line interactions (grouped links).
 *
 * Two link kinds connect nodes (HODOKU / SudokuWiki semantics):
 *   - STRONG (A=false ⇒ B=true): at most one of A,B can be false. Realised by
 *       * conjugate links: a digit has exactly two placements in a house, or
 *       * bivalue links: a cell has exactly two candidate digits.
 *   - WEAK   (A=true  ⇒ B=false): at most one of A,B can be true. Realised when
 *       every candidate of A "sees" (shares a house with) every candidate of B
 *       on the same digit, or two digits in the same cell.
 *
 * An Alternating Inference Chain (AIC) is a path that alternates strong/weak
 * links. Its endpoints / loop discontinuities yield eliminations or placements.
 * This module builds the graph and runs a bounded BFS/DFS over it; the concrete
 * strategies (`aic`, `simple-coloring`) interpret the resulting chains.
 *
 * Pure: never mutates the grid.
 */

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

/** A node in the link graph: an assertion that one of `cells` holds `digit`. */
export interface ChainNode {
  digit: number;
  /** Cells in the assertion. length 1 = single candidate; >1 = grouped node. */
  cells: number[];
  /** Stable key for dedup / adjacency maps. */
  key: string;
}

export interface GraphEdge {
  to: number; // index into nodes[]
  type: LinkType;
}

export function nodeKey(digit: number, cells: readonly number[]): string {
  return `${digit}:${[...cells].sort((a, b) => a - b).join(',')}`;
}

/** Does a single (cell,digit) "see" another single (cell,digit) for a weak link? */
function singleSeesSingle(aCell: number, bCell: number, sameDigit: boolean): boolean {
  if (aCell === bCell) return !sameDigit; // two digits in same cell: weak link
  // different cells, same digit → must share a house
  return (
    ROW_OF[aCell] === ROW_OF[bCell] ||
    COL_OF[aCell] === COL_OF[bCell] ||
    BOX_OF[aCell] === BOX_OF[bCell]
  );
}

/** A node group sees another group (same digit) iff EVERY cell of A sees EVERY cell of B. */
function groupSeesGroup(a: ChainNode, b: ChainNode): boolean {
  if (a.digit !== b.digit) return false;
  for (const ca of a.cells) {
    for (const cb of b.cells) {
      if (ca === cb) return false; // overlapping groups can't form a clean weak link
      if (!singleSeesSingle(ca, cb, true)) return false;
    }
  }
  return true;
}

export interface LinkGraph {
  nodes: ChainNode[];
  /** adjacency[i] = edges out of node i. */
  adjacency: GraphEdge[][];
  indexOfKey: Map<string, number>;
}

interface BuildOptions {
  /** Include grouped nodes (collinear candidates in a box). Default true. */
  grouped?: boolean;
  /** Restrict to a single digit (for single-digit coloring / X-chain). */
  digit?: number;
}

/**
 * Build the link graph for the current grid.
 *
 * Strong links:
 *   - conjugate: digit d has exactly two placements in a house → strong between them.
 *     With grouped nodes, "two placements" may be two groups (box/line conjugacy).
 *   - bivalue: a cell has exactly two candidate digits → strong between those two.
 * Weak links:
 *   - same digit, two nodes whose cells mutually see each other.
 *   - same cell, two different digits (the cell holds exactly one digit).
 */
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

  // 1. Single-candidate nodes for every live candidate.
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    for (let d = 1; d <= SIZE; d++) {
      if (onlyDigit !== undefined && d !== onlyDigit) continue;
      if (m & maskOf(d)) ensureNode(d, [c]);
    }
  }

  // 2. Grouped nodes: for each box × digit, the candidate cells split by row and
  //    by column; any collinear group of size ≥ 2 inside the box is a node.
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
        // group by row
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

  // ---- STRONG links ----

  // 2a. Conjugate (digit has exactly two "positions" in a house). We treat a
  //     position as a maximal set of candidate cells of the digit inside the
  //     house that share a box (so a grouped node counts as one position).
  for (let h = 0; h < HOUSES.length; h++) {
    for (let d = 1; d <= SIZE; d++) {
      if (onlyDigit !== undefined && d !== onlyDigit) continue;
      const bit = maskOf(d);
      const cellsIn: number[] = [];
      for (const c of HOUSES[h]!) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) cellsIn.push(c);
      }
      if (cellsIn.length < 2) continue;
      // Group the house's cells into "positions" by box (for row/col houses a
      // position may span up to 3 cells in one box; for box houses each cell is
      // its own position since they share the box — there we group by line).
      const positions: number[][] = [];
      if (h < 18) {
        // row or col house: positions = group by box
        const byBox = new Map<number, number[]>();
        for (const c of cellsIn) (byBox.get(BOX_OF[c]!) ?? byBox.set(BOX_OF[c]!, []).get(BOX_OF[c]!)!).push(c);
        for (const g of byBox.values()) positions.push(g);
      } else {
        // box house: positions = group by row, and by col, but to keep it a
        // proper bipartition we only treat the whole-house conjugacy when there
        // are exactly two collinear groups. Simpler: each cell is a position.
        for (const c of cellsIn) positions.push([c]);
      }
      if (positions.length !== 2) continue;
      const [pa, pb] = positions as [number[], number[]];
      const ia = indexOfKey.get(nodeKey(d, pa));
      const ib = indexOfKey.get(nodeKey(d, pb));
      if (ia !== undefined && ib !== undefined) addEdge(ia, ib, 'strong');
    }
  }

  // 2b. Bivalue cell strong link between its two digits.
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

  // ---- WEAK links ----

  // 3a. Same digit, nodes that mutually see each other.
  // Index single nodes by digit for efficiency; also include groups.
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

  // 3b. Same cell, different digit (single nodes only).
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

// ---- chain representation ----

export interface ChainStep {
  node: number; // index into graph.nodes
  /** Link type used to ARRIVE at this node from the previous one. null for the start. */
  incoming: LinkType | null;
}

export type Chain = ChainStep[];

/** Convert a chain to Link[] (for Highlights), choosing one representative cell per node. */
export function chainToLinks(graph: LinkGraph, chain: Chain): Link[] {
  const links: Link[] = [];
  for (let i = 1; i < chain.length; i++) {
    const a = graph.nodes[chain[i - 1]!.node]!;
    const b = graph.nodes[chain[i]!.node]!;
    const from: CellDigit = { cell: a.cells[0]!, digit: a.digit };
    const to: CellDigit = { cell: b.cells[0]!, digit: b.digit };
    links.push({ from, to, type: chain[i]!.incoming! });
  }
  return links;
}

/** All single-candidate cell/digits a node "covers" (for elimination targeting). */
export function nodeMembers(node: ChainNode): CellDigit[] {
  return node.cells.map((c) => ({ cell: c, digit: node.digit }));
}

/**
 * Cells (cell,digit) eliminated when two candidate assertions A and B are both
 * "one of them is true" — i.e. a candidate z of digit `digit` that sees ALL
 * cells of A and ALL cells of B is eliminated. Used for AIC Type-1 endpoints.
 */
export function commonNeighborsElim(
  grid: Grid,
  aCells: readonly number[],
  bCells: readonly number[],
  digit: number,
): CellDigit[] {
  const out: CellDigit[] = [];
  const bit = maskOf(digit);
  const aSet = new Set(aCells);
  const bSet = new Set(bCells);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (aSet.has(c) || bSet.has(c)) continue;
    let seesAllA = true;
    for (const ac of aCells) {
      if (!PEERS_OF[c]!.includes(ac)) {
        seesAllA = false;
        break;
      }
    }
    if (!seesAllA) continue;
    let seesAllB = true;
    for (const bc of bCells) {
      if (!PEERS_OF[c]!.includes(bc)) {
        seesAllB = false;
        break;
      }
    }
    if (!seesAllB) continue;
    out.push({ cell: c, digit });
  }
  return out;
}

export { UNITS_OF };
