/**
 * Single-Digit Patterns (T3) — 单数字模式：Skyscraper / 2-String Kite / Empty Rectangle.
 *
 * All three are short single-digit chains (Turbot family) that eliminate the
 * digit from cells seeing both "free ends" of the pattern.
 *
 *  - Skyscraper 摩天楼: two parallel lines (two rows OR two columns) each with a
 *    conjugate pair on the digit; the pairs share one perpendicular line (the
 *    "base"). The two off-base ends eliminate the digit from common peers.
 *  - 2-String Kite 双线风筝: a row conjugate pair and a column conjugate pair on
 *    the digit, whose "near" ends lie in the same box. The two "far" ends
 *    eliminate the digit from common peers.
 *  - Empty Rectangle 空矩形: in a box the digit's candidates fit in one row and
 *    one column (an ER). Combined with a conjugate pair on a crossing line, the
 *    digit is eliminated where they meet.
 */

import {
  SIZE,
  ROWS,
  COLS,
  BOXES,
  ROW_OF,
  COL_OF,
  BOX_OF,
  cellsWithCandidate,
  sees,
  cellLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function elimsSeeingBoth(grid: Grid, e1: number, e2: number, digit: number): CellDigit[] {
  const out: CellDigit[] = [];
  for (let c = 0; c < 81; c++) {
    if (c === e1 || c === e2) continue;
    if (grid.get(c) !== 0 || !grid.hasCandidate(c, digit)) continue;
    if (sees(c, e1) && sees(c, e2)) out.push({ cell: c, digit });
  }
  return out;
}

/** Skyscraper: two conjugate pairs in parallel lines sharing one cross line. */
function findSkyscraper(grid: Grid, id: string, digit: number): Step | null {
  for (const [lines, parallelKind] of [
    [ROWS, 'row'],
    [COLS, 'col'],
  ] as const) {
    // Collect conjugate pairs (exactly 2 candidates) per line.
    const pairs: { line: number; cells: [number, number] }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cells = cellsWithCandidate(grid, lines[i]!, digit);
      if (cells.length === 2) pairs.push({ line: i, cells: [cells[0]!, cells[1]!] });
    }
    const crossOf = parallelKind === 'row' ? COL_OF : ROW_OF;
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = pairs[i]!;
        const b = pairs[j]!;
        // Find a shared cross line (the "base" where the towers touch).
        const aCross = a.cells.map((c) => crossOf[c]!);
        const bCross = b.cells.map((c) => crossOf[c]!);
        for (let ai = 0; ai < 2; ai++) {
          for (let bi = 0; bi < 2; bi++) {
            if (aCross[ai] !== bCross[bi]) continue;
            // base ends share the cross line; the other ends are free.
            const baseA = a.cells[ai]!;
            const baseB = b.cells[bi]!;
            const freeA = a.cells[1 - ai]!;
            const freeB = b.cells[1 - bi]!;
            if (freeA === freeB) continue;
            // The free ends must NOT share the same cross line (else it's an X-Wing).
            if (crossOf[freeA] === crossOf[freeB]) continue;
            const elims = elimsSeeingBoth(grid, freeA, freeB, digit);
            if (elims.length === 0) continue;
            return {
              strategyId: id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [baseA, baseB, freeA, freeB],
                candidates: [baseA, baseB, freeA, freeB].map((c) => ({ cell: c, digit })),
                links: [],
              },
              explanation: {
                zh: `摩天楼：数字 ${digit} 在两条平行${parallelKind === 'row' ? '行' : '列'}各有强链，且共享同一${parallelKind === 'row' ? '列' : '行'}底；自由端 ${cellLabel(freeA)}、${cellLabel(freeB)} 必有其一为 ${digit}，可见两端的格可排除 ${digit}。`,
                en: `Skyscraper: digit ${digit} forms conjugate pairs in two parallel ${parallelKind === 'row' ? 'rows' : 'columns'} sharing one base line; one of the free ends ${cellLabel(freeA)}, ${cellLabel(freeB)} must be ${digit}, so cells seeing both can drop ${digit}.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/** 2-String Kite: a row conjugate pair + a column conjugate pair meeting in a box. */
function findKite(grid: Grid, id: string, digit: number): Step | null {
  const rowPairs: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    const cells = cellsWithCandidate(grid, ROWS[r]!, digit);
    if (cells.length === 2) rowPairs.push([cells[0]!, cells[1]!]);
  }
  const colPairs: [number, number][] = [];
  for (let c = 0; c < 9; c++) {
    const cells = cellsWithCandidate(grid, COLS[c]!, digit);
    if (cells.length === 2) colPairs.push([cells[0]!, cells[1]!]);
  }

  for (const rp of rowPairs) {
    for (const cp of colPairs) {
      // Pick one end of each pair that shares a box (the "near" ends),
      // the other two are the "far" ends that must see each other-elim.
      for (let ri = 0; ri < 2; ri++) {
        for (let ci = 0; ci < 2; ci++) {
          const rNear = rp[ri]!;
          const cNear = cp[ci]!;
          const rFar = rp[1 - ri]!;
          const cFar = cp[1 - ci]!;
          if (rNear === cNear || rFar === cFar) continue;
          // near ends in same box, and they are distinct cells
          if (BOX_OF[rNear] !== BOX_OF[cNear]) continue;
          if (rNear === cNear) continue;
          // far ends must be in the row pair's row and col pair's col respectively
          // rFar is on the row, cFar is on the column; their intersection cell is the target.
          // Eliminate digit from the cell at (row of cFar, col of rFar)? Standard kite:
          // far ends see each other via a common cell at intersection of rFar's row & cFar's col.
          const targetCell = ROW_OF[rFar]! * 9 + COL_OF[cFar]!;
          if (targetCell === rFar || targetCell === cFar) continue;
          if (grid.get(targetCell) !== 0 || !grid.hasCandidate(targetCell, digit)) continue;
          // Ensure the geometry is a genuine kite: rFar shares row with target, cFar shares col with target.
          if (ROW_OF[targetCell] !== ROW_OF[rFar]) continue;
          if (COL_OF[targetCell] !== COL_OF[cFar]) continue;
          // near ends connect rFar..rNear (row) and cFar..cNear (col), near in same box.
          return {
            strategyId: id,
            placements: [],
            eliminations: [{ cell: targetCell, digit }],
            highlights: {
              cells: [rNear, rFar, cNear, cFar],
              candidates: [rNear, rFar, cNear, cFar].map((c) => ({ cell: c, digit })),
              links: [],
            },
            explanation: {
              zh: `双线风筝：数字 ${digit} 的行强链（${cellLabel(rFar)}-${cellLabel(rNear)}）与列强链（${cellLabel(cFar)}-${cellLabel(cNear)}）的近端同宫；两远端必有其一为 ${digit}，故其交叉格 ${cellLabel(targetCell)} 可排除 ${digit}。`,
              en: `2-String Kite: a row strong link (${cellLabel(rFar)}-${cellLabel(rNear)}) and a column strong link (${cellLabel(cFar)}-${cellLabel(cNear)}) with near ends in one box; one far end must be ${digit}, so ${cellLabel(targetCell)} can drop ${digit}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/** Empty Rectangle: box ER line crossing a conjugate pair on a line. */
function findEmptyRectangle(grid: Grid, id: string, digit: number): Step | null {
  for (let b = 0; b < 9; b++) {
    const boxCells = cellsWithCandidate(grid, BOXES[b]!, digit);
    if (boxCells.length < 2) continue;
    // ER exists if the candidates fit into one row AND one column inside the box
    // (i.e. they all lie on a single row OR single column "cross" within the box).
    const rowsIn = new Set(boxCells.map((c) => ROW_OF[c]!));
    const colsIn = new Set(boxCells.map((c) => COL_OF[c]!));
    // For each candidate ER "hinge" row r and col c such that every box cell is
    // in row r or col c.
    for (const erRow of rowsIn) {
      for (const erCol of colsIn) {
        const allCovered = boxCells.every((c) => ROW_OF[c] === erRow || COL_OF[c] === erCol);
        if (!allCovered) continue;
        // Must genuinely be a rectangle pattern: there must be box cells off the
        // hinge row on the hinge col and vice versa (otherwise it's a line block).
        const hasOnRow = boxCells.some((c) => ROW_OF[c] === erRow && COL_OF[c] !== erCol);
        const hasOnCol = boxCells.some((c) => COL_OF[c] === erCol && ROW_OF[c] !== erRow);
        if (!hasOnRow || !hasOnCol) continue;

        // Use a conjugate pair on the ER row (look in columns) and the ER col,
        // OR vice versa. Standard ER: take the hinge row -> follow to a conjugate
        // pair in some column, eliminating at the intersection with the hinge col.
        // Direction 1: conjugate pair in a COLUMN that crosses the ER row.
        for (let col = 0; col < 9; col++) {
          if (col === erCol) continue;
          const colCells = cellsWithCandidate(grid, COLS[col]!, digit);
          if (colCells.length !== 2) continue;
          // One end must be on the ER row; the other end's row crosses the ER col.
          const onErRow = colCells.find((c) => ROW_OF[c] === erRow);
          const other = colCells.find((c) => ROW_OF[c] !== erRow);
          if (onErRow === undefined || other === undefined) continue;
          if (BOX_OF[onErRow] === b) continue; // the pair end must be outside the ER box
          const target = ROW_OF[other]! * 9 + erCol;
          if (BOX_OF[target] === b) continue;
          if (grid.get(target) !== 0 || !grid.hasCandidate(target, digit)) continue;
          return {
            strategyId: id,
            placements: [],
            eliminations: [{ cell: target, digit }],
            highlights: {
              cells: [...boxCells, onErRow, other],
              candidates: [...boxCells, onErRow, other].map((c) => ({ cell: c, digit })),
              links: [],
            },
            explanation: {
              zh: `空矩形：第 ${b + 1} 宫中数字 ${digit} 构成空矩形（铰链行 R${erRow + 1}、铰链列 C${erCol + 1}）；结合列强链 ${cellLabel(onErRow)}-${cellLabel(other)}，可在 ${cellLabel(target)} 排除 ${digit}。`,
              en: `Empty Rectangle: in box ${b + 1}, digit ${digit} forms an ER (hinge row R${erRow + 1}, col C${erCol + 1}); with the column strong link ${cellLabel(onErRow)}-${cellLabel(other)}, ${digit} can be removed from ${cellLabel(target)}.`,
            },
          };
        }
        // Direction 2: conjugate pair in a ROW that crosses the ER col.
        for (let row = 0; row < 9; row++) {
          if (row === erRow) continue;
          const rowCells = cellsWithCandidate(grid, ROWS[row]!, digit);
          if (rowCells.length !== 2) continue;
          const onErCol = rowCells.find((c) => COL_OF[c] === erCol);
          const other = rowCells.find((c) => COL_OF[c] !== erCol);
          if (onErCol === undefined || other === undefined) continue;
          if (BOX_OF[onErCol] === b) continue;
          const target = erRow * 9 + COL_OF[other]!;
          if (BOX_OF[target] === b) continue;
          if (grid.get(target) !== 0 || !grid.hasCandidate(target, digit)) continue;
          return {
            strategyId: id,
            placements: [],
            eliminations: [{ cell: target, digit }],
            highlights: {
              cells: [...boxCells, onErCol, other],
              candidates: [...boxCells, onErCol, other].map((c) => ({ cell: c, digit })),
              links: [],
            },
            explanation: {
              zh: `空矩形：第 ${b + 1} 宫中数字 ${digit} 构成空矩形（铰链行 R${erRow + 1}、铰链列 C${erCol + 1}）；结合行强链 ${cellLabel(onErCol)}-${cellLabel(other)}，可在 ${cellLabel(target)} 排除 ${digit}。`,
              en: `Empty Rectangle: in box ${b + 1}, digit ${digit} forms an ER (hinge row R${erRow + 1}, col C${erCol + 1}); with the row strong link ${cellLabel(onErCol)}-${cellLabel(other)}, ${digit} can be removed from ${cellLabel(target)}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      const sky = findSkyscraper(grid, this.id, digit);
      if (sky) return sky;
      const kite = findKite(grid, this.id, digit);
      if (kite) return kite;
      const er = findEmptyRectangle(grid, this.id, digit);
      if (er) return er;
    }
    return null;
  },
};
