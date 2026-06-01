/**
 * Locked Candidates (T2) — Pointing and Claiming.
 *
 * Pointing: all candidates for a digit in a box are in one row/column,
 *   eliminate that digit from the rest of the row/column.
 * Claiming: all candidates for a digit in a row/column are in one box,
 *   eliminate that digit from the rest of the box.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // For each digit, check pointing and claiming
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      // Pointing: for each box, check if all candidates are in one row or column
      for (const box of BOXES) {
        const cells: number[] = [];
        for (const cell of box) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) cells.push(cell);
        }
        if (cells.length < 2) continue;
        const rows = new Set(cells.map((c) => ROW_OF[c]!));
        const cols = new Set(cells.map((c) => COL_OF[c]!));
        if (rows.size === 1) {
          const row = rows.values().next().value!;
          const eliminations: CellDigit[] = [];
          for (const cell of ROWS[row]!) {
            if (BOX_OF[cell]! === BOX_OF[cells[0]!]!) continue;
            if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return makeStep(grid, cells, eliminations, 'pointing', d);
          }
        }
        if (cols.size === 1) {
          const col = cols.values().next().value!;
          const eliminations: CellDigit[] = [];
          for (const cell of COLS[col]!) {
            if (BOX_OF[cell]! === BOX_OF[cells[0]!]!) continue;
            if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return makeStep(grid, cells, eliminations, 'pointing', d);
          }
        }
      }

      // Claiming: for each row, check if all candidates are in one box
      for (let r = 0; r < 9; r++) {
        const cells: number[] = [];
        for (const cell of ROWS[r]!) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) cells.push(cell);
        }
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((c) => BOX_OF[c]!));
        if (boxes.size === 1) {
          const box = boxes.values().next().value!;
          const eliminations: CellDigit[] = [];
          for (const cell of BOXES[box]!) {
            if (ROW_OF[cell]! === r) continue;
            if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return makeStep(grid, cells, eliminations, 'claiming', d);
          }
        }
      }

      // Claiming: for each column
      for (let c = 0; c < 9; c++) {
        const cells: number[] = [];
        for (const cell of COLS[c]!) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) cells.push(cell);
        }
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
        if (boxes.size === 1) {
          const box = boxes.values().next().value!;
          const eliminations: CellDigit[] = [];
          for (const cell of BOXES[box]!) {
            if (COL_OF[cell]! === c) continue;
            if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return makeStep(grid, cells, eliminations, 'claiming', d);
          }
        }
      }
    }
    return null;
  },
};

function makeStep(
  grid: Grid,
  cells: number[],
  eliminations: { cell: number; digit: number }[],
  kind: 'pointing' | 'claiming',
  digit: number,
): Step {
  const candidates = cells.map((cell) => ({ cell, digit }));
  const r = cells.map((c) => ROW_OF[c]! + 1);
  const c = cells.map((c) => COL_OF[c]! + 1);
  const cellsDesc = cells.map((cell, i) => `R${r[i]}C${c[i]}`).join(', ');
  const typeZh = kind === 'pointing' ? '指向' : '占位排除';
  const typeEn = kind === 'pointing' ? 'Pointing' : 'Claiming';
  return {
    strategyId: 'locked-candidates',
    placements: [],
    eliminations,
    highlights: { cells, candidates, links: [] },
    explanation: {
      zh: `${cellsDesc} 中的 ${digit} 构成${typeZh}，可排除 ${eliminations.length} 处候选 ${digit}。`,
      en: `${cellsDesc} form a ${typeEn} on ${digit}, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
