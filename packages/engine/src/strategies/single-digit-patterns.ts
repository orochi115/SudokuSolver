/**
 * T3: Single-Digit Patterns — Skyscraper, 2-String Kite, Empty Rectangle.
 */

import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'single-digit-patterns';

export const singleDigitPatterns: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const step = findSkyscraper(grid, d, bit);
      if (step) return step;
      const step2 = findEmptyRectangle(grid, d, bit);
      if (step2) return step2;
    }
    return null;
  },
};

function findSkyscraper(grid: Grid, d: number, bit: number): Step | null {
  const rowPositions: { row: number; cols: number[] }[] = [];
  for (let r = 0; r < 9; r++) {
    const cols: number[] = [];
    for (const cell of ROWS[r]!) {
      if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) cols.push(cell);
    }
    if (cols.length === 2) rowPositions.push({ row: r, cols });
  }

  for (let i = 0; i < rowPositions.length - 1; i++) {
    for (let j = i + 1; j < rowPositions.length; j++) {
      const ri = rowPositions[i]!;
      const rj = rowPositions[j]!;
      const commonCols = ri.cols.filter((c) => rj.cols.includes(c));
      if (commonCols.length === 2) {
        const c1 = commonCols[0]!;
        const c2 = commonCols[1]!;
        const r1 = ri.row;
        const r2 = rj.row;
        const elims: { cell: number; digit: number }[] = [];
        const highlightCells = [c1, c2, ...ri.cols, ...rj.cols];

        for (let r = 0; r < 9; r++) {
          if (r === r1 || r === r2) continue;
          for (const c of [c1, c2]) {
            const cell = r * 9 + c;
            if (grid.values[cell] === 0 && grid.hasCandidate(cell, d)) {
              elims.push({ cell, digit: d });
            }
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: STRATEGY_ID,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: highlightCells,
              candidates: highlightCells.map((cell) => ({ cell, digit: d })),
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在第 ${r1 + 1} 行和第 ${r2 + 1} 行各有两个候选，列 ${c1 + 1} 和列 ${c2 + 1} 形成双强链，构成摩天楼/双线风筝模式，消去两端可见格的 ${d}（摩天楼/双线风筝）。`,
              en: `Digit ${d} forms a Skyscraper/2-String Kite pattern: rows ${r1 + 1} and ${r2 + 1} each have two candidates in columns ${c1 + 1} and ${c2 + 1}. Eliminate ${d} from cells seeing both endpoints.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function findEmptyRectangle(grid: Grid, d: number, bit: number): Step | null {
  for (const box of BOXES) {
    const cellsWithD: number[] = [];
    for (const cell of box) {
      if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
        cellsWithD.push(cell);
      }
    }
    if (cellsWithD.length !== 4) continue;

    const rows = [...new Set(cellsWithD.map((c) => ROW_OF[c]!))];
    const cols = [...new Set(cellsWithD.map((c) => COL_OF[c]!))];
    if (rows.length !== 2 || cols.length !== 2) continue;

    const r1 = rows[0]!;
    const r2 = rows[1]!;
    const c1 = cols[0]!;
    const c2 = cols[1]!;
    const corner1 = r1 * 9 + c1;
    const corner2 = r1 * 9 + c2;
    const corner3 = r2 * 9 + c1;
    const corner4 = r2 * 9 + c2;

    const corners = [corner1, corner2, corner3, corner4];
    if (!corners.every((c) => cellsWithD.includes(c))) continue;

    const elims: { cell: number; digit: number }[] = [];
    const highlightCells = [...corners];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = r * 9 + c;
        if (BOX_OF[cell] === BOXES.indexOf(box)) continue;
        if (grid.values[cell] !== 0 || !grid.hasCandidate(cell, d)) continue;

        const seesC1 = PEERS_OF[cell]!.includes(corner1) || cell === corner1;
        const seesC4 = PEERS_OF[cell]!.includes(corner4) || cell === corner4;
        const seesC2 = PEERS_OF[cell]!.includes(corner2) || cell === corner2;
        const seesC3 = PEERS_OF[cell]!.includes(corner3) || cell === corner3;

        if ((seesC1 && seesC4) || (seesC2 && seesC3)) {
          elims.push({ cell, digit: d });
        }
      }
    }

    if (elims.length > 0) {
      return {
        strategyId: STRATEGY_ID,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: highlightCells,
          candidates: highlightCells.map((cell) => ({ cell, digit: d })),
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在该宫中形成空矩形模式（四个候选构成矩形），对角端点不可同假，消去可见格的 ${d}（空矩形）。`,
          en: `Digit ${d} forms an Empty Rectangle in box ${BOXES.indexOf(box) + 1}: four candidates at rectangle corners. Endpoints cannot both be false, eliminating ${d} from cells seeing both.`,
        },
      };
    }
  }
  return null;
}
