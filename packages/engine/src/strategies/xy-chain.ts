/** XY-Chain — bivalue-cell AIC special case. */

import { CELLS, PEERS_OF, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface Node { cell: number; digit: number }

const MAX_NODES = 14;

function key(n: Node): number {
  return n.cell * 10 + n.digit;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function bivalueDigits(grid: Grid, cell: number): number[] {
  if (grid.get(cell) !== 0) return [];
  const mask = grid.candidatesOf(cell);
  return popcount(mask) === 2 ? digitsOf(mask) : [];
}

function strongCellNeighbor(grid: Grid, node: Node): Node[] {
  const ds = bivalueDigits(grid, node.cell);
  if (ds.length !== 2) return [];
  return ds.filter((digit) => digit !== node.digit).map((digit) => ({ cell: node.cell, digit }));
}

function weakDigitNeighbors(grid: Grid, node: Node): Node[] {
  const out: Node[] = [];
  for (const peer of PEERS_OF[node.cell]!) {
    if (peer === node.cell || !grid.hasCandidate(peer, node.digit)) continue;
    if (bivalueDigits(grid, peer).length !== 2) continue;
    out.push({ cell: peer, digit: node.digit });
  }
  return out;
}

function commonPeerEliminations(grid: Grid, start: Node, end: Node, pathCells: Set<number>): { cell: number; digit: number }[] {
  if (start.digit !== end.digit || start.cell === end.cell) return [];
  const peers = new Set(PEERS_OF[start.cell]!);
  const bit = maskOf(start.digit);
  return PEERS_OF[end.cell]!
    .filter((cell) => !pathCells.has(cell) && peers.has(cell) && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0)
    .map((cell) => ({ cell, digit: start.digit }));
}

function buildStep(grid: Grid, path: Node[], linkTypes: ('strong' | 'weak')[], eliminations: { cell: number; digit: number }[]): Step | null {
  if (eliminations.length === 0) return null;
  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({ from: path[i]!, to: path[i + 1]!, type: linkTypes[i]! });
  }
  const start = path[0]!;
  const end = path[path.length - 1]!;
  return {
    strategyId: 'xy-chain',
    placements: [],
    eliminations,
    highlights: {
      cells: [...new Set([...path.map((n) => n.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [...path.map((n) => ({ cell: n.cell, digit: n.digit })), ...eliminations],
      links,
    },
    explanation: {
      zh: `XY-Chain（双值格链）：从 ${cellLabel(start.cell)} 的 ${start.digit} 经双值格强链和同数字弱链交替到 ${cellLabel(end.cell)} 的 ${end.digit}；看见两端的格可消去 ${start.digit}。`,
      en: `XY-Chain: alternating bivalue-cell strong links and same-digit weak links connect ${cellLabel(start.cell)}=${start.digit} to ${cellLabel(end.cell)}=${end.digit}; cells seeing both endpoints can eliminate ${start.digit}.`,
    },
  };
}

function search(grid: Grid): Step | null {
  const starts: Node[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    for (const digit of bivalueDigits(grid, cell)) starts.push({ cell, digit });
  }

  function dfs(path: Node[], linkTypes: ('strong' | 'weak')[], visited: Set<number>, nextLink: 'strong' | 'weak'): Step | null {
    if (path.length >= 4 && linkTypes[linkTypes.length - 1] === 'strong') {
      const pathCells = new Set(path.map((n) => n.cell));
      const eliminations = commonPeerEliminations(grid, path[0]!, path[path.length - 1]!, pathCells);
      const step = buildStep(grid, path, linkTypes, eliminations);
      if (step) return step;
    }
    if (path.length >= MAX_NODES) return null;
    const current = path[path.length - 1]!;
    const neighbors = nextLink === 'strong' ? strongCellNeighbor(grid, current) : weakDigitNeighbors(grid, current);
    for (const next of neighbors) {
      const k = key(next);
      if (visited.has(k)) continue;
      visited.add(k);
      path.push(next);
      linkTypes.push(nextLink);
      const result = dfs(path, linkTypes, visited, nextLink === 'strong' ? 'weak' : 'strong');
      linkTypes.pop();
      path.pop();
      visited.delete(k);
      if (result) return result;
    }
    return null;
  }

  for (const start of starts) {
    const visited = new Set([key(start)]);
    const result = dfs([start], [], visited, 'strong');
    if (result) return result;
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY-Chain', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index', 'chain-length'],
  apply: search,
};
