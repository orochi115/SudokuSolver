import { SIZE, CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, ROWS, COLS, BOXES, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function r1(cell: number): number { return ROW_OF[cell]! + 1; }
function c1(cell: number): number { return COL_OF[cell]! + 1; }

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      // Pointing: box -> row/col
      for (let bi = 0; bi < SIZE; bi++) {
        const box = BOXES[bi]!;
        const inBox: number[] = [];
        for (const c of box) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) inBox.push(c);
        }
        if (inBox.length < 2) continue;

        const rows = new Set(inBox.map((c) => ROW_OF[c]!));
        const cols = new Set(inBox.map((c) => COL_OF[c]!));

        if (rows.size === 1) {
          const rowIdx = [...rows][0]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells = [...inBox];
          for (const c of ROWS[rowIdx]!) {
            if (BOX_OF[c] !== bi && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: highlightCells, candidates: highlightCells.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `宫 ${bi + 1} 中数字 ${d} 只出现在第 ${rowIdx + 1} 行，因此从该行其他单元格排除 ${d}（指向排除）。`,
                en: `Digit ${d} in box ${bi + 1} is confined to row ${rowIdx + 1}, eliminate it from rest of the row (Pointing).`,
              },
            };
          }
        }

        if (cols.size === 1) {
          const colIdx = [...cols][0]!;
          const elims: { cell: number; digit: number }[] = [];
          const highlightCells = [...inBox];
          for (const c of COLS[colIdx]!) {
            if (BOX_OF[c] !== bi && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: highlightCells, candidates: highlightCells.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `宫 ${bi + 1} 中数字 ${d} 只出现在第 ${colIdx + 1} 列，因此从该列其他单元格排除 ${d}（指向排除）。`,
                en: `Digit ${d} in box ${bi + 1} is confined to column ${colIdx + 1}, eliminate it from rest of the column (Pointing).`,
              },
            };
          }
        }
      }

      // Claiming: row/col -> box
      for (let ri = 0; ri < SIZE; ri++) {
        const row = ROWS[ri]!;
        const inRow: number[] = [];
        for (const c of row) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) inRow.push(c);
        }
        if (inRow.length < 2) continue;
        const boxes = new Set(inRow.map((c) => BOX_OF[c]!));
        if (boxes.size === 1) {
          const bIdx = [...boxes][0]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of BOXES[bIdx]!) {
            if (ROW_OF[c] !== ri && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: inRow, candidates: inRow.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `第 ${ri + 1} 行中数字 ${d} 只出现在宫 ${bIdx + 1} 内，因此从该宫其他单元格排除 ${d}（占位排除）。`,
                en: `Digit ${d} in row ${ri + 1} is confined to box ${bIdx + 1}, eliminate it from rest of the box (Claiming).`,
              },
            };
          }
        }
      }

      for (let ci = 0; ci < SIZE; ci++) {
        const col = COLS[ci]!;
        const inCol: number[] = [];
        for (const c of col) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) inCol.push(c);
        }
        if (inCol.length < 2) continue;
        const boxes = new Set(inCol.map((c) => BOX_OF[c]!));
        if (boxes.size === 1) {
          const bIdx = [...boxes][0]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of BOXES[bIdx]!) {
            if (COL_OF[c] !== ci && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: inCol, candidates: inCol.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `第 ${ci + 1} 列中数字 ${d} 只出现在宫 ${bIdx + 1} 内，因此从该宫其他单元格排除 ${d}（占位排除）。`,
                en: `Digit ${d} in column ${ci + 1} is confined to box ${bIdx + 1}, eliminate it from rest of the box (Claiming).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};