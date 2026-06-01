import { ROW_OF, COL_OF, ROWS, COLS, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function applyFish(grid: Grid, size: number, id: string): Step | null {
  const fishNameZh = size === 2 ? 'X翼' : size === 3 ? '剑鱼' : '水母';
  const fishNameEn = size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish';

  for (let digit = 1; digit <= 9; digit++) {
    // 1. Row-based fish (Base: Rows, Cover: Columns)
    const possibleRows: { r: number; cells: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cells = ROWS[r]!.filter((cell) => grid.hasCandidate(cell, digit));
      if (cells.length >= 2 && cells.length <= size) {
        possibleRows.push({ r, cells });
      }
    }

    if (possibleRows.length >= size) {
      const rowCombos = getCombinations(possibleRows, size);
      for (const combo of rowCombos) {
        const comboRows = combo.map((item) => item.r);
        const comboCells = combo.flatMap((item) => item.cells);
        const colSet = new Set(comboCells.map((cell) => COL_OF[cell]!));

        if (colSet.size === size) {
          const colsArray = [...colSet].sort();
          const eliminations: { cell: number; digit: number }[] = [];

          for (const col of colsArray) {
            for (const cell of COLS[col]!) {
              if (grid.hasCandidate(cell, digit) && !comboRows.includes(ROW_OF[cell]!)) {
                eliminations.push({ cell, digit });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              strategyId: id,
              placements: [],
              eliminations,
              highlights: {
                cells: comboCells,
                candidates: [
                  ...comboCells.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `对于数字 ${digit}，以行 [${comboRows.map((r) => r + 1).join(', ')}] 为基础集，列 [${colsArray.map((c) => c + 1).join(', ')}] 为覆盖集，构成 ${fishNameZh}，因此可以排除这些列中其他单元格的候选数 ${digit}。`,
                en: `For digit ${digit}, using Rows [${comboRows.map((r) => r + 1).join(', ')}] as base set and Columns [${colsArray.map((c) => c + 1).join(', ')}] as cover set forms a ${fishNameEn}, so we can eliminate candidate ${digit} from other cells in these columns.`,
              },
            };
          }
        }
      }
    }

    // 2. Column-based fish (Base: Columns, Cover: Rows)
    const possibleCols: { c: number; cells: number[] }[] = [];
    for (let c = 0; c < 9; c++) {
      const cells = COLS[c]!.filter((cell) => grid.hasCandidate(cell, digit));
      if (cells.length >= 2 && cells.length <= size) {
        possibleCols.push({ c, cells });
      }
    }

    if (possibleCols.length >= size) {
      const colCombos = getCombinations(possibleCols, size);
      for (const combo of colCombos) {
        const comboCols = combo.map((item) => item.c);
        const comboCells = combo.flatMap((item) => item.cells);
        const rowSet = new Set(comboCells.map((cell) => ROW_OF[cell]!));

        if (rowSet.size === size) {
          const rowsArray = [...rowSet].sort();
          const eliminations: { cell: number; digit: number }[] = [];

          for (const row of rowsArray) {
            for (const cell of ROWS[row]!) {
              if (grid.hasCandidate(cell, digit) && !comboCols.includes(COL_OF[cell]!)) {
                eliminations.push({ cell, digit });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              strategyId: id,
              placements: [],
              eliminations,
              highlights: {
                cells: comboCells,
                candidates: [
                  ...comboCells.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `对于数字 ${digit}，以列 [${comboCols.map((c) => c + 1).join(', ')}] 为基础集，行 [${rowsArray.map((r) => r + 1).join(', ')}] 为覆盖集，构成 ${fishNameZh}，因此可以排除这些行中其他单元格的候选数 ${digit}。`,
                en: `For digit ${digit}, using Columns [${comboCols.map((c) => c + 1).join(', ')}] as base set and Rows [${rowsArray.map((r) => r + 1).join(', ')}] as cover set forms a ${fishNameEn}, so we can eliminate candidate ${digit} from other cells in these rows.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const xWing: Strategy = {
  id: 'x-wing',
  name: { zh: 'X翼', en: 'X-Wing' },
  difficulty: 40,
  apply(grid: Grid) {
    return applyFish(grid, 2, this.id);
  },
};

export const swordfish: Strategy = {
  id: 'swordfish',
  name: { zh: '剑鱼', en: 'Swordfish' },
  difficulty: 42,
  apply(grid: Grid) {
    return applyFish(grid, 3, this.id);
  },
};

export const jellyfish: Strategy = {
  id: 'jellyfish',
  name: { zh: '水母', en: 'Jellyfish' },
  difficulty: 44,
  apply(grid: Grid) {
    return applyFish(grid, 4, this.id);
  },
};
