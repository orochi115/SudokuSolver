/**
 * Locked Candidates (T2) — 区块排除
 *
 * Two sub-strategies:
 *  - Pointing: all candidates for a digit in a box lie in one row/column →
 *    eliminate from that row/column outside the box.
 *  - Claiming: all candidates for a digit in a row/column lie in one box →
 *    eliminate from the rest of that box.
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // --- Pointing: box → row / col ---
    for (let b = 0; b < 9; b++) {
      const box = BOXES[b]!;

      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        // Collect all empty cells in box that have digit d as candidate
        const cells = box.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cells.length < 2) continue;

        // Check if all cells share the same row
        const rows = new Set(cells.map((c) => ROW_OF[c]!));
        if (rows.size === 1) {
          const rowIdx = rows.values().next().value as number;
          const rowCells = ROWS[rowIdx]!;
          const elims = rowCells.filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && BOX_OF[c] !== b,
          );
          if (elims.length > 0) {
            const cellsStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims.map((c) => ({ cell: c, digit: d })),
              highlights: {
                cells: [...cells, ...elims],
                candidates: [
                  ...cells.map((c) => ({ cell: c, digit: d })),
                  ...elims.map((c) => ({ cell: c, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `宫 B${b + 1} 中，数字 ${d} 的候选数（${cellsStr}）都在第 ${rowIdx + 1} 行，可以消除该行其他格中的 ${d}（指向排除）。`,
                en: `In box B${b + 1}, all candidates for ${d} (${cellsStr}) lie in row R${rowIdx + 1}, so ${d} can be eliminated from that row outside the box (Pointing).`,
              },
            };
          }
        }

        // Check if all cells share the same column
        const cols = new Set(cells.map((c) => COL_OF[c]!));
        if (cols.size === 1) {
          const colIdx = cols.values().next().value as number;
          const colCells = COLS[colIdx]!;
          const elims = colCells.filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && BOX_OF[c] !== b,
          );
          if (elims.length > 0) {
            const cellsStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims.map((c) => ({ cell: c, digit: d })),
              highlights: {
                cells: [...cells, ...elims],
                candidates: [
                  ...cells.map((c) => ({ cell: c, digit: d })),
                  ...elims.map((c) => ({ cell: c, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `宫 B${b + 1} 中，数字 ${d} 的候选数（${cellsStr}）都在第 ${colIdx + 1} 列，可以消除该列其他格中的 ${d}（指向排除）。`,
                en: `In box B${b + 1}, all candidates for ${d} (${cellsStr}) lie in column C${colIdx + 1}, so ${d} can be eliminated from that column outside the box (Pointing).`,
              },
            };
          }
        }
      }
    }

    // --- Claiming: row / col → box ---
    // Row claiming
    for (let r = 0; r < 9; r++) {
      const row = ROWS[r]!;
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const cells = row.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((c) => BOX_OF[c]!));
        if (boxes.size === 1) {
          const boxIdx = boxes.values().next().value as number;
          const boxCells = BOXES[boxIdx]!;
          const elims = boxCells.filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && ROW_OF[c] !== r,
          );
          if (elims.length > 0) {
            const cellsStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims.map((c) => ({ cell: c, digit: d })),
              highlights: {
                cells: [...cells, ...elims],
                candidates: [
                  ...cells.map((c) => ({ cell: c, digit: d })),
                  ...elims.map((c) => ({ cell: c, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `第 ${r + 1} 行中，数字 ${d} 的候选数（${cellsStr}）都在宫 B${boxIdx + 1}，可以消除该宫其他格中的 ${d}（声明排除）。`,
                en: `In row R${r + 1}, all candidates for ${d} (${cellsStr}) are in box B${boxIdx + 1}, so ${d} can be eliminated from the rest of that box (Claiming).`,
              },
            };
          }
        }
      }
    }

    // Column claiming
    for (let c = 0; c < 9; c++) {
      const col = COLS[c]!;
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const cells = col.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
        if (boxes.size === 1) {
          const boxIdx = boxes.values().next().value as number;
          const boxCells = BOXES[boxIdx]!;
          const elims = boxCells.filter(
            (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && COL_OF[cell] !== c,
          );
          if (elims.length > 0) {
            const cellsStr = cells.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join(', ');
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims.map((cell) => ({ cell, digit: d })),
              highlights: {
                cells: [...cells, ...elims],
                candidates: [
                  ...cells.map((cell) => ({ cell, digit: d })),
                  ...elims.map((cell) => ({ cell, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `第 ${c + 1} 列中，数字 ${d} 的候选数（${cellsStr}）都在宫 B${boxIdx + 1}，可以消除该宫其他格中的 ${d}（声明排除）。`,
                en: `In column C${c + 1}, all candidates for ${d} (${cellsStr}) are in box B${boxIdx + 1}, so ${d} can be eliminated from the rest of that box (Claiming).`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};


