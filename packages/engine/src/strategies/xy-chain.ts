import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface XYNode {
  cell: number;
  entryDigit: number;
  exitDigit: number;
}

function findXYChain(grid: Grid): Step | null {
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
      bivalueCells.push(c);
    }
  }
  if (bivalueCells.length < 2) return null;

  const bivalMap = new Map<number, [number, number]>();
  for (const c of bivalueCells) {
    const ds = digitsOf(grid.candidatesOf(c));
    bivalMap.set(c, [ds[0]!, ds[1]!]);
  }

  const maxLen = 12;

  for (const startCell of bivalueCells) {
    const [d1, d2] = bivalMap.get(startCell)!;
    for (const startDigit of [d1, d2]) {
      const exitDigit = startDigit === d1 ? d2 : d1;
      const result = dfsXYChain(
        grid, startCell, exitDigit, startCell, startDigit,
        [{ cell: startCell, entryDigit: startDigit, exitDigit }],
        new Set([startCell]), bivalMap, maxLen,
      );
      if (result) return result;
    }
  }
  return null;
}

function dfsXYChain(
  grid: Grid,
  currentCell: number,
  exitDigit: number,
  startCell: number,
  startDigit: number,
  path: XYNode[],
  visited: Set<number>,
  bivalMap: Map<number, [number, number]>,
  maxLen: number,
): Step | null {
  if (path.length >= 2 && exitDigit === startDigit && currentCell !== startCell) {
    if (PEERS_OF[currentCell]!.includes(startCell)) {
      const elims: { cell: number; digit: number }[] = [];
      const commonPeers = PEERS_OF[currentCell]!.filter((c) => PEERS_OF[startCell]!.includes(c));
      for (const c of commonPeers) {
        if (c === currentCell || c === startCell) continue;
        if (grid.hasCandidate(c, startDigit)) {
          elims.push({ cell: c, digit: startDigit });
        }
      }
      if (elims.length > 0) {
        return buildXYChainStep(grid, path, startCell, currentCell, startDigit, elims);
      }
    }
  }

  if (path.length >= maxLen) return null;

  for (const peer of PEERS_OF[currentCell]!) {
    if (visited.has(peer)) continue;
    if (!bivalMap.has(peer)) continue;
    const [pd1, pd2] = bivalMap.get(peer)!;
    if (pd1 !== exitDigit && pd2 !== exitDigit) continue;

    const peerEntry = exitDigit;
    const peerExit = peerEntry === pd1 ? pd2 : pd1;

    visited.add(peer);
    path.push({ cell: peer, entryDigit: peerEntry, exitDigit: peerExit });

    const result = dfsXYChain(
      grid, peer, peerExit, startCell, startDigit,
      path, visited, bivalMap, maxLen,
    );
    if (result) return result;

    path.pop();
    visited.delete(peer);
  }

  return null;
}

function buildXYChainStep(
  grid: Grid,
  path: XYNode[],
  startCell: number,
  endCell: number,
  digit: number,
  elims: { cell: number; digit: number }[],
): Step {
  const links: Link[] = [];
  for (let i = 0; i < path.length; i++) {
    const node = path[i]!;
    if (node.entryDigit !== node.exitDigit) {
      links.push({
        from: { cell: node.cell, digit: node.entryDigit },
        to: { cell: node.cell, digit: node.exitDigit },
        type: 'strong',
      });
    }
    if (i < path.length - 1) {
      const next = path[i + 1]!;
      links.push({
        from: { cell: node.cell, digit: node.exitDigit },
        to: { cell: next.cell, digit: next.entryDigit },
        type: 'weak',
      });
    }
  }

  const chainCells = path.map((n) => n.cell);
  return {
    strategyId: 'xy-chain',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set([...chainCells, ...elims.map((e) => e.cell)])],
      candidates: [
        ...path.flatMap((n) => [
          { cell: n.cell, digit: n.entryDigit },
          { cell: n.cell, digit: n.exitDigit },
        ]),
        ...elims,
      ],
      links,
    },
    explanation: {
      zh: `XY-Chain：从 ${cellLabel(startCell)} 的 ${digit} 经双值格链到 ${cellLabel(endCell)} 的 ${digit}，两端至少其一为真；消去同时可见两端的格中的 ${digit}。`,
      en: `XY-Chain: from ${cellLabel(startCell)}=${digit} through bivalue cells to ${cellLabel(endCell)}=${digit}; at least one endpoint is true, so eliminate ${digit} from cells seeing both.`,
    },
  };
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY-Chain', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    return findXYChain(grid);
  },
};
