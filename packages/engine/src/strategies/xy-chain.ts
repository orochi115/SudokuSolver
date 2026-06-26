/**
 * XY-Chain (T4) — XY 链
 *
 * A chain of bivalue cells where consecutive cells share one digit (the "hop").
 * The two free end-digits (not shared with adjacent cells) are the same digit Z.
 * Therefore at least one end holds Z, and any cell seeing both ends can have Z eliminated.
 *
 * Remote Pairs ⊆ XY-Chain (when every cell has the same pair {a,b}).
 * Y-Wing / XY-Wing is the minimal XY-Chain (3 cells).
 * XY-Chain is a strict subset of AIC (all strong links are in-cell bivalue).
 *
 * E6 note: This strategy only uses AIC in bivalue-cell mode (no digit switching
 * via house conjugate pairs). The `aic` strategy handles the general case.
 */

import {
  CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface XYNode {
  cell: number;
  digit: number; // the "active" digit at this end of the node (the one asserted to be true)
}

/**
 * Search for XY-Chains using DFS over bivalue cells.
 * Only bivalue cells participate. Consecutive cells share a hop digit.
 * Returns the first chain whose end-digits are the same Z, with at least one elimination.
 */
function searchXYChain(grid: Grid): { path: XYNode[]; eliminations: { cell: number; digit: number }[] } | null {
  // Collect bivalue cells
  const bivalue: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
  }

  if (bivalue.length < 2) return null;

  const MAX_LEN = 24;

  // For each bivalue cell as start, for each of its two digits as the "free" start digit Z:
  for (const startCell of bivalue) {
    const [d1, d2] = digitsOf(grid.candidatesOf(startCell)) as [number, number];
    // Try Z=d1 (free start digit is d1, so the hop-out digit is d2)
    // Try Z=d2 (free start digit is d2, so the hop-out digit is d1)
    for (const [freeStart, hopOut] of [[d1, d2], [d2, d1]] as [number, number][]) {
      // Path: [{cell: startCell, digit: freeStart}]
      // The "active" digit at a node is the free end digit (not shared with next)
      // hopOut is the digit shared with the next cell

      const path: XYNode[] = [{ cell: startCell, digit: freeStart }];
      const visitedCells = new Set<number>([startCell]);

      const result = dfs(grid, bivalue, path, visitedCells, hopOut, MAX_LEN);
      if (result) return result;
    }
  }
  return null;
}

function dfs(
  grid: Grid,
  bivalue: number[],
  path: XYNode[],
  visitedCells: Set<number>,
  currentHopDigit: number, // digit that must appear in the next cell (shared hop)
  maxLen: number,
): { path: XYNode[]; eliminations: { cell: number; digit: number }[] } | null {
  // Check if we can produce eliminations with the current path (length >= 2)
  if (path.length >= 2) {
    const startFree = path[0]!.digit;
    const lastNode = path[path.length - 1]!;
    // The last node's free digit is lastNode.digit.
    // The last node's hop-out digit (shared with the would-be next cell) is currentHopDigit.
    // BUT we've arrived at lastNode: the cell is lastNode.cell. Its two digits are 
    // lastNode.digit (free end = Z) and currentHopDigit (the hop we came in on).
    // Actually wait: when we arrived at lastNode.cell, we "used" the hop digit to link.
    // The cell has {currentHopDigit, lastNode.digit}? No—let me re-check the structure.
    //
    // When we enter a cell via a hop on digit H, the cell must contain H.
    // The other digit in the cell is the NEW free end.
    // So: arriving at cell C via hop H: C has {H, freeEnd}. freeEnd becomes the active digit.
    // The chain reads: -Z[start]+H[start]-H[C1]+freeEnd[C1]-freeEnd[C2]+...
    // The free end of the last node IS lastNode.digit.
    // The free start is path[0].digit = startFree.
    // If startFree === lastNode.digit, we have an XY-Chain with Z = startFree = lastNode.digit.
    
    if (startFree === lastNode.digit) {
      const Z = startFree;
      // Find eliminations: cells seeing both path[0].cell and lastNode.cell that have Z
      const startCell = path[0]!.cell;
      const endCell = lastNode.cell;
      if (startCell !== endCell) {
        const peersStart = new Set(PEERS_OF[startCell]!);
        const eliminations: { cell: number; digit: number }[] = [];
        const bit = maskOf(Z);
        for (const peer of PEERS_OF[endCell]!) {
          if (!peersStart.has(peer)) continue;
          if (visitedCells.has(peer)) continue;
          if (grid.get(peer) !== 0 || !(grid.candidatesOf(peer) & bit)) continue;
          eliminations.push({ cell: peer, digit: Z });
        }
        if (eliminations.length > 0) {
          return { path: [...path], eliminations };
        }
      }
    }
  }

  if (path.length >= maxLen) return null;

  // Extend: find bivalue cells that contain currentHopDigit and are peers of the last cell
  const lastCell = path[path.length - 1]!.cell;
  const hopBit = maskOf(currentHopDigit);

  for (const nextCell of bivalue) {
    if (visitedCells.has(nextCell)) continue;
    if (!(grid.candidatesOf(nextCell) & hopBit)) continue;
    // nextCell must be a peer of lastCell (weak link on currentHopDigit)
    if (!PEERS_OF[lastCell]!.includes(nextCell)) continue;

    // The other digit in nextCell becomes the new free end
    const [nd1, nd2] = digitsOf(grid.candidatesOf(nextCell)) as [number, number];
    const nextFree = nd1 === currentHopDigit ? nd2 : nd1;
    const nextHop = nextFree; // the hop going OUT from nextCell to the next is nextFree itself... no.
    // Actually: nextCell has {currentHopDigit, nextFree}.
    // We arrived via currentHopDigit → currentHopDigit is "used up" (asserted false at nextCell).
    // → nextFree is asserted true at nextCell.
    // The NEXT hop out of nextCell is nextFree (which will be shared with the following cell).
    // Wait—the chain alternates: inside cell = strong link. nextFree is the OUT digit.
    // The NEXT hop = nextFree (we'll look for a bivalue peer that contains nextFree).

    path.push({ cell: nextCell, digit: nextFree });
    visitedCells.add(nextCell);

    const result = dfs(grid, bivalue, path, visitedCells, nextFree, maxLen);

    path.pop();
    visitedCells.delete(nextCell);

    if (result) return result;
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['digit', 'chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const result = searchXYChain(grid);
    if (!result) return null;

    const { path, eliminations } = result;
    const startNode = path[0]!;
    const endNode = path[path.length - 1]!;
    const Z = startNode.digit; // = endNode.digit

    // Build links: strong links inside cells, weak links between cells
    const links: Link[] = [];
    for (let i = 0; i < path.length; i++) {
      const cur = path[i]!;
      const curHopIn = i === 0 ? null : digitsOf(grid.candidatesOf(cur.cell)).find((d) => d !== cur.digit) ?? null;

      if (i < path.length - 1) {
        const next = path[i + 1]!;
        // Determine hop digit (shared between cur and next)
        // It's cur's "other" digit (not cur.digit), which is the hop going OUT
        const hopDigit = digitsOf(grid.candidatesOf(cur.cell)).find((d) => d !== cur.digit)!;

        // Strong link: inside cur.cell between cur.digit and hopDigit
        if (i === 0 || true) {
          links.push({
            from: { cell: cur.cell, digit: cur.digit },
            to: { cell: cur.cell, digit: hopDigit },
            type: 'strong',
          });
        }

        // Weak link: between cur.cell(hopDigit) and next.cell(hopDigit)
        links.push({
          from: { cell: cur.cell, digit: hopDigit },
          to: { cell: next.cell, digit: hopDigit },
          type: 'weak',
        });
      }
    }

    // Also add the strong link inside the last cell
    if (path.length >= 2) {
      const last = endNode;
      const lastHopIn = digitsOf(grid.candidatesOf(last.cell)).find((d) => d !== last.digit)!;
      links.push({
        from: { cell: last.cell, digit: lastHopIn },
        to: { cell: last.cell, digit: last.digit },
        type: 'strong',
      });
    }

    const pathCells = [...new Set(path.map((n) => n.cell))];
    const highlightCands: { cell: number; digit: number }[] = [];
    for (let i = 0; i < path.length; i++) {
      const cur = path[i]!;
      highlightCands.push({ cell: cur.cell, digit: cur.digit });
      if (i < path.length - 1) {
        const hopDigit = digitsOf(grid.candidatesOf(cur.cell)).find((d) => d !== cur.digit);
        if (hopDigit !== undefined) highlightCands.push({ cell: cur.cell, digit: hopDigit });
      }
    }

    const elimCellsStr = eliminations
      .map((e) => candidateLabel(e.cell, e.digit))
      .join(', ');

    return {
      strategyId: 'xy-chain',
      placements: [],
      eliminations,
      highlights: {
        cells: [...pathCells, ...eliminations.map((e) => e.cell)],
        candidates: [...highlightCands, ...eliminations],
        links,
      },
      explanation: {
        zh: `XY 链：从 ${cellLabel(startNode.cell)}{${Z}} 到 ${cellLabel(endNode.cell)}{${Z}}，长度 ${path.length}；两端至少一个含 ${Z}，共同可见格消去 ${elimCellsStr}。`,
        en: `XY-Chain: from ${cellLabel(startNode.cell)}{${Z}} to ${cellLabel(endNode.cell)}{${Z}}, length ${path.length}; at least one end holds ${Z}, so ${elimCellsStr} can be eliminated.`,
      },
    };
  },
};
