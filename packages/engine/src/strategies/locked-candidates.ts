/**
 * Locked Candidates (T2) — intersection-based eliminations.
 *
 * Two variants:
 *  - Pointing: all candidates for a digit in a box lie in one row/column →
 *    remove that digit from the rest of that row/column outside the box.
 *  - Claiming: all candidates for a digit in a row/column lie in one box →
 *    remove that digit from the rest of that box.
 */

import { ROWS, COLS, BOXES, BOX_OF, ROW_OF, COL_OF, SIZE, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Pointing: box candidates confined to one line → eliminate from line outside box. */
function tryPointing(grid: Grid): Step | null {
  for (let b = 0; b < 9; b++) {
    const box = BOXES[b]!;

    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      // Collect cells in this box where d is a candidate
      const cells: number[] = [];
      for (const cell of box) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          cells.push(cell);
        }
      }
      if (cells.length < 2) continue;

      // Check if all confined to the same row
      const rows = new Set(cells.map((c) => ROW_OF[c]!));
      if (rows.size === 1) {
        const row = [...rows][0]!;
        const eliminations = ROWS[row]!.filter(
          (c) => BOX_OF[c] !== b && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        ).map((c) => ({ cell: c, digit: d }));

        if (eliminations.length > 0) {
          const cellStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
          const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}`).join('、');
          return {
            strategyId: 'locked-candidates-pointing',
            placements: [],
            eliminations,
            highlights: {
              cells: cells,
              candidates: cells.map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在宫${b + 1}中只出现在行${row + 1}（${cellStr}），因此可从该行宫外删除候选数 ${d}（指向型区块排除）。消除格：${elimStr}。`,
              en: `Digit ${d} in Box ${b + 1} is confined to Row ${row + 1} (${cellStr}), so ${d} can be removed from the rest of Row ${row + 1} outside the box (Pointing). Eliminations: ${elimStr}.`,
            },
          };
        }
      }

      // Check if all confined to the same column
      const cols = new Set(cells.map((c) => COL_OF[c]!));
      if (cols.size === 1) {
        const col = [...cols][0]!;
        const eliminations = COLS[col]!.filter(
          (c) => BOX_OF[c] !== b && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        ).map((c) => ({ cell: c, digit: d }));

        if (eliminations.length > 0) {
          const cellStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
          const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}`).join('、');
          return {
            strategyId: 'locked-candidates-pointing',
            placements: [],
            eliminations,
            highlights: {
              cells: cells,
              candidates: cells.map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在宫${b + 1}中只出现在列${col + 1}（${cellStr}），因此可从该列宫外删除候选数 ${d}（指向型区块排除）。消除格：${elimStr}。`,
              en: `Digit ${d} in Box ${b + 1} is confined to Column ${col + 1} (${cellStr}), so ${d} can be removed from the rest of Column ${col + 1} outside the box (Pointing). Eliminations: ${elimStr}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/** Claiming: line candidates confined to one box → eliminate from rest of box. */
function tryClaiming(grid: Grid): Step | null {
  // Check rows
  for (let r = 0; r < 9; r++) {
    const row = ROWS[r]!;
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      const cells: number[] = [];
      for (const cell of row) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          cells.push(cell);
        }
      }
      if (cells.length < 2) continue;

      const boxes = new Set(cells.map((c) => BOX_OF[c]!));
      if (boxes.size === 1) {
        const b = [...boxes][0]!;
        const eliminations = BOXES[b]!.filter(
          (c) => ROW_OF[c] !== r && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        ).map((c) => ({ cell: c, digit: d }));

        if (eliminations.length > 0) {
          const cellStr = cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
          const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}`).join('、');
          return {
            strategyId: 'locked-candidates-claiming',
            placements: [],
            eliminations,
            highlights: {
              cells: cells,
              candidates: cells.map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在行${r + 1}中只出现在宫${b + 1}（${cellStr}），因此可从该宫行外删除候选数 ${d}（声明型区块排除）。消除格：${elimStr}。`,
              en: `Digit ${d} in Row ${r + 1} is confined to Box ${b + 1} (${cellStr}), so ${d} can be removed from the rest of Box ${b + 1} outside the row (Claiming). Eliminations: ${elimStr}.`,
            },
          };
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const col = COLS[c]!;
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      const cells: number[] = [];
      for (const cell of col) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          cells.push(cell);
        }
      }
      if (cells.length < 2) continue;

      const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
      if (boxes.size === 1) {
        const b = [...boxes][0]!;
        const eliminations = BOXES[b]!.filter(
          (cell) => COL_OF[cell] !== c && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        ).map((cell) => ({ cell, digit: d }));

        if (eliminations.length > 0) {
          const cellStr = cells.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join('、');
          const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}`).join('、');
          return {
            strategyId: 'locked-candidates-claiming',
            placements: [],
            eliminations,
            highlights: {
              cells: cells,
              candidates: cells.map((cell) => ({ cell, digit: d })),
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在列${c + 1}中只出现在宫${b + 1}（${cellStr}），因此可从该宫列外删除候选数 ${d}（声明型区块排除）。消除格：${elimStr}。`,
              en: `Digit ${d} in Column ${c + 1} is confined to Box ${b + 1} (${cellStr}), so ${d} can be removed from the rest of Box ${b + 1} outside the column (Claiming). Eliminations: ${elimStr}.`,
            },
          };
        }
      }
    }
  }

  return null;
}

export const lockedCandidatesPointing: Strategy = {
  id: 'locked-candidates-pointing',
  name: { zh: '指向型区块排除', en: 'Locked Candidates (Pointing)' },
  difficulty: 20,
  apply: tryPointing,
};

export const lockedCandidatesClaiming: Strategy = {
  id: 'locked-candidates-claiming',
  name: { zh: '声明型区块排除', en: 'Locked Candidates (Claiming)' },
  difficulty: 20,
  apply: tryClaiming,
};
