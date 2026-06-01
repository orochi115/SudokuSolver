import { SIZE, ROW_OF, COL_OF, BOX_OF, ROWS, COLS, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellIdx(r: number, c: number): number { return r * 9 + c; }

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      const rowsWithTwo: number[] = [];
      const rowCols: number[][] = Array.from({ length: SIZE }, () => []);
      for (let r = 0; r < SIZE; r++) {
        for (const c of ROWS[r]!) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
            rowCols[r]!.push(COL_OF[c]!);
          }
        }
        if (rowCols[r]!.length === 2) rowsWithTwo.push(r);
      }

      const colsWithTwo: number[] = [];
      const colRows: number[][] = Array.from({ length: SIZE }, () => []);
      for (let c = 0; c < SIZE; c++) {
        for (const cell of COLS[c]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) {
            colRows[c]!.push(ROW_OF[cell]!);
          }
        }
        if (colRows[c]!.length === 2) colsWithTwo.push(c);
      }

      for (let i = 0; i < rowsWithTwo.length; i++) {
        const r1 = rowsWithTwo[i]!;
        const cols1 = rowCols[r1]!;
        for (let j = i + 1; j < rowsWithTwo.length; j++) {
          const r2 = rowsWithTwo[j]!;
          const cols2 = rowCols[r2]!;
          if (cols1[0] === cols2[0] && cols1[1] === cols2[1]) continue;

          const trySkyscraper = (end1Col: number, end2Col: number): Step | null => {
            const end1 = cellIdx(r1, end1Col);
            const end2 = cellIdx(r2, end2Col);
            if (ROW_OF[end1] === ROW_OF[end2] || COL_OF[end1] === COL_OF[end2]) return null;
            if (BOX_OF[end1] === BOX_OF[end2]) return null;
            return skyscraperElimsFromEndpoints(d, end1, end2, grid);
          };

          if (cols1[0] === cols2[0]) { const result = trySkyscraper(cols1[1]!, cols2[1]!); if (result) return result; }
          if (cols1[0] === cols2[1]) { const result = trySkyscraper(cols1[1]!, cols2[0]!); if (result) return result; }
          if (cols1[1] === cols2[0]) { const result = trySkyscraper(cols1[0]!, cols2[1]!); if (result) return result; }
          if (cols1[1] === cols2[1]) { const result = trySkyscraper(cols1[0]!, cols2[0]!); if (result) return result; }
        }
      }

      for (let i = 0; i < colsWithTwo.length; i++) {
        const c1 = colsWithTwo[i]!;
        const rows1 = colRows[c1]!;
        for (let j = i + 1; j < colsWithTwo.length; j++) {
          const c2 = colsWithTwo[j]!;
          const rows2 = colRows[c2]!;
          if (rows1[0] === rows2[0] && rows1[1] === rows2[1]) continue;

          const trySkyscraper = (end1Row: number, end2Row: number): Step | null => {
            const end1 = cellIdx(end1Row, c1);
            const end2 = cellIdx(end2Row, c2);
            if (ROW_OF[end1] === ROW_OF[end2] || COL_OF[end1] === COL_OF[end2]) return null;
            if (BOX_OF[end1] === BOX_OF[end2]) return null;
            return skyscraperElimsFromEndpoints(d, end1, end2, grid);
          };

          if (rows1[0] === rows2[0]) { const result = trySkyscraper(rows1[1]!, rows2[1]!); if (result) return result; }
          if (rows1[0] === rows2[1]) { const result = trySkyscraper(rows1[1]!, rows2[0]!); if (result) return result; }
          if (rows1[1] === rows2[0]) { const result = trySkyscraper(rows1[0]!, rows2[1]!); if (result) return result; }
          if (rows1[1] === rows2[1]) { const result = trySkyscraper(rows1[0]!, rows2[0]!); if (result) return result; }
        }
      }
    }
    return null;
  },
};

function skyscraperElimsFromEndpoints(d: number, end1: number, end2: number, grid: Grid): Step | null {
  const r1 = ROW_OF[end1]!;
  const c1 = COL_OF[end1]!;
  const peers1 = PEERS_OF[end1]!;
  const peers2 = PEERS_OF[end2]!;

  const elims: { cell: number; digit: number }[] = [];
  for (const cell of peers1) {
    if (peers2.includes(cell) && grid.hasCandidate(cell, d)) {
      elims.push({ cell, digit: d });
    }
  }
  if (elims.length === 0) return null;

  return {
    strategyId: 'single-digit-patterns',
    placements: [],
    eliminations: elims,
    highlights: { cells: [end1, end2], candidates: [{ cell: end1, digit: d }, { cell: end2, digit: d }], links: [] },
    explanation: {
      zh: `摩天楼：数字 ${d} 在 R${r1 + 1}C${c1 + 1} 和 R${ROW_OF[end2]! + 1}C${COL_OF[end2]! + 1} 构成强链端点，排除共同影响格中的 ${d}。`,
      en: `Skyscraper: Digit ${d} endpoints R${r1 + 1}C${c1 + 1} and R${ROW_OF[end2]! + 1}C${COL_OF[end2]! + 1}, eliminate ${d} from cells seen by both.`,
    },
  };
}