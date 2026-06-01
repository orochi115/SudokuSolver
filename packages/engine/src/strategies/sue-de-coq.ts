/**
 * Sue de Coq (T4) — a pattern where a box and a line intersect.
 *
 * In the intersection (2-3 cells), the candidates are partitioned into
 * two groups: one group locked to the line, one locked to the box.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: 'Sue de Coq', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid: Grid): Step | null {
    // For each box, try each row and column that intersect it
    for (let b = 0; b < 9; b++) {
      const boxCells = [...BOXES[b]!].filter((c) => grid.get(c) === 0);
      const rowsInBox = [...new Set(boxCells.map((c) => ROW_OF[c]!))];
      const colsInBox = [...new Set(boxCells.map((c) => COL_OF[c]!))];

      for (const r of rowsInBox) {
        const intersect = boxCells.filter((c) => ROW_OF[c]! === r);
        if (intersect.length < 2 || intersect.length > 3) continue;
        const step = trySueDeCoq(grid, b, 'row', r, intersect);
        if (step) return step;
      }

      for (const c of colsInBox) {
        const intersect = boxCells.filter((cell) => COL_OF[cell]! === c);
        if (intersect.length < 2 || intersect.length > 3) continue;
        const step = trySueDeCoq(grid, b, 'col', c, intersect);
        if (step) return step;
      }
    }
    return null;
  },
};

function trySueDeCoq(
  grid: Grid,
  box: number,
  lineType: 'row' | 'col',
  lineIndex: number,
  intersect: number[],
): Step | null {
  const lineCells = lineType === 'row' ? ROWS[lineIndex]! : COLS[lineIndex]!;
  const boxCells = [...BOXES[box]!].filter((c) => grid.get(c) === 0);

  // Candidates in intersection
  let interMask = 0;
  for (const c of intersect) interMask |= grid.candidatesOf(c);
  const interDigits = digitsOf(interMask);
  if (interDigits.length < 2) return null;

  // Try partitioning interDigits into two non-empty groups
  for (let mask = 1; mask < (1 << interDigits.length) - 1; mask++) {
    const lineDigits: number[] = [];
    const boxDigits: number[] = [];
    for (let i = 0; i < interDigits.length; i++) {
      if (mask & (1 << i)) lineDigits.push(interDigits[i]!);
      else boxDigits.push(interDigits[i]!);
    }
    if (lineDigits.length === 0 || boxDigits.length === 0) continue;

    // lineDigits must only appear in intersection within the line
    let lineOnly = true;
    for (const d of lineDigits) {
      for (const c of lineCells) {
        if (intersect.includes(c)) continue;
        if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
          lineOnly = false;
          break;
        }
      }
      if (!lineOnly) break;
    }
    if (!lineOnly) continue;

    // boxDigits must only appear in intersection within the box
    let boxOnly = true;
    for (const d of boxDigits) {
      for (const c of boxCells) {
        if (intersect.includes(c)) continue;
        if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
          boxOnly = false;
          break;
        }
      }
      if (!boxOnly) break;
    }
    if (!boxOnly) continue;

    // Eliminate lineDigits from rest of box, and boxDigits from rest of line
    const eliminations: CellDigit[] = [];
    for (const d of lineDigits) {
      for (const c of boxCells) {
        if (intersect.includes(c)) continue;
        if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
          eliminations.push({ cell: c, digit: d });
        }
      }
    }
    for (const d of boxDigits) {
      for (const c of lineCells) {
        if (intersect.includes(c)) continue;
        if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
          eliminations.push({ cell: c, digit: d });
        }
      }
    }
    if (eliminations.length > 0) {
      return makeStep(intersect, eliminations, lineType, lineIndex);
    }
  }
  return null;
}

function makeStep(cells: number[], eliminations: CellDigit[], lineType: 'row' | 'col', lineIndex: number): Step {
  return {
    strategyId: 'sue-de-coq',
    placements: [],
    eliminations,
    highlights: { cells, candidates: eliminations, links: [] },
    explanation: {
      zh: `Sue de Coq (${lineType === 'row' ? '行' : '列'} ${lineIndex + 1}) 消除 ${eliminations.length} 处候选。`,
      en: `Sue de Coq (${lineType} ${lineIndex + 1}) eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
