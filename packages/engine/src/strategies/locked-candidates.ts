/**
 * T2: locked candidates (pointing / claiming).
 *
 * Pointing: a digit confined to one row/col inside a box → eliminate from rest of row/col.
 * Claiming: a digit confined to one box inside a row/col → eliminate from rest of box.
 */

import { SIZE, BOX_OF, ROW_OF, COL_OF, BOXES, ROWS, COLS, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findPointing(grid: Grid): Step | null {
  // For each box, for each digit, find which rows/cols it appears in
  for (let b = 0; b < SIZE; b++) {
    const box = BOXES[b]!;
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const rows = new Set<number>();
      const cols = new Set<number>();
      const cellsInBox: number[] = [];
      for (const c of box) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          rows.add(ROW_OF[c]!);
          cols.add(COL_OF[c]!);
          cellsInBox.push(c);
        }
      }
      if (cellsInBox.length === 0) continue;

      // Pointing: confined to one row inside this box
      if (rows.size === 1) {
        const r = [...rows][0]!;
        const rowCells = ROWS[r]!;
        const elims: { cell: number; digit: number }[] = [];
        for (const c of rowCells) {
          if (BOX_OF[c] !== b && grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'locked-candidates',
            placements: [],
            eliminations: elims,
            highlights: { cells: cellsInBox, candidates: cellsInBox.map((c) => ({ cell: c, digit: d })), links: [] },
            explanation: {
              zh: `数字 ${d} 在宫 ${b + 1} 内仅出现在第 ${r + 1} 行，消除该行其他宫的候选 ${d}（指向）。`,
              en: `Digit ${d} in box ${b + 1} is locked to row ${r + 1}; eliminate ${d} from the rest of the row (pointing).`,
            },
          };
        }
      }

      // Pointing: confined to one col inside this box
      if (cols.size === 1) {
        const cIdx = [...cols][0]!;
        const colCells = COLS[cIdx]!;
        const elims: { cell: number; digit: number }[] = [];
        for (const c of colCells) {
          if (BOX_OF[c] !== b && grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'locked-candidates',
            placements: [],
            eliminations: elims,
            highlights: { cells: cellsInBox, candidates: cellsInBox.map((c) => ({ cell: c, digit: d })), links: [] },
            explanation: {
              zh: `数字 ${d} 在宫 ${b + 1} 内仅出现在第 ${cIdx + 1} 列，消除该列其他宫的候选 ${d}（指向）。`,
              en: `Digit ${d} in box ${b + 1} is locked to column ${cIdx + 1}; eliminate ${d} from the rest of the column (pointing).`,
            },
          };
        }
      }
    }
  }
  return null;
}

function findClaiming(grid: Grid): Step | null {
  // For each row, for each digit, find which boxes it appears in
  for (let r = 0; r < SIZE; r++) {
    const row = ROWS[r]!;
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const boxes = new Set<number>();
      const cellsInRow: number[] = [];
      for (const c of row) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          boxes.add(BOX_OF[c]!);
          cellsInRow.push(c);
        }
      }
      if (boxes.size === 1) {
        const b = [...boxes][0]!;
        const boxCells = BOXES[b]!;
        const elims: { cell: number; digit: number }[] = [];
        for (const c of boxCells) {
          if (ROW_OF[c] !== r && grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'locked-candidates',
            placements: [],
            eliminations: elims,
            highlights: { cells: cellsInRow, candidates: cellsInRow.map((c) => ({ cell: c, digit: d })), links: [] },
            explanation: {
              zh: `数字 ${d} 在第 ${r + 1} 行内仅出现在宫 ${b + 1}，消除该宫其他行的候选 ${d}（认领）。`,
              en: `Digit ${d} in row ${r + 1} is locked to box ${b + 1}; eliminate ${d} from the rest of the box (claiming).`,
            },
          };
        }
      }
    }
  }

  // Same for columns
  for (let cIdx = 0; cIdx < SIZE; cIdx++) {
    const col = COLS[cIdx]!;
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const boxes = new Set<number>();
      const cellsInCol: number[] = [];
      for (const c of col) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          boxes.add(BOX_OF[c]!);
          cellsInCol.push(c);
        }
      }
      if (boxes.size === 1) {
        const b = [...boxes][0]!;
        const boxCells = BOXES[b]!;
        const elims: { cell: number; digit: number }[] = [];
        for (const c of boxCells) {
          if (COL_OF[c] !== cIdx && grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'locked-candidates',
            placements: [],
            eliminations: elims,
            highlights: { cells: cellsInCol, candidates: cellsInCol.map((c) => ({ cell: c, digit: d })), links: [] },
            explanation: {
              zh: `数字 ${d} 在第 ${cIdx + 1} 列内仅出现在宫 ${b + 1}，消除该宫其他列的候选 ${d}（认领）。`,
              en: `Digit ${d} in column ${cIdx + 1} is locked to box ${b + 1}; eliminate ${d} from the rest of the box (claiming).`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块锁', en: 'Locked Candidates' },
  difficulty: 20,

  apply(_grid: Grid): Step | null {
    // Disabled for M2 soundness guarantee
    return null;
  },
};
