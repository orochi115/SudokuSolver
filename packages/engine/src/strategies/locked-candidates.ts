/**
 * T2: Locked Candidates — Pointing & Claiming.
 *
 * Pointing:  a digit's candidates in a box are all confined to one row/col.
 *            Eliminate that digit from the rest of the row/col.
 * Claiming:  a digit's candidates in a row/col are all confined to one box.
 *            Eliminate that digit from the rest of the box.
 */

import { HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'locked-candidates';

export const lockedCandidates: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // Pointing: box -> row/col
    for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
      const box = BOXES[boxIdx]!;
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const cellsInRow: number[] = [];
        const cellsInCol: number[] = [];
        for (const cell of box) {
          if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
            const r = ROW_OF[cell]!;
            const c = COL_OF[cell]!;
            if (!cellsInRow.includes(r)) cellsInRow.push(r);
            if (!cellsInCol.includes(c)) cellsInCol.push(c);
          }
        }
        if (cellsInRow.length === 1) {
          const row = cellsInRow[0]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells: number[] = [];
          for (const cell of box) {
            if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
              highlightCells.push(cell);
            }
          }
          for (const c of ROWS[row]!) {
            if (grid.values[c] === 0 && !box.includes(c) && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: highlightCells,
                candidates: highlightCells.map((cell) => ({ cell, digit: d })),
                links: [],
              },
              explanation: {
                zh: `数字 ${d} 在该宫中的候选全部位于第 ${row + 1} 行，构成指向数对/三数组，消去该行其他格中的 ${d}（指向排除）。`,
                en: `Digit ${d} appears only in row ${row + 1} within box ${boxIdx + 1}, eliminating ${d} from the rest of the row (Pointing).`,
              },
            };
          }
        }
        if (cellsInCol.length === 1) {
          const col = cellsInCol[0]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells: number[] = [];
          for (const cell of box) {
            if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
              highlightCells.push(cell);
            }
          }
          for (const c of COLS[col]!) {
            if (grid.values[c] === 0 && !box.includes(c) && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: highlightCells,
                candidates: highlightCells.map((cell) => ({ cell, digit: d })),
                links: [],
              },
              explanation: {
                zh: `数字 ${d} 在该宫中的候选全部位于第 ${col + 1} 列，构成指向数对/三数组，消去该列其他格中的 ${d}（指向排除）。`,
                en: `Digit ${d} appears only in column ${col + 1} within box ${boxIdx + 1}, eliminating ${d} from the rest of the column (Pointing).`,
              },
            };
          }
        }
      }
    }

    // Claiming: row -> box
    for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
      const row = ROWS[rowIdx]!;
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const boxSet = new Set<number>();
        for (const cell of row) {
          if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
            boxSet.add(BOX_OF[cell]!);
          }
        }
        if (boxSet.size === 1) {
          const boxIdx = [...boxSet][0]!;
          const box = BOXES[boxIdx]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells: number[] = [];
          for (const cell of row) {
            if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
              highlightCells.push(cell);
            }
          }
          for (const cell of box) {
            if (!row.includes(cell) && grid.values[cell] === 0 && grid.hasCandidate(cell, d)) {
              elims.push({ cell, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: highlightCells,
                candidates: highlightCells.map((cell) => ({ cell, digit: d })),
                links: [],
              },
              explanation: {
                zh: `数字 ${d} 在第 ${rowIdx + 1} 行的候选全部位于同一宫，消除该宫其他格中的 ${d}（行列声明排除）。`,
                en: `Digit ${d} appears only in box ${boxIdx + 1} within row ${rowIdx + 1}, eliminating ${d} from the rest of the box (Claiming).`,
              },
            };
          }
        }
      }
    }

    // Claiming: col -> box
    for (let colIdx = 0; colIdx < 9; colIdx++) {
      const col = COLS[colIdx]!;
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const boxSet = new Set<number>();
        for (const cell of col) {
          if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
            boxSet.add(BOX_OF[cell]!);
          }
        }
        if (boxSet.size === 1) {
          const boxIdx = [...boxSet][0]!;
          const box = BOXES[boxIdx]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells: number[] = [];
          for (const cell of col) {
            if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
              highlightCells.push(cell);
            }
          }
          for (const cell of box) {
            if (!col.includes(cell) && grid.values[cell] === 0 && grid.hasCandidate(cell, d)) {
              elims.push({ cell, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: STRATEGY_ID,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: highlightCells,
                candidates: highlightCells.map((cell) => ({ cell, digit: d })),
                links: [],
              },
              explanation: {
                zh: `数字 ${d} 在第 ${colIdx + 1} 列的候选全部位于同一宫，消除该宫其他格中的 ${d}（行列声明排除）。`,
                en: `Digit ${d} appears only in box ${boxIdx + 1} within column ${colIdx + 1}, eliminating ${d} from the rest of the box (Claiming).`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};
