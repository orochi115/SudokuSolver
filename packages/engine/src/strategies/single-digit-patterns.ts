/**
 * Single-Digit Patterns (T3) — 单数字模式
 *
 * Three short named chains for a single digit d:
 *
 * Skyscraper:
 *   Two rows (or cols) each have exactly 2 candidates for d and share one column.
 *   The two outer endpoints see each other through their box/column connection.
 *   Eliminate d from cells seeing both outer endpoints.
 *
 * 2-String Kite:
 *   A row and a column each have exactly 2 candidates for d.
 *   One candidate in the row and one in the column share the same box.
 *   Eliminate d from cells seeing both free endpoints.
 *
 * Empty Rectangle (ER):
 *   A box has candidates for d in exactly one row-line AND one col-line within it.
 *   A conjugate pair (strong link) on a line outside the box interacts with the ER.
 *   Eliminate d from cells seeing both the chain endpoint and the ER intersection.
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Cells that are peers of BOTH a and b. */
function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

// ---- Skyscraper ----
function trySkyscraper(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  // Rows with exactly 2 candidates
  const rowPairs: Array<{ rowIdx: number; cells: [number, number] }> = [];
  for (let r = 0; r < 9; r++) {
    const cells = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cells.length === 2) rowPairs.push({ rowIdx: r, cells: [cells[0]!, cells[1]!] });
  }

  for (let i = 0; i < rowPairs.length; i++) {
    for (let j = i + 1; j < rowPairs.length; j++) {
      const a = rowPairs[i]!;
      const b = rowPairs[j]!;

      for (let ai = 0; ai < 2; ai++) {
        for (let bi = 0; bi < 2; bi++) {
          if (COL_OF[a.cells[ai as 0 | 1]]! !== COL_OF[b.cells[bi as 0 | 1]]!) continue;
          const endA = a.cells[(1 - ai) as 0 | 1];
          const endB = b.cells[(1 - bi) as 0 | 1];
          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;
          const sharedCol = COL_OF[a.cells[ai as 0 | 1]]! + 1;
          return {
            strategyId: 'single-digit-patterns',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...a.cells, ...b.cells, ...elims],
              candidates: [
                ...a.cells.map((c) => ({ cell: c, digit: d })),
                ...b.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: b.cells[bi as 0 | 1], digit: d }, type: 'weak' },
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
                { from: { cell: b.cells[bi as 0 | 1], digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：摩天楼。第 ${a.rowIdx + 1} 行与第 ${b.rowIdx + 1} 行各有 2 个候选数，共享第 ${sharedCol} 列；外端 R${ROW_OF[endA]! + 1}C${COL_OF[endA]! + 1} 和 R${ROW_OF[endB]! + 1}C${COL_OF[endB]! + 1} 的公共可见格消去 ${d}（摩天楼）。`,
              en: `Digit ${d}: Skyscraper in rows ${a.rowIdx + 1} & ${b.rowIdx + 1}, sharing column ${sharedCol}; eliminate ${d} from cells seeing both endpoints R${ROW_OF[endA]! + 1}C${COL_OF[endA]! + 1} and R${ROW_OF[endB]! + 1}C${COL_OF[endB]! + 1} (Skyscraper).`,
            },
          };
        }
      }
    }
  }

  // Column-variant Skyscraper
  const colPairs: Array<{ colIdx: number; cells: [number, number] }> = [];
  for (let c = 0; c < 9; c++) {
    const cells = COLS[c]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) colPairs.push({ colIdx: c, cells: [cells[0]!, cells[1]!] });
  }

  for (let i = 0; i < colPairs.length; i++) {
    for (let j = i + 1; j < colPairs.length; j++) {
      const a = colPairs[i]!;
      const b = colPairs[j]!;

      for (let ai = 0; ai < 2; ai++) {
        for (let bi = 0; bi < 2; bi++) {
          if (ROW_OF[a.cells[ai as 0 | 1]]! !== ROW_OF[b.cells[bi as 0 | 1]]!) continue;
          const endA = a.cells[(1 - ai) as 0 | 1];
          const endB = b.cells[(1 - bi) as 0 | 1];
          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;
          const sharedRow = ROW_OF[a.cells[ai as 0 | 1]]! + 1;
          return {
            strategyId: 'single-digit-patterns',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...a.cells, ...b.cells, ...elims],
              candidates: [
                ...a.cells.map((c) => ({ cell: c, digit: d })),
                ...b.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: b.cells[bi as 0 | 1], digit: d }, type: 'weak' },
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
                { from: { cell: b.cells[bi as 0 | 1], digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：摩天楼（列方向）。第 ${a.colIdx + 1} 列与第 ${b.colIdx + 1} 列各有 2 个候选数，共享第 ${sharedRow} 行；消去公共可见格中的 ${d}（摩天楼）。`,
              en: `Digit ${d}: Skyscraper (column variant) in columns ${a.colIdx + 1} & ${b.colIdx + 1}, sharing row ${sharedRow}; eliminate ${d} from cells seeing both endpoints (Skyscraper).`,
            },
          };
        }
      }
    }
  }

  return null;
}

// ---- 2-String Kite ----
function tryTwoStringKite(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  const rowPairs: Array<{ rowIdx: number; cells: [number, number] }> = [];
  const colPairs: Array<{ colIdx: number; cells: [number, number] }> = [];

  for (let r = 0; r < 9; r++) {
    const cells = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cells.length === 2) rowPairs.push({ rowIdx: r, cells: [cells[0]!, cells[1]!] });
  }
  for (let c = 0; c < 9; c++) {
    const cells = COLS[c]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) colPairs.push({ colIdx: c, cells: [cells[0]!, cells[1]!] });
  }

  for (const row of rowPairs) {
    for (const col of colPairs) {
      for (let ri = 0; ri < 2; ri++) {
        for (let ci = 0; ci < 2; ci++) {
          const rowCell = row.cells[ri as 0 | 1];
          const colCell = col.cells[ci as 0 | 1];
          if (BOX_OF[rowCell] !== BOX_OF[colCell]) continue;
          // They must be different cells
          if (rowCell === colCell) continue;

          const endRow = row.cells[(1 - ri) as 0 | 1];
          const endCol = col.cells[(1 - ci) as 0 | 1];
          if (endRow === endCol) continue;

          const elims = commonPeers(endRow, endCol).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;

          return {
            strategyId: 'single-digit-patterns',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...row.cells, ...col.cells, ...elims],
              candidates: [
                ...row.cells.map((c) => ({ cell: c, digit: d })),
                ...col.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: rowCell, digit: d }, to: { cell: colCell, digit: d }, type: 'weak' },
                { from: { cell: rowCell, digit: d }, to: { cell: endRow, digit: d }, type: 'strong' },
                { from: { cell: colCell, digit: d }, to: { cell: endCol, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：双线风筝。第 ${row.rowIdx + 1} 行与第 ${col.colIdx + 1} 列各有 2 个候选数，在宫 B${BOX_OF[rowCell]! + 1} 相交；消去 R${ROW_OF[endRow]! + 1}C${COL_OF[endRow]! + 1} 和 R${ROW_OF[endCol]! + 1}C${COL_OF[endCol]! + 1} 公共可见格中的 ${d}（双线风筝）。`,
              en: `Digit ${d}: 2-String Kite. Row ${row.rowIdx + 1} and column ${col.colIdx + 1} each have 2 candidates meeting in box B${BOX_OF[rowCell]! + 1}; eliminate ${d} from cells seeing both free endpoints (2-String Kite).`,
            },
          };
        }
      }
    }
  }
  return null;
}

// ---- Empty Rectangle ----
/**
 * Empty Rectangle: for digit d, a box has candidates in cells spanning at least
 * 2 rows and 2 cols within it (forming an "L" or rectangle).
 * We pair this with a conjugate pair (strong link) in a column (or row) that
 * has one endpoint inside the box. The interaction allows eliminations.
 *
 * Specifically: if box B has candidates for d in row R and column C,
 * and there's a strong link A--B where A is in column C (outside box),
 * then any cell in row R that sees B can be eliminated.
 */
function tryEmptyRectangle(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  for (let b = 0; b < 9; b++) {
    const boxCells = BOXES[b]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (boxCells.length < 2) continue;

    const boxRowSet = new Set(boxCells.map((c) => ROW_OF[c]!));
    const boxColSet = new Set(boxCells.map((c) => COL_OF[c]!));

    // ER requires candidates in >= 2 rows AND >= 2 cols (not all in one line)
    if (boxRowSet.size < 2 || boxColSet.size < 2) continue;
    if (boxRowSet.size > 2 || boxColSet.size > 2) continue;

    // For each row in the box that has candidates, try pairing with column conjugates
    for (const erRow of boxRowSet) {
      for (const erCol of boxColSet) {
        // Verify at least one candidate is at (erRow, erCol) intersection
        const hasIntersection = boxCells.some((c) => ROW_OF[c] === erRow && COL_OF[c] === erCol);
        if (!hasIntersection) continue;

        // Find a conjugate pair (strong link) in column erCol outside the box
        const colCands = COLS[erCol]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && BOX_OF[c] !== b,
        );
        if (colCands.length === 2) {
          // We have a strong link: colCands[0] -- colCands[1]
          for (const pivot of colCands) {
            const chainEnd = colCands.find((c) => c !== pivot)!;
            // The ER interaction: if chainEnd is d, then in erRow cells seeing chainEnd are eliminated
            // Actually: pivot is in col erCol; box has candidate at (erRow, erCol).
            // If chainEnd=false, pivot=true. If pivot=true, then in box, the (erRow, erCol) candidate
            // is NOT pivot (different cells), so ER provides: one of the erRow candidates outside
            // the pivot col must be true. But this is getting complex.
            // Standard ER: eliminate d from (erRow intersection NOT in box) that sees chainEnd
            const target = ROWS[erRow]!.filter(
              (c) =>
                grid.get(c) === 0 &&
                (grid.candidatesOf(c) & bit) !== 0 &&
                BOX_OF[c] !== b &&
                PEERS_OF[c]!.includes(chainEnd),
            );
            if (target.length > 0) {
              const elims = target.map((c) => ({ cell: c, digit: d }));
              return {
                strategyId: 'single-digit-patterns',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...boxCells, ...colCands, ...target],
                  candidates: [
                    ...boxCells.map((c) => ({ cell: c, digit: d })),
                    ...colCands.map((c) => ({ cell: c, digit: d })),
                    ...elims,
                  ],
                  links: [
                    { from: { cell: colCands[0]!, digit: d }, to: { cell: colCands[1]!, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `数字 ${d}：空矩形。宫 B${b + 1} 的候选数构成空矩形（行 ${erRow + 1}，列 ${erCol + 1}），与第 ${erCol + 1} 列中的共轭对（R${ROW_OF[colCands[0]!]! + 1}C${erCol + 1}–R${ROW_OF[colCands[1]!]! + 1}C${erCol + 1}）交互；消去第 ${erRow + 1} 行中可见格的 ${d}（空矩形）。`,
                  en: `Digit ${d}: Empty Rectangle. Box B${b + 1}'s candidates span row ${erRow + 1} & column ${erCol + 1}; interacts with conjugate pair in column ${erCol + 1} to eliminate ${d} from row ${erRow + 1} cells (Empty Rectangle).`,
                },
              };
            }
          }
        }

        // Same for row conjugates
        const rowCands = ROWS[erRow]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && BOX_OF[c] !== b,
        );
        if (rowCands.length === 2) {
          for (const pivot of rowCands) {
            const chainEnd = rowCands.find((c) => c !== pivot)!;
            const target = COLS[erCol]!.filter(
              (c) =>
                grid.get(c) === 0 &&
                (grid.candidatesOf(c) & bit) !== 0 &&
                BOX_OF[c] !== b &&
                PEERS_OF[c]!.includes(chainEnd),
            );
            if (target.length > 0) {
              const elims = target.map((c) => ({ cell: c, digit: d }));
              return {
                strategyId: 'single-digit-patterns',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...boxCells, ...rowCands, ...target],
                  candidates: [
                    ...boxCells.map((c) => ({ cell: c, digit: d })),
                    ...rowCands.map((c) => ({ cell: c, digit: d })),
                    ...elims,
                  ],
                  links: [
                    { from: { cell: rowCands[0]!, digit: d }, to: { cell: rowCands[1]!, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `数字 ${d}：空矩形（行方向）。宫 B${b + 1} 的候选数构成空矩形（行 ${erRow + 1}，列 ${erCol + 1}），与第 ${erRow + 1} 行中的共轭对交互；消去第 ${erCol + 1} 列中可见格的 ${d}（空矩形）。`,
                  en: `Digit ${d}: Empty Rectangle (row variant). Box B${b + 1}'s candidates span row ${erRow + 1} & column ${erCol + 1}; interacts with conjugate pair in row ${erRow + 1} to eliminate ${d} from column ${erCol + 1} cells (Empty Rectangle).`,
                },
              };
            }
          }
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
    for (let d = 1; d <= 9; d++) {
      const s1 = trySkyscraper(grid, d);
      if (s1) return s1;
      const s2 = tryTwoStringKite(grid, d);
      if (s2) return s2;
      const s3 = tryEmptyRectangle(grid, d);
      if (s3) return s3;
    }
    return null;
  },
};
