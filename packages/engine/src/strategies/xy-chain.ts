import {
  CELLS, PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1}`;
}

const MAX_CHAIN_LENGTH = 10;

function searchXyChain(grid: Grid): Step | null {
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (popcount(grid.candidatesOf(c)) === 2) bivalueCells.push(c);
  }

  for (const startCell of bivalueCells) {
    const startM = grid.candidatesOf(startCell);
    const sd = digitsOf(startM);
    const z = sd[0]!;
    const a = sd[1]!;

    for (const targetDigit of [z, a]) {
      const otherStart = targetDigit === z ? a : z;
      const result = walkChain(grid, bivalueCells, startCell, otherStart, targetDigit, [startCell], new Set([startCell]));
      if (result) return result;
    }
  }
  return null;
}

function walkChain(
  grid: Grid,
  bivalueCells: number[],
  cell: number,
  hopDigit: number,
  targetDigit: number,
  path: number[],
  visited: Set<number>,
): Step | null {
  for (const next of bivalueCells) {
    if (visited.has(next)) continue;
    if (!PEERS_OF[cell]!.includes(next)) continue;
    if (!grid.hasCandidate(next, hopDigit)) continue;

    const nextM = grid.candidatesOf(next);
    const nextDigits = digitsOf(nextM);
    if (nextDigits.length !== 2) continue;

    const otherDigit = nextDigits[0] === hopDigit ? nextDigits[1]! : nextDigits[0]!;

    const newPath = [...path, next];
    if (otherDigit === targetDigit && newPath.length >= 3) {
      const start = newPath[0]!;
      const end = next;
      const eliminations: { cell: number; digit: number }[] = [];
      const peersOfStart = new Set(PEERS_OF[start]!);
      for (const c of PEERS_OF[end]!) {
        if (!peersOfStart.has(c)) continue;
        if (c === start || c === end) continue;
        if (newPath.includes(c)) continue;
        if (grid.hasCandidate(c, targetDigit)) {
          eliminations.push({ cell: c, digit: targetDigit });
        }
      }
      if (eliminations.length > 0) {
        return {
          strategyId: 'xy-chain',
          placements: [],
          eliminations,
          highlights: {
            cells: [...new Set([...newPath, ...eliminations.map((e) => e.cell)])],
            candidates: [
              ...newPath.map((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))).flat(),
              ...eliminations,
            ],
            links: [],
          },
          explanation: {
            zh: `XY链：双值格 ${newPath.map((c) => cellLabel(c)).join('-')}，两端数字均为 ${targetDigit}；至少一端为真，消去两端公共可见格的 ${targetDigit}。`,
            en: `XY-Chain: bivalue cells ${newPath.map((c) => cellLabel(c)).join('-')}, both ends digit ${targetDigit}; at least one end is true, eliminate from common peers.`,
          },
        };
      }
    }

    if (newPath.length >= MAX_CHAIN_LENGTH) continue;

    visited.add(next);
    const result = walkChain(grid, bivalueCells, next, otherDigit, targetDigit, newPath, visited);
    visited.delete(next);
    if (result) return result;
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return searchXyChain(grid);
  },
};