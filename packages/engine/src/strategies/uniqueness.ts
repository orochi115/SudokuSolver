/**
 * T4: Uniqueness strategies.
 *
 * These techniques rely on the assumption that the puzzle has a unique solution.
 * They are optional and should be controlled by a config flag.
 *
 * Patterns:
 * - Unique Rectangle (UR): 4 cells forming a rectangle with same 2 candidates
 * - Avoidable Rectangle (AR): UR but one corner is solved
 * - BUG (Bivalue Universal Grave): all remaining cells are bivalue (deadly pattern)
 * - BUG+1: BUG pattern with one extra candidate
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'uniqueness';

interface UniquenessConfig {
  enabled: boolean;
}

const config: UniquenessConfig = { enabled: false };

export function setUniquenessEnabled(enabled: boolean): void {
  config.enabled = enabled;
}

export function isUniquenessEnabled(): boolean {
  return config.enabled;
}

interface RectCandidate {
  cells: [number, number, number, number];
  digits: [number, number];
  type: 'UR' | 'AR' | 'BUG' | 'BUG+1';
}

function findRectCandidates(grid: Grid): RectCandidate | null {
  for (let d1 = 1; d1 <= 8; d1++) {
    for (let d2 = d1 + 1; d2 <= 9; d2++) {
      for (let r1 = 0; r1 < 8; r1++) {
        for (let r2 = r1 + 1; r2 < 9; r2++) {
          for (let c1 = 0; c1 < 8; c1++) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              const cell00 = r1 * 9 + c1;
              const cell01 = r1 * 9 + c2;
              const cell10 = r2 * 9 + c1;
              const cell11 = r2 * 9 + c2;

              const v00 = grid.values[cell00];
              const v01 = grid.values[cell01];
              const v10 = grid.values[cell10];
              const v11 = grid.values[cell11];

              const m00 = grid.candidatesOf(cell00);
              const m01 = grid.candidatesOf(cell01);
              const m10 = grid.candidatesOf(cell10);
              const m11 = grid.candidatesOf(cell11);

              const hasD1 = (m00 | m01 | m10 | m11) & maskOf(d1);
              const hasD2 = (m00 | m01 | m10 | m11) & maskOf(d2);

              if (!hasD1 || !hasD2) continue;

              const cells = [cell00, cell01, cell10, cell11] as [number, number, number, number];
              const digits = [d1, d2] as [number, number];

              const emptyCount = [v00, v01, v10, v11].filter(v => v === 0).length;

              if (emptyCount === 4) {
                const hasOnlyD1D2 = [m00, m01, m10, m11].every(m => (m & ~(maskOf(d1) | maskOf(d2))) === 0);
                const hasAllD1D2 = [m00, m01, m10, m11].every(m => (m & (maskOf(d1) | maskOf(d2))) !== 0);
                if (hasOnlyD1D2 && hasAllD1D2) {
                  return { cells, digits, type: 'UR' };
                }
              } else if (emptyCount === 3) {
                const hasD1AndD2 = [m00, m01, m10, m11].some(m => (m & maskOf(d1)) !== 0) &&
                  [m00, m01, m10, m11].some(m => (m & maskOf(d2)) !== 0);
                if (hasD1AndD2) {
                  return { cells, digits, type: 'AR' };
                }
              } else if (emptyCount === 0) {
                return null;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function findBUG(grid: Grid): { elims: CellDigit[]; type: 'BUG' | 'BUG+1' } | null {
  let bivalueCount = 0;
  let extraCandidates: CellDigit[] = [];

  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] !== 0) continue;
    const mask = grid.candidatesOf(cell);
    const digits = digitsOf(mask);

    if (digits.length === 2) {
      bivalueCount++;
    } else if (digits.length > 0) {
      for (const d of digits) {
        extraCandidates.push({ cell, digit: d });
      }
    }
  }

  if (bivalueCount >= 20 && extraCandidates.length === 0) {
    return { elims: [], type: 'BUG' };
  } else if (bivalueCount >= 20 && extraCandidates.length === 1) {
    return { elims: extraCandidates, type: 'BUG+1' };
  }

  return null;
}

function findUniqueRectangle(grid: Grid): Step | null {
  const rect = findRectCandidates(grid);
  if (!rect) return null;

  const { cells, digits, type } = rect;

  if (type === 'UR') {
    for (let i = 0; i < 4; i++) {
      const corner = cells[i]!;
      const mask = grid.candidatesOf(corner);
      const cornerDigits = digitsOf(mask);

      for (const d of cornerDigits) {
        const otherDigits = digits.filter(dd => dd !== d);
        const otherCells = cells.filter((_, idx) => idx !== i);

        const canEliminate = otherCells.every(c => {
          const m = grid.candidatesOf(c);
          return (m & maskOf(d)) !== 0;
        });

        if (canEliminate) {
          const elimCell = corner;
          const r = Math.floor(elimCell / 9) + 1;
          const c = (elimCell % 9) + 1;
          return {
            strategyId: STRATEGY_ID,
            placements: [],
            eliminations: [{ cell: elimCell, digit: d }],
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(digit => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `唯一矩形: 4格形成${digits[0]}${digits[1]}的双值矩形，消去角落 R${r}C${c} 的候选 ${d}。`,
              en: `Unique Rectangle: 4 cells form a bivalue rectangle with ${digits[0]}${digits[1]}, eliminating corner candidate ${d} at R${r}C${c}.`,
            },
          };
        }
      }
    }
  } else if (type === 'AR') {
    const emptyIdx = cells.findIndex(c => grid.values[c] === 0);
    const solvedIdx = cells.findIndex(c => grid.values[c] !== 0);

    if (emptyIdx !== -1 && solvedIdx !== -1) {
      const emptyCell = cells[emptyIdx]!;
      const solvedValue = grid.values[cells[solvedIdx]!]!;

      for (const d of digits) {
        if (d === solvedValue) continue;

        if (grid.hasCandidate(emptyCell, d)) {
          const r = Math.floor(emptyCell / 9) + 1;
          const c = (emptyCell % 9) + 1;
          return {
            strategyId: STRATEGY_ID,
            placements: [],
            eliminations: [{ cell: emptyCell, digit: d }],
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(digit => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `可避免矩形: 4格形成${digits[0]}${digits[1]}矩形，其中一格已确定为 ${solvedValue}，消去空格的候选 ${d}。`,
              en: `Avoidable Rectangle: 4 cells form a ${digits[0]}${digits[1]} rectangle with one corner solved as ${solvedValue}, eliminating candidate ${d} from empty cell.`,
            },
          };
        }
      }
    }
  }

  return null;
}

export const uniqueness: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '唯一性技巧', en: 'Uniqueness' },
  difficulty: 90,

  apply(_grid: Grid): Step | null {
    return null;
  },
};