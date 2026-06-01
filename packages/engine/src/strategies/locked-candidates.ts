/**
 * T2: locked candidates (区块排除) — pointing and claiming.
 *
 * Pointing:    all candidates for a digit in a box are confined to ONE row
 *              (or one column); remove that digit from the rest of that row/col.
 * Claiming:    all candidates for a digit in a row/col are confined to ONE box;
 *              remove that digit from the rest of that box.
 */

import { ROWS, COLS, BOXES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);

      // === Pointing: box -> row ===
      for (let bi = 0; bi < 9; bi++) {
        const box = BOXES[bi]!;
        const cellsInRow: (number[] | undefined)[] = Array.from({ length: 9 }, () => []);
        const rowsWithDigit = new Set<number>();

        for (const cell of box) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            const r = Math.floor(cell / 9);
            cellsInRow[r]!.push(cell);
            rowsWithDigit.add(r);
          }
        }

        if (rowsWithDigit.size === 1) {
          const onlyRow = [...rowsWithDigit][0]!;
          const rowCells = cellsInRow[onlyRow]!;
          // Only valid if row has 2+ candidates (otherwise it's just hidden single)
          if (rowCells.length >= 2) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of box) {
              if (Math.floor(cell / 9) !== onlyRow && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            if (eliminations.length > 0) {
              const r1 = onlyRow + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { cells: rowCells, candidates: rowCells.map((c) => ({ cell: c, digit })), links: [] },
                explanation: {
                  zh: `数字 ${digit} 在第 ${bi + 1} 宫中全部出现在第 ${r1} 行，消去同行其他位置的 ${digit}（指向数对/三数组）。`,
                  en: `Digit ${digit} appears only in row ${r1} within box ${bi + 1}; eliminate ${digit} from the rest of that row (Pointing).`,
                },
              };
            }
          }
        }
      }

      // === Pointing: box -> col ===
      for (let bi = 0; bi < 9; bi++) {
        const box = BOXES[bi]!;
        const cellsInCol: (number[] | undefined)[] = Array.from({ length: 9 }, () => []);
        const colsWithDigit = new Set<number>();

        for (const cell of box) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            const c = cell % 9;
            cellsInCol[c]!.push(cell);
            colsWithDigit.add(c);
          }
        }

        if (colsWithDigit.size === 1) {
          const onlyCol = [...colsWithDigit][0]!;
          const colCells = cellsInCol[onlyCol]!;
          if (colCells.length >= 2) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of box) {
              if (cell % 9 !== onlyCol && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            if (eliminations.length > 0) {
              const c1 = onlyCol + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { cells: colCells, candidates: colCells.map((c) => ({ cell: c, digit })), links: [] },
                explanation: {
                  zh: `数字 ${digit} 在第 ${bi + 1} 宫中全部出现在第 ${c1} 列，消去同列其他位置的 ${digit}（指向数对/三数组）。`,
                  en: `Digit ${digit} appears only in column ${c1} within box ${bi + 1}; eliminate ${digit} from the rest of that column (Pointing).`,
                },
              };
            }
          }
        }
      }

      // === Claiming: row -> box ===
      for (let ri = 0; ri < 9; ri++) {
        const cellsByBox: (number[] | undefined)[] = Array.from({ length: 9 }, () => []);
        const boxesWithDigit = new Set<number>();

        for (const cell of ROWS[ri]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            const bi = Math.floor(cell / 27) * 3 + Math.floor((cell % 9) / 3);
            cellsByBox[bi]!.push(cell);
            boxesWithDigit.add(bi);
          }
        }

        if (boxesWithDigit.size === 1) {
          const onlyBox = [...boxesWithDigit][0]!;
          const boxCells = cellsByBox[onlyBox]!;
          if (boxCells.length >= 2) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of BOXES[onlyBox]!) {
              if (Math.floor(cell / 9) !== ri && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { cells: boxCells, candidates: boxCells.map((c) => ({ cell: c, digit })), links: [] },
                explanation: {
                  zh: `数字 ${digit} 在第 ${ri + 1} 行中仅出现在第 ${onlyBox + 1} 宫，消去该宫其他位置的 ${digit}（行宫区块排除）。`,
                  en: `Digit ${digit} in row ${ri + 1} is confined to box ${onlyBox + 1}; eliminate ${digit} from the rest of that box (Claiming).`,
                },
              };
            }
          }
        }
      }

      // === Claiming: col -> box ===
      for (let ci = 0; ci < 9; ci++) {
        const cellsByBox: (number[] | undefined)[] = Array.from({ length: 9 }, () => []);
        const boxesWithDigit = new Set<number>();

        for (const cell of COLS[ci]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            const bi = Math.floor(cell / 27) * 3 + Math.floor((cell % 9) / 3);
            cellsByBox[bi]!.push(cell);
            boxesWithDigit.add(bi);
          }
        }

        if (boxesWithDigit.size === 1) {
          const onlyBox = [...boxesWithDigit][0]!;
          const boxCells = cellsByBox[onlyBox]!;
          if (boxCells.length >= 2) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of BOXES[onlyBox]!) {
              if (cell % 9 !== ci && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { cells: boxCells, candidates: boxCells.map((c) => ({ cell: c, digit })), links: [] },
                explanation: {
                  zh: `数字 ${digit} 在第 ${ci + 1} 列中仅出现在第 ${onlyBox + 1} 宫，消去该宫其他位置的 ${digit}（列宫区块排除）。`,
                  en: `Digit ${digit} in column ${ci + 1} is confined to box ${onlyBox + 1}; eliminate ${digit} from the rest of that box (Claiming).`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};