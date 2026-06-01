/**
 * Single-Digit Patterns (T3) — Skyscraper / 2-String Kite / Empty Rectangle.
 *
 * All three are short single-digit chains formed by two strong links.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const rowLinks = findRowLinks(grid, d);
      const colLinks = findColLinks(grid, d);

      // Skyscraper: two row-links sharing a column, or two col-links sharing a row
      for (let i = 0; i < rowLinks.length; i++) {
        for (let j = i + 1; j < rowLinks.length; j++) {
          const a = rowLinks[i]!;
          const b = rowLinks[j]!;
          const sharedCols = a.cols.filter((c) => b.cols.includes(c));
          if (sharedCols.length === 1) {
            const shared = sharedCols[0]!;
            const ea = a.cols.find((c) => c !== shared)!;
            const eb = b.cols.find((c) => c !== shared)!;
            const ca = a.row;
            const cb = b.row;
            const cellA = ca * 9 + ea;
            const cellB = cb * 9 + eb;
            const eliminations = findCommonSees(grid, d, cellA, cellB);
            if (eliminations.length > 0) {
              return makeStep(eliminations, d, 'Skyscraper', [cellA, cellB], [cellA, cellB]);
            }
          }
        }
      }

      for (let i = 0; i < colLinks.length; i++) {
        for (let j = i + 1; j < colLinks.length; j++) {
          const a = colLinks[i]!;
          const b = colLinks[j]!;
          const sharedRows = a.rows.filter((r) => b.rows.includes(r));
          if (sharedRows.length === 1) {
            const shared = sharedRows[0]!;
            const ea = a.rows.find((r) => r !== shared)!;
            const eb = b.rows.find((r) => r !== shared)!;
            const ca = a.col;
            const cb = b.col;
            const cellA = ea * 9 + ca;
            const cellB = eb * 9 + cb;
            const eliminations = findCommonSees(grid, d, cellA, cellB);
            if (eliminations.length > 0) {
              return makeStep(eliminations, d, 'Skyscraper', [cellA, cellB], [cellA, cellB]);
            }
          }
        }
      }

      // 2-String Kite: one row-link and one col-link sharing a box
      for (const rl of rowLinks) {
        for (const cl of colLinks) {
          // One endpoint of each must be in the same box (but not the same cell)
          for (const c1 of rl.cols) {
            for (const r2 of cl.rows) {
              const cellRowCol = rl.row * 9 + c1;
              const cellColRow = r2 * 9 + cl.col;
              if (cellRowCol === cellColRow) continue;
              if (BOX_OF[cellRowCol]! !== BOX_OF[cellColRow]!) continue;
              // The two shared-box cells must be peers (they are, since they're in the same box)
              const otherC = rl.cols.find((c) => c !== c1)!;
              const otherR = cl.rows.find((r) => r !== r2)!;
              const cell1 = rl.row * 9 + otherC;
              const cell2 = otherR * 9 + cl.col;
              if (cell1 === cell2) continue;
              // Verify endpoints actually have the digit
              if (!grid.hasCandidate(cell1, d) || !grid.hasCandidate(cell2, d)) continue;
              const eliminations = findCommonSees(grid, d, cell1, cell2);
              if (eliminations.length > 0) {
                return makeStep(eliminations, d, '2-String Kite', [cell1, cell2, cellRowCol, cellColRow], [cell1, cell2]);
              }
            }
          }
        }
      }

      // Empty Rectangle: a box where digit d's candidates form a rectangle
      for (let b = 0; b < 9; b++) {
        const cells: number[] = [];
        for (const cell of BOXES[b]!) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) cells.push(cell);
        }
        if (cells.length < 4) continue;
        const rows = [...new Set(cells.map((c) => ROW_OF[c]!))];
        const cols = [...new Set(cells.map((c) => COL_OF[c]!))];
        if (rows.length !== 2 || cols.length !== 2) continue;
        // The four corners of the rectangle
        const corners = [
          rows[0]! * 9 + cols[0]!,
          rows[0]! * 9 + cols[1]!,
          rows[1]! * 9 + cols[0]!,
          rows[1]! * 9 + cols[1]!,
        ];
        const filled = corners.filter((c) => cells.includes(c));
        const empty = corners.filter((c) => !cells.includes(c));
        if (filled.length < 3) continue; // Need at least 3 corners filled for standard ER
        // Find a strong link in a row or column outside the box that intersects at an empty corner
        for (const ec of empty) {
          const er = ROW_OF[ec]!;
          const ecn = COL_OF[ec]!;
          // Check row strong link for this digit in the same row but outside box
          const rowCells = ROWS[er]!.filter((c) => BOX_OF[c]! !== b && grid.get(c) === 0 && grid.hasCandidate(c, d));
          if (rowCells.length === 2) {
            // Find the other corner
            const otherCornerRow = rows.find((r) => r !== er)!;
            const otherCells = cells.filter((c) => ROW_OF[c]! === otherCornerRow);
            for (const oc of otherCells) {
              const eliminations = findCommonSees(grid, d, ec, oc);
              if (eliminations.length > 0) {
                return makeStep(eliminations, d, 'Empty Rectangle', [...filled, ec], [ec, oc]);
              }
            }
          }
          // Check col strong link
          const colCells = COLS[ecn]!.filter((c) => BOX_OF[c]! !== b && grid.get(c) === 0 && grid.hasCandidate(c, d));
          if (colCells.length === 2) {
            const otherCornerCol = cols.find((c) => c !== ecn)!;
            const otherCells2 = cells.filter((c) => COL_OF[c]! === otherCornerCol);
            for (const oc of otherCells2) {
              const eliminations = findCommonSees(grid, d, ec, oc);
              if (eliminations.length > 0) {
                return makeStep(eliminations, d, 'Empty Rectangle', [...filled, ec], [ec, oc]);
              }
            }
          }
        }
      }
    }
    return null;
  },
};

function getBoxIntersection(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

interface RowLink {
  row: number;
  cols: [number, number];
}

interface ColLink {
  col: number;
  rows: [number, number];
}

function findRowLinks(grid: Grid, digit: number): RowLink[] {
  const links: RowLink[] = [];
  for (let r = 0; r < 9; r++) {
    const cols: number[] = [];
    for (let c = 0; c < 9; c++) {
      const cell = r * 9 + c;
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) cols.push(c);
    }
    if (cols.length === 2) links.push({ row: r, cols: [cols[0]!, cols[1]!] });
  }
  return links;
}

function findColLinks(grid: Grid, digit: number): ColLink[] {
  const links: ColLink[] = [];
  for (let c = 0; c < 9; c++) {
    const rows: number[] = [];
    for (let r = 0; r < 9; r++) {
      const cell = r * 9 + c;
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) rows.push(r);
    }
    if (rows.length === 2) links.push({ col: c, rows: [rows[0]!, rows[1]!] });
  }
  return links;
}

function findCommonSees(grid: Grid, digit: number, a: number, b: number): CellDigit[] {
  const eliminations: CellDigit[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (cell === a || cell === b) continue;
    if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, digit)) continue;
    if (sees(cell, a) && sees(cell, b)) {
      eliminations.push({ cell, digit });
    }
  }
  return eliminations;
}

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a]! === ROW_OF[b]! || COL_OF[a]! === COL_OF[b]! || BOX_OF[a]! === BOX_OF[b]!;
}

function makeStep(
  eliminations: CellDigit[],
  digit: number,
  pattern: string,
  cells: number[],
  endpoints: number[],
): Step {
  const namesZh: Record<string, string> = {
    Skyscraper: '摩天楼',
    '2-String Kite': '双线风筝',
    'Empty Rectangle': '空矩形',
  };
  return {
    strategyId: 'single-digit-patterns',
    placements: [],
    eliminations,
    highlights: { cells, candidates: endpoints.map((cell) => ({ cell, digit })), links: [] },
    explanation: {
      zh: `数字 ${digit} 形成${namesZh[pattern]}，可排除 ${eliminations.length} 处候选。`,
      en: `Digit ${digit} forms a ${pattern}, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
