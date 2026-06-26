/**
 * P2 Wing Strategies — VWXYZ-Wing (size-5 wing ladder)
 *
 * VWXYZ-Wing is the size-5 generalization of WXYZ-Wing:
 *   5 cells, 5 distinct digits, NRC (non-restricted common) digit Z.
 *   The NRC digit Z can be eliminated from cells seeing all Z-instances in the pattern.
 *
 * Wing size ladder:
 *   XY-Wing:    2+1=3 cells, 3 digits   (already implemented)
 *   XYZ-Wing:   3 cells, 3 digits        (already implemented)
 *   WXYZ-Wing:  4 cells, 4 digits        (already implemented in wings-advanced)
 *   VWXYZ-Wing: 5 cells, 5 digits        (P2 — this file)
 *
 * The pattern:
 *   - 5 cells with combined exactly 5 distinct digits
 *   - Type 1: exactly 1 NRC digit Z → eliminate Z from cells seeing all Z in pattern
 *   - Type 2: all digits restricted → eliminate any digit from cells seeing all instances
 */

import {
  CELLS,
  ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Check if digit d is "non-restricted common" in cells: appears in >=2 cells, NOT all see each other. */
function isNRC(grid: Grid, cells: number[], d: number): boolean {
  const bit = maskOf(d);
  const withD = cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
  if (withD.length < 2) return false;
  for (let i = 0; i < withD.length; i++) {
    for (let j = i + 1; j < withD.length; j++) {
      if (!PEERS_OF[withD[i]!]!.includes(withD[j]!)) return true;
    }
  }
  return false;
}

function tryVWXYZWing(grid: Grid): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) >= 2) emptyCells.push(c);
  }

  // VWXYZ-Wing: 5 cells with exactly 5 distinct candidates total
  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        for (let l = k + 1; l < emptyCells.length; l++) {
          for (let m = l + 1; m < emptyCells.length; m++) {
            const cells = [emptyCells[i]!, emptyCells[j]!, emptyCells[k]!, emptyCells[l]!, emptyCells[m]!];

            // All 5 cells must have exactly 5 distinct candidates total
            let unionMask = 0;
            for (const c of cells) unionMask |= grid.candidatesOf(c);
            if (popcount(unionMask) !== 5) continue;

            const digits = digitsOf(unionMask);

            // Find NRC digits
            const nrcDigits = digits.filter((d) => isNRC(grid, cells, d));

            // Type 1: exactly 1 NRC digit Z → eliminate Z from cells seeing all Z in pattern
            if (nrcDigits.length === 1) {
              const Z = nrcDigits[0]!;
              const zBit = maskOf(Z);
              const zCells = cells.filter((c) => grid.candidatesOf(c) & zBit);

              const elims: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (grid.get(c) !== 0) continue;
                if (!(grid.candidatesOf(c) & zBit)) continue;
                if (cells.includes(c)) continue;
                const peers = new Set(PEERS_OF[c]!);
                if (zCells.every((zc) => peers.has(zc))) {
                  elims.push({ cell: c, digit: Z });
                }
              }
              if (elims.length === 0) continue;

              return {
                strategyId: 'vwxyz-wing',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...cells, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `VWXYZ翼 Type1：五格（${cells.map(cellLabel).join(',')}）共含五个候选数 {${digits.join(',')}}，非受限公共候选数为 ${Z}；消去能看到所有 ${Z} 候选格的格中的 ${Z}。`,
                  en: `VWXYZ-Wing Type 1: five cells (${cells.map(cellLabel).join(',')}) with 5 candidates {${digits.join(',')}}, NRC digit is ${Z}; eliminate ${Z} from cells seeing all ${Z} in the pattern.`,
                },
              };
            }

            // Type 2: all digits restricted → eliminate any digit from cells seeing all instances
            if (nrcDigits.length === 0) {
              for (const d of digits) {
                const bit = maskOf(d);
                const dCells = cells.filter((c) => grid.candidatesOf(c) & bit);
                const elims: { cell: number; digit: number }[] = [];
                for (let c = 0; c < CELLS; c++) {
                  if (grid.get(c) !== 0) continue;
                  if (!(grid.candidatesOf(c) & bit)) continue;
                  if (cells.includes(c)) continue;
                  const peers = new Set(PEERS_OF[c]!);
                  if (dCells.every((dc) => peers.has(dc))) {
                    elims.push({ cell: c, digit: d });
                  }
                }
                if (elims.length === 0) continue;
                return {
                  strategyId: 'vwxyz-wing',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set([...cells, ...elims.map((e) => e.cell)])],
                    candidates: [
                      ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `VWXYZ翼 Type2：五格（${cells.map(cellLabel).join(',')}）共含五个受限候选数 {${digits.join(',')}}，消去能看到全部 ${d} 的格中的 ${d}。`,
                    en: `VWXYZ-Wing Type 2: five cells (${cells.map(cellLabel).join(',')}) with 5 restricted candidates {${digits.join(',')}}; eliminate ${d} from cells seeing all ${d} in the pattern.`,
                  },
                };
              }
            }
          }
        }
      }
    }
  }
  return null;
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ 翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryVWXYZWing(grid);
  },
};
