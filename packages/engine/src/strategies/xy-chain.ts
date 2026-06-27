/**
 * XY-Chain (T4) — XY 链
 *
 * A chain of bivalue cells where each consecutive pair shares a digit (the
 * "hop digit"). Both free end-digits must be the same digit Z.
 *
 * If the chain ends at Z on both sides, then at least one endpoint holds Z,
 * so any cell seeing BOTH endpoints can have Z eliminated.
 *
 * This is a strict subset of AIC where:
 *   - All strong links are in-cell (bivalue cells only)
 *   - All weak links are between-cell
 *   - Remote Pairs (all cells share the same pair) are a special case
 *   - Y-Wing is the minimal case (3 cells)
 */

import { CELLS, PEERS_OF, maskOf, popcount, digitsOf, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

const MAX_CHAIN_LENGTH = 14; // cells in chain

interface XYNode {
  cell: number;
  digit: number; // the "active" digit at this node (the digit that is forced ON when entering)
}

/** Two cells are XY-chain-linked if they are bivalue peers sharing one digit. */
function bivaluePeers(grid: Grid, cell: number): number[] {
  if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) !== 2) return [];
  return PEERS_OF[cell]!.filter((p) => {
    if (grid.get(p) !== 0 || popcount(grid.candidatesOf(p)) !== 2) return false;
    // Must share at least one digit
    return (grid.candidatesOf(cell) & grid.candidatesOf(p)) !== 0;
  });
}

/**
 * Build an XY-chain starting from `startCell` with `startDigit` as the free
 * end digit (assumed OFF → forces the other digit in that cell ON).
 *
 * Returns a list of (cell, digit) pairs representing the chain, ending with
 * the "other" free digit at the last cell.
 *
 * Returns the chain and eliminations if found.
 */
function searchXYChain(grid: Grid): Step | null {
  // Find all bivalue cells
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
      bivalueCells.push(c);
    }
  }

  // For each bivalue cell as starting cell, try both its digits as the
  // "starting free digit" Z
  for (const startCell of bivalueCells) {
    const startMask = grid.candidatesOf(startCell);
    const [dA, dB] = digitsOf(startMask) as [number, number];

    for (const startDigit of [dA, dB]) {
      // startDigit is the free end digit Z (assumed to be false → forces other)
      const otherStart = startDigit === dA ? dB : dA;
      // Chain: we start with otherStart being ON at startCell
      // Next hop: find peers that have otherStart, and "switch" to their other digit

      const path: XYNode[] = [{ cell: startCell, digit: otherStart }];
      const visitedCells = new Set<number>([startCell]);
      const result = dfsXYChain(grid, path, visitedCells, startCell, startDigit, otherStart);
      if (result) return result;
    }
  }
  return null;
}

/**
 * DFS for XY-Chain.
 * path: current chain of nodes, where each node has the digit that is "active" (ON)
 * currentCell: last cell in chain
 * startFreeDigit: the free digit at the START cell (the Z we want at both ends)
 * activeDigit: the digit currently ON at currentCell
 */
function dfsXYChain(
  grid: Grid,
  path: XYNode[],
  visitedCells: Set<number>,
  currentCell: number,
  startFreeDigit: number,
  activeDigit: number,
): Step | null {
  if (path.length >= MAX_CHAIN_LENGTH) return null;

  // Hop to a peer bivalue cell via the activeDigit
  const bit = maskOf(activeDigit);
  for (const nextCell of PEERS_OF[currentCell]!) {
    if (visitedCells.has(nextCell)) continue;
    if (grid.get(nextCell) !== 0) continue;
    const nextMask = grid.candidatesOf(nextCell);
    if (popcount(nextMask) !== 2) continue;
    if (!(nextMask & bit)) continue; // must share activeDigit (the hop digit)

    // In nextCell, activeDigit is forced OFF (by the weak link from currentCell)
    // So the other digit of nextCell is forced ON
    const [d1, d2] = digitsOf(nextMask) as [number, number];
    const nextActiveDigit = d1 === activeDigit ? d2 : d1;

    path.push({ cell: nextCell, digit: nextActiveDigit });
    visitedCells.add(nextCell);

    // Check: does the chain end with startFreeDigit ON?
    // nextActiveDigit is the free end digit at nextCell.
    // We want the free end digit (nextActiveDigit) to equal startFreeDigit.
    if (nextActiveDigit === startFreeDigit && path.length >= 3) {
      // We have a valid XY-chain ending with Z at both ends
      const startCell = path[0]!.cell;
      const endCell = nextCell;

      // Find eliminations: cells seeing both endpoints that have startFreeDigit
      const endDigit = startFreeDigit;
      const peersStart = new Set(PEERS_OF[startCell]!);
      const endBit = maskOf(endDigit);
      const eliminations: { cell: number; digit: number }[] = [];
      for (const p of PEERS_OF[endCell]!) {
        if (!peersStart.has(p)) continue;
        if (p === startCell || p === endCell) continue;
        if (grid.get(p) !== 0 || !(grid.candidatesOf(p) & endBit)) continue;
        eliminations.push({ cell: p, digit: endDigit });
      }

      if (eliminations.length > 0) {
        const links = buildLinks(path, activeDigit, startFreeDigit);
        return buildStep(path, eliminations, links, startFreeDigit);
      }
    }

    const deeper = dfsXYChain(grid, path, visitedCells, nextCell, startFreeDigit, nextActiveDigit);
    if (deeper) return deeper;

    path.pop();
    visitedCells.delete(nextCell);
  }
  return null;
}

function buildLinks(
  path: XYNode[],
  _lastHopDigit: number,
  _startFreeDigit: number,
): import('../trace.js').Link[] {
  const links: import('../trace.js').Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i]!;
    const next = path[i + 1]!;
    // The hop digit (weak link between cells) is the digit ON at curr
    // The strong link is inside next (in-cell, bivalue)
    // For visualization: strong link = in-cell, weak = between cells
    // Between curr.cell (curr.digit ON) and next.cell: weak on curr.digit
    links.push({
      from: { cell: curr.cell, digit: curr.digit },
      to: { cell: next.cell, digit: curr.digit },
      type: 'weak',
    });
    // Then within next.cell: strong link from hop digit to active digit
    if (curr.digit !== next.digit) {
      links.push({
        from: { cell: next.cell, digit: curr.digit },
        to: { cell: next.cell, digit: next.digit },
        type: 'strong',
      });
    }
  }
  return links;
}

function buildStep(
  path: XYNode[],
  eliminations: { cell: number; digit: number }[],
  links: import('../trace.js').Link[],
  endDigit: number,
): Step {
  const startCell = path[0]!.cell;
  const endCell = path[path.length - 1]!.cell;
  const chainCells = path.map((n) => n.cell);
  const candidates = path.flatMap((n) => {
    // Show both digits of bivalue cells in the chain
    const mask = 0; // will be shown via chain
    return [{ cell: n.cell, digit: n.digit }];
  });

  return {
    strategyId: 'xy-chain',
    placements: [],
    eliminations,
    highlights: {
      cells: [...new Set([...chainCells, ...eliminations.map((e) => e.cell)])],
      candidates: [...path.map((n) => ({ cell: n.cell, digit: n.digit })), ...eliminations],
      links,
    },
    explanation: {
      zh: `XY 链：从 ${cellLabel(startCell)} 到 ${cellLabel(endCell)}，两端自由数字均为 ${endDigit}；至少其一为 ${endDigit}，故可见两端的格消去 ${endDigit}。`,
      en: `XY-Chain: from ${cellLabel(startCell)} to ${cellLabel(endCell)}, both free-end digits are ${endDigit}; one endpoint must be ${endDigit}, so cells seeing both ends can eliminate ${endDigit}.`,
    },
  };
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return searchXYChain(grid);
  },
};
