/**
 * Remote Pairs / Chute Remote Pairs (T4) — 远程数对 / 区块远程数对.
 *
 * A chain of identical bivalue cells {A,B} linked by conjugate (locked)
 * pairs. Cells at odd chain-distance behave as a locked pair themselves:
 * any cell seeing both endpoints loses both A and B. Chute Remote Pairs is
 * the box-restricted shortcut: two remote {A,B} cells in one chute let you
 * eliminate the digit absent from the third box of the chute.
 *
 * Remote Pairs are wholly subsumed by XY-Chain (which has the broader form
 * allowing different pairs). Per Roadmap ② overlap rule we still register
 * this as a presentation alias — it fires from a more targeted search and
 * produces a distinct strategyId for human-readable trace.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf, popcount, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function isConjugatePair(grid: Grid, c1: number, c2: number, digit: number): boolean {
  const bit = maskOf(digit);
  // Check the unique shared house; both must see each other (in same row/col/box)
  if (ROW_OF[c1] === ROW_OF[c2]) {
    let count = 0;
    for (let c = 0; c < 9; c++) {
      const cc = ROW_OF[c1]! * 9 + c;
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  if (COL_OF[c1] === COL_OF[c2]) {
    let count = 0;
    for (let c = 0; c < 9; c++) {
      const cc = c * 9 + COL_OF[c1]!;
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  if (BOX_OF[c1] === BOX_OF[c2]) {
    let count = 0;
    for (const cc of BOXES[BOX_OF[c1]!]!) {
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  return false;
}

/** Build connected components of {A,B} bivalue cells, where edges are
 *  conjugate-pair (locked) links. */
function buildRPComponents(grid: Grid): Array<{ cells: number[]; a: number; b: number }> {
  // Collect all bivalue cells
  const bivalues: Array<{ cell: number; a: number; b: number }> = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) if (m & maskOf(d)) digits.push(d);
    bivalues.push({ cell: c, a: digits[0]!, b: digits[1]! });
  }

  // Group by pair mask
  const byMask = new Map<number, typeof bivalues>();
  for (const bv of bivalues) {
    const mask = maskOf(bv.a) | maskOf(bv.b);
    if (!byMask.has(mask)) byMask.set(mask, []);
    byMask.get(mask)!.push(bv);
  }

  const result: Array<{ cells: number[]; a: number; b: number }> = [];
  for (const [mask, list] of byMask) {
    const a = (() => { for (let d = 1; d <= 9; d++) if (mask & maskOf(d)) return d; return 0; })();
    const b = (() => { let first = 0; for (let d = 1; d <= 9; d++) if (mask & maskOf(d)) { if (first === 0) first = d; else return d; } return 0; })();
    // Build adjacency: two cells connected if they share a house and form a
    // conjugate pair on either digit
    const adj = new Map<number, Set<number>>();
    for (const u of list) {
      if (!adj.has(u.cell)) adj.set(u.cell, new Set());
      for (const v of list) {
        if (u.cell >= v.cell) continue;
        if (PEERS_OF[u.cell]!.includes(v.cell)) {
          // conjugate pair on a or b?
          if (isConjugatePair(grid, u.cell, v.cell, a) || isConjugatePair(grid, u.cell, v.cell, b)) {
            adj.get(u.cell)!.add(v.cell);
            if (!adj.has(v.cell)) adj.set(v.cell, new Set());
            adj.get(v.cell)!.add(u.cell);
          }
        }
      }
    }
    const visited = new Set<number>();
    for (const start of list) {
      if (visited.has(start.cell)) continue;
      const queue = [start.cell];
      visited.add(start.cell);
      const comp: number[] = [];
      while (queue.length) {
        const c = queue.shift()!;
        comp.push(c);
        for (const n of adj.get(c) ?? []) {
          if (visited.has(n)) continue;
          visited.add(n);
          queue.push(n);
        }
      }
      if (comp.length >= 2) result.push({ cells: comp, a, b });
    }
  }
  return result;
}

export function tryRemotePairs(grid: Grid): Step | null {
  for (const { cells, a, b } of buildRPComponents(grid)) {
    // BFS shortest paths from a source to determine parity. For small
    // components (length 2..6 typical), brute compute all pairs.
    const parity = new Map<number, number>();
    const queue: number[] = [cells[0]!];
    parity.set(cells[0]!, 0);
    while (queue.length) {
      const c = queue.shift()!;
      const pcells = cells.filter((x) => x !== c && (PEERS_OF[c]!.includes(x)));
      for (const n of pcells) {
        if (parity.has(n)) continue;
        if (!isConjugatePair(grid, c, n, a) && !isConjugatePair(grid, c, n, b)) continue;
        parity.set(n, parity.get(c)! + 1);
        queue.push(n);
      }
    }

    // Find odd-parity pairs of endpoints
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const p1 = parity.get(cells[i]!);
        const p2 = parity.get(cells[j]!);
        if (p1 === undefined || p2 === undefined) continue;
        if ((p1 - p2) % 2 === 0) continue; // need odd distance
        const u = cells[i]!;
        const v = cells[j]!;
        const aBit = maskOf(a);
        const bBit = maskOf(b);
        const peersU = new Set(PEERS_OF[u]!);
        const elims: { cell: number; digit: number }[] = [];
        for (const cc of PEERS_OF[v]!) {
          if (!peersU.has(cc)) continue;
          if (cc === u || cc === v) continue;
          if (grid.get(cc) !== 0) continue;
          if (grid.hasCandidate(cc, a)) elims.push({ cell: cc, digit: a });
          if (grid.hasCandidate(cc, b)) elims.push({ cell: cc, digit: b });
        }
        if (elims.length === 0) continue;
        const chainCells = cells.filter((c) => parity.has(c));
        return {
          strategyId: 'remote-pairs',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...chainCells, ...elims.map((e) => e.cell)],
            candidates: chainCells.flatMap((c) => [{ cell: c, digit: a }, { cell: c, digit: b }]),
            links: [],
          },
          explanation: {
            zh: `远程数对：{ ${a},${b} } 双值链 ${chainCells.map(cellLabel).join('、')} 中两端 ${cellLabel(u)}、${cellLabel(v)} 在奇数距离；可见两端的格消去 ${a} 和 ${b}（远程数对）。`,
            en: `Remote Pairs: chain of bivalue {${a},${b}} cells ${chainCells.map(cellLabel).join(', ')} has endpoints ${cellLabel(u)}, ${cellLabel(v)} at odd distance; eliminate ${a} and ${b} from cells seeing both endpoints.`,
          },
        };
      }
    }
  }
  return null;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryRemotePairs(grid);
  },
};