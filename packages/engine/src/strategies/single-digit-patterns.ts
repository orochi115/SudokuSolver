/**
 * Single-Digit Patterns (T3) — Skyscraper, 2-String Kite, Empty Rectangle.
 *
 * These are short strong-link chains on a single digit:
 *
 * Skyscraper:
 *   Two rows each have exactly two candidate cells for digit d.
 *   Both rows share one column → the "base". The two non-shared cells are
 *   "endpoints". Any cell seeing BOTH endpoints can't have d.
 *
 * 2-String Kite:
 *   One row and one column each have exactly two candidate cells for digit d.
 *   They share one cell (at intersection r,c) which is a candidate, or they
 *   share one box. One endpoint from the row, one from the column (both NOT
 *   in the shared area). Any cell seeing both endpoints can be eliminated.
 *
 * Empty Rectangle:
 *   A box has candidates for digit d confined to one row AND one column
 *   within the box (forming an "L" or cross pattern). Combined with a
 *   strong link elsewhere on the same row/column, this creates an elimination.
 */

import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Return cells in house that are candidates for digit d. */
function candidateCellsInHouse(grid: Grid, house: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

/** True if two cells are peers (share row, col, or box). */
function arePeers(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/** Cells that see both a and b (peers of both, excluding a and b themselves). */
function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => c !== a && peersA.has(c));
}

// ---- Skyscraper ----
function trySkyscraper(grid: Grid): Step | null {
  for (let d = 1; d <= SIZE; d++) {
    const bit = maskOf(d);

    // Find rows with exactly 2 candidates for d
    const twoRows: Array<{ rowIdx: number; cell0: number; cell1: number }> = [];
    for (let r = 0; r < 9; r++) {
      const cells = candidateCellsInHouse(grid, ROWS[r]!, d);
      if (cells.length === 2 && cells[0] !== undefined && cells[1] !== undefined) {
        twoRows.push({ rowIdx: r, cell0: cells[0], cell1: cells[1] });
      }
    }

    for (let i = 0; i < twoRows.length; i++) {
      for (let j = i + 1; j < twoRows.length; j++) {
        const ri = twoRows[i]!;
        const rj = twoRows[j]!;
        const { rowIdx: r1, cell0: a, cell1: b } = ri;
        const { rowIdx: r2, cell0: c, cell1: dd } = rj;

        // Check if rows share exactly one column (the "bridge")
        let endA = -1;
        let endB = -1;
        let bridgeCol = -1;

        if (COL_OF[a] === COL_OF[c]) {
          bridgeCol = COL_OF[a]!; endA = b; endB = dd;
        } else if (COL_OF[a] === COL_OF[dd]) {
          bridgeCol = COL_OF[a]!; endA = b; endB = c;
        } else if (COL_OF[b] === COL_OF[c]) {
          bridgeCol = COL_OF[b]!; endA = a; endB = dd;
        } else if (COL_OF[b] === COL_OF[dd]) {
          bridgeCol = COL_OF[b]!; endA = a; endB = c;
        }

        if (bridgeCol === -1 || endA === -1 || endB === -1) continue;

        // Eliminations: cells seeing both endA and endB
        const elims = commonPeers(endA, endB).filter(
          (cell) => cell !== endA && cell !== endB && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join('、');
        const baseCells = [a, b, c, dd];

        return {
          strategyId: 'skyscraper',
          placements: [],
          eliminations: elims.map((cell) => ({ cell, digit: d })),
          highlights: {
            cells: baseCells,
            candidates: baseCells.map((cell) => ({ cell, digit: d })),
            links: [
              { from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' },
              { from: { cell: c, digit: d }, to: { cell: dd, digit: d }, type: 'strong' },
              { from: { cell: endA, digit: d }, to: { cell: endB, digit: d }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `数字 ${d} 的摩天楼：行${r1 + 1}的 R${ROW_OF[a]! + 1}C${COL_OF[a]! + 1}-R${ROW_OF[b]! + 1}C${COL_OF[b]! + 1} 与行${r2 + 1}的 R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}-R${ROW_OF[dd]! + 1}C${COL_OF[dd]! + 1} 共用列${bridgeCol + 1}。能看到两端点的格可消除候选数 ${d}。消除：${elimStr}。`,
            en: `Skyscraper on digit ${d}: Row ${r1 + 1} pair and Row ${r2 + 1} pair share Column ${bridgeCol + 1}. Cells seeing both endpoints R${ROW_OF[endA]! + 1}C${COL_OF[endA]! + 1} and R${ROW_OF[endB]! + 1}C${COL_OF[endB]! + 1} can eliminate ${d}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }

    // Column-based skyscraper
    const twoCols: Array<{ colIdx: number; cell0: number; cell1: number }> = [];
    for (let c = 0; c < 9; c++) {
      const cells = candidateCellsInHouse(grid, COLS[c]!, d);
      if (cells.length === 2 && cells[0] !== undefined && cells[1] !== undefined) {
        twoCols.push({ colIdx: c, cell0: cells[0], cell1: cells[1] });
      }
    }

    for (let i = 0; i < twoCols.length; i++) {
      for (let j = i + 1; j < twoCols.length; j++) {
        const ci = twoCols[i]!;
        const cj = twoCols[j]!;
        const { colIdx: c1, cell0: a, cell1: b } = ci;
        const { colIdx: c2, cell0: cc, cell1: ddCell } = cj;

        let endA = -1;
        let endB = -1;
        let bridgeRow = -1;

        if (ROW_OF[a] === ROW_OF[cc]) {
          bridgeRow = ROW_OF[a]!; endA = b; endB = ddCell;
        } else if (ROW_OF[a] === ROW_OF[ddCell]) {
          bridgeRow = ROW_OF[a]!; endA = b; endB = cc;
        } else if (ROW_OF[b] === ROW_OF[cc]) {
          bridgeRow = ROW_OF[b]!; endA = a; endB = ddCell;
        } else if (ROW_OF[b] === ROW_OF[ddCell]) {
          bridgeRow = ROW_OF[b]!; endA = a; endB = cc;
        }

        if (bridgeRow === -1 || endA === -1 || endB === -1) continue;

        const elims = commonPeers(endA, endB).filter(
          (cell) => cell !== endA && cell !== endB && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join('、');
        const baseCells = [a, b, cc, ddCell];

        return {
          strategyId: 'skyscraper',
          placements: [],
          eliminations: elims.map((cell) => ({ cell, digit: d })),
          highlights: {
            cells: baseCells,
            candidates: baseCells.map((cell) => ({ cell, digit: d })),
            links: [
              { from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' },
              { from: { cell: cc, digit: d }, to: { cell: ddCell, digit: d }, type: 'strong' },
              { from: { cell: endA, digit: d }, to: { cell: endB, digit: d }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `数字 ${d} 的摩天楼（列向）：列${c1 + 1}与列${c2 + 1}共用行${bridgeRow + 1}。能看到两端点的格可消除候选数 ${d}。消除：${elimStr}。`,
            en: `Skyscraper (column-based) on digit ${d}: Column ${c1 + 1} and Column ${c2 + 1} share Row ${bridgeRow + 1}. Cells seeing both endpoints can eliminate ${d}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }
  return null;
}

// ---- 2-String Kite ----
// A row pair [rowA, rowB] and a column pair [colA, colB] share a box via one cell:
// - exactly one of {rowA, rowB} is in the same box as exactly one of {colA, colB}
// - those two "bridge" cells are DIFFERENT cells (they just share a box)
// - the other two cells are the "tail" endpoints
// - any cell seeing both tails can eliminate d
function try2StringKite(grid: Grid): Step | null {
  for (let d = 1; d <= SIZE; d++) {
    const bit = maskOf(d);

    // Collect all row pairs and col pairs with exactly 2 candidates for d
    const rowPairs: Array<{ r: number; a: number; b: number }> = [];
    const colPairs: Array<{ c: number; a: number; b: number }> = [];

    for (let r = 0; r < 9; r++) {
      const cells = candidateCellsInHouse(grid, ROWS[r]!, d);
      if (cells.length === 2) rowPairs.push({ r, a: cells[0]!, b: cells[1]! });
    }
    for (let c = 0; c < 9; c++) {
      const cells = candidateCellsInHouse(grid, COLS[c]!, d);
      if (cells.length === 2) colPairs.push({ c, a: cells[0]!, b: cells[1]! });
    }

    for (const rp of rowPairs) {
      for (const cp of colPairs) {
        // The row and col cells must span exactly 4 distinct cells
        // (no cell can be in both - that would make the intersection cell a shared candidate)
        const allCells = [rp.a, rp.b, cp.a, cp.b];
        const uniqueCells = new Set(allCells);
        if (uniqueCells.size !== 4) continue; // skip degenerate cases

        // Find which row cell shares a box with which col cell (the "bridge pair")
        // There must be exactly one bridge pair, and they must NOT be in the same row/col
        // (to avoid being the same intersection cell - already excluded above)
        let tailRow = -1;   // row cell that is the tail (NOT sharing a box with any col cell)
        let tailCol = -1;   // col cell that is the tail

        // Try pairing rp.a with cp.a (bridge), then tails are rp.b and cp.b
        if (BOX_OF[rp.a] === BOX_OF[cp.a] && BOX_OF[rp.b] !== BOX_OF[cp.b] && BOX_OF[rp.b] !== BOX_OF[cp.a]) {
          tailRow = rp.b; tailCol = cp.b;
        } else if (BOX_OF[rp.a] === BOX_OF[cp.b] && BOX_OF[rp.b] !== BOX_OF[cp.a] && BOX_OF[rp.b] !== BOX_OF[cp.b]) {
          tailRow = rp.b; tailCol = cp.a;
        } else if (BOX_OF[rp.b] === BOX_OF[cp.a] && BOX_OF[rp.a] !== BOX_OF[cp.b] && BOX_OF[rp.a] !== BOX_OF[cp.a]) {
          tailRow = rp.a; tailCol = cp.b;
        } else if (BOX_OF[rp.b] === BOX_OF[cp.b] && BOX_OF[rp.a] !== BOX_OF[cp.a] && BOX_OF[rp.a] !== BOX_OF[cp.b]) {
          tailRow = rp.a; tailCol = cp.a;
        }

        if (tailRow === -1 || tailCol === -1) continue;

        // The tail cells must not be in the same row OR same column (otherwise the kite degenerates)
        if (ROW_OF[tailRow] === ROW_OF[tailCol] || COL_OF[tailRow] === COL_OF[tailCol]) continue;

        // Eliminations: cells seeing both tails
        const elims = commonPeers(tailRow, tailCol).filter(
          (cell) => !uniqueCells.has(cell) && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join('、');

        return {
          strategyId: '2-string-kite',
          placements: [],
          eliminations: elims.map((cell) => ({ cell, digit: d })),
          highlights: {
            cells: [...uniqueCells],
            candidates: [...uniqueCells].map((cell) => ({ cell, digit: d })),
            links: [
              { from: { cell: rp.a, digit: d }, to: { cell: rp.b, digit: d }, type: 'strong' },
              { from: { cell: cp.a, digit: d }, to: { cell: cp.b, digit: d }, type: 'strong' },
              { from: { cell: tailRow, digit: d }, to: { cell: tailCol, digit: d }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `数字 ${d} 的双线风筝：行${rp.r + 1}和列${cp.c + 1}的候选数经共享宫相连，尾端 R${ROW_OF[tailRow]! + 1}C${COL_OF[tailRow]! + 1} 与 R${ROW_OF[tailCol]! + 1}C${COL_OF[tailCol]! + 1} 的公共可见格可消除候选数 ${d}。消除：${elimStr}。`,
            en: `2-String Kite on digit ${d}: Row ${rp.r + 1} and Column ${cp.c + 1} are connected via a shared box. Cells seeing both tails R${ROW_OF[tailRow]! + 1}C${COL_OF[tailRow]! + 1} and R${ROW_OF[tailCol]! + 1}C${COL_OF[tailCol]! + 1} can eliminate ${d}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }
  return null;
}

// ---- Empty Rectangle ----
function tryEmptyRectangle(grid: Grid): Step | null {
  for (let d = 1; d <= SIZE; d++) {
    const bit = maskOf(d);

    for (let b = 0; b < 9; b++) {
      const box = BOXES[b]!;
      const boxCells = box.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (boxCells.length < 2) continue;

      // ER condition: all box candidates lie on the union of one row and one column
      const boxRowSet = new Set(boxCells.map((c) => ROW_OF[c]!));
      const boxColSet = new Set(boxCells.map((c) => COL_OF[c]!));

      // Must have at most 2 rows and 2 cols with candidates (or exactly 1 of each for L/cross)
      if (boxRowSet.size > 3 || boxColSet.size > 3) continue;

      for (const erRow of boxRowSet) {
        for (const erCol of boxColSet) {
          // Check ER: all candidates in this box are on erRow OR erCol
          const onLine = boxCells.every((c) => ROW_OF[c] === erRow || COL_OF[c] === erCol);
          if (!onLine) continue;
          // Must NOT be all on one line (otherwise it's a locked candidate)
          const allOnRow = boxCells.every((c) => ROW_OF[c] === erRow);
          const allOnCol = boxCells.every((c) => COL_OF[c] === erCol);
          if (allOnRow || allOnCol) continue;

          // ER found in box b with intersection at (erRow, erCol).
          // Now look for a strong link in erCol (outside the box):
          // a house-of-two on digit d within COLS[erCol] that excludes the box

          const colOutside = COLS[erCol]!.filter((c) => BOX_OF[c] !== b && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          if (colOutside.length === 2) {
            const linkP = colOutside[0]!;
            const linkQ = colOutside[1]!;
            // Try each endpoint as the one "close to the ER"
            for (const [near, far] of [[linkP, linkQ], [linkQ, linkP]] as const) {
              // near is in erRow → connects to ER row branch
              if (ROW_OF[near] !== erRow) continue;
              // far is the other endpoint
              // Eliminate d from erRow cells outside box that see far
              const erRowOutside = ROWS[erRow]!.filter(
                (c) => BOX_OF[c] !== b && c !== near && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
              );
              const elims = erRowOutside.filter((c) => arePeers(c, far));
              if (elims.length === 0) continue;

              const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
              return {
                strategyId: 'empty-rectangle',
                placements: [],
                eliminations: elims.map((c) => ({ cell: c, digit: d })),
                highlights: {
                  cells: [...boxCells, linkP, linkQ],
                  candidates: [...boxCells, linkP, linkQ].map((c) => ({ cell: c, digit: d })),
                  links: [
                    { from: { cell: linkP, digit: d }, to: { cell: linkQ, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `数字 ${d} 的空矩形：宫${b + 1}中候选数形成行${erRow + 1}/列${erCol + 1}的空矩形，配合列${erCol + 1}强链消除候选数 ${d}。消除：${elimStr}。`,
                  en: `Empty Rectangle on digit ${d}: Box ${b + 1} candidates form an ER at Row ${erRow + 1}/Column ${erCol + 1}. Combined with a strong link in Column ${erCol + 1}, eliminate ${d}. Eliminations: ${elimStr}.`,
                },
              };
            }
          }

          // Strong link in erRow (outside the box):
          const rowOutside = ROWS[erRow]!.filter((c) => BOX_OF[c] !== b && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          if (rowOutside.length === 2) {
            const linkP = rowOutside[0]!;
            const linkQ = rowOutside[1]!;
            for (const [near, far] of [[linkP, linkQ], [linkQ, linkP]] as const) {
              if (COL_OF[near] !== erCol) continue;
              const erColOutside = COLS[erCol]!.filter(
                (c) => BOX_OF[c] !== b && c !== near && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
              );
              const elims = erColOutside.filter((c) => arePeers(c, far));
              if (elims.length === 0) continue;

              const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
              return {
                strategyId: 'empty-rectangle',
                placements: [],
                eliminations: elims.map((c) => ({ cell: c, digit: d })),
                highlights: {
                  cells: [...boxCells, linkP, linkQ],
                  candidates: [...boxCells, linkP, linkQ].map((c) => ({ cell: c, digit: d })),
                  links: [
                    { from: { cell: linkP, digit: d }, to: { cell: linkQ, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `数字 ${d} 的空矩形：宫${b + 1}中候选数形成行${erRow + 1}/列${erCol + 1}的空矩形，配合行${erRow + 1}强链消除候选数 ${d}。消除：${elimStr}。`,
                  en: `Empty Rectangle on digit ${d}: Box ${b + 1} candidates form an ER at Row ${erRow + 1}/Column ${erCol + 1}. Combined with a strong link in Row ${erRow + 1}, eliminate ${d}. Eliminations: ${elimStr}.`,
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

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 45,
  apply: trySkyscraper,
};

export const twoStringKite: Strategy = {
  id: '2-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 45,
  apply: try2StringKite,
};

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 45,
  apply: tryEmptyRectangle,
};
