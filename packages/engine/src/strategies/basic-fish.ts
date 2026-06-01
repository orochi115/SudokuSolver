import { ROWS, COLS, ROW_OF, COL_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
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

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40, // Suggested cost band: 40 fish

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      for (let size = 2; size <= 4; size++) {
        // ---- Case 1: Row-based Fish (Base: Rows, Cover: Cols) ----
        const activeRows: number[] = [];
        for (let r = 0; r < 9; r++) {
          const hasDigit = ROWS[r]!.some(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
          if (hasDigit) {
            activeRows.push(r);
          }
        }

        if (activeRows.length >= size) {
          const rowCombos = getCombinations(activeRows, size);
          for (const baseRows of rowCombos) {
            // Find cover columns (union of columns of all cells with candidate digit in baseRows)
            const colsSet = new Set<number>();
            const baseCells: number[] = [];
            for (const r of baseRows) {
              for (const cell of ROWS[r]!) {
                if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                  colsSet.add(COL_OF[cell]!);
                  baseCells.push(cell);
                }
              }
            }

            if (colsSet.size === size) {
              const coverCols = [...colsSet].sort((a, b) => a - b);
              const eliminations: CellDigit[] = [];
              for (const colIdx of coverCols) {
                for (const cell of COLS[colIdx]!) {
                  if (!baseRows.includes(ROW_OF[cell]!) && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }

              if (eliminations.length > 0) {
                const fishNames = {
                  2: { zh: 'X-Wing', en: 'X-Wing' },
                  3: { zh: '剑鱼', en: 'Swordfish' },
                  4: { zh: '水母', en: 'Jellyfish' },
                };
                const fishName = fishNames[size as 2 | 3 | 4]!;
                const baseStr = baseRows.map(r => `R${r + 1}`).join(', ');
                const coverStr = coverCols.map(c => `C${c + 1}`).join(', ');

                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...baseCells],
                    candidates: baseCells.map(c => ({ cell: c, digit })),
                    links: [],
                  },
                  explanation: {
                    zh: `对于候选数 ${digit}，以 {${baseStr}} 为基本行，{${coverStr}} 为对应列构成 ${fishName.zh}。因此可从这几列的其他格子中排除候选数 ${digit}。`,
                    en: `For candidate ${digit}, base rows {${baseStr}} and cover columns {${coverStr}} form a ${fishName.en}. Thus, ${digit} can be eliminated from other cells in these columns.`,
                  },
                };
              }
            }
          }
        }

        // ---- Case 2: Column-based Fish (Base: Cols, Cover: Rows) ----
        const activeCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          const hasDigit = COLS[c]!.some(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
          if (hasDigit) {
            activeCols.push(c);
          }
        }

        if (activeCols.length >= size) {
          const colCombos = getCombinations(activeCols, size);
          for (const baseCols of colCombos) {
            // Find cover rows
            const rowsSet = new Set<number>();
            const baseCells: number[] = [];
            for (const c of baseCols) {
              for (const cell of COLS[c]!) {
                if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                  rowsSet.add(ROW_OF[cell]!);
                  baseCells.push(cell);
                }
              }
            }

            if (rowsSet.size === size) {
              const coverRows = [...rowsSet].sort((a, b) => a - b);
              const eliminations: CellDigit[] = [];
              for (const rowIdx of coverRows) {
                for (const cell of ROWS[rowIdx]!) {
                  if (!baseCols.includes(COL_OF[cell]!) && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }

              if (eliminations.length > 0) {
                const fishNames = {
                  2: { zh: 'X-Wing', en: 'X-Wing' },
                  3: { zh: '剑鱼', en: 'Swordfish' },
                  4: { zh: '水母', en: 'Jellyfish' },
                };
                const fishName = fishNames[size as 2 | 3 | 4]!;
                const baseStr = baseCols.map(c => `C${c + 1}`).join(', ');
                const coverStr = coverRows.map(r => `R${r + 1}`).join(', ');

                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...baseCells],
                    candidates: baseCells.map(c => ({ cell: c, digit })),
                    links: [],
                  },
                  explanation: {
                    zh: `对于候选数 ${digit}，以 {${baseStr}} 为基本列，{${coverStr}} 为对应行构成 ${fishName.zh}。因此可从这几行的其他格子中排除候选数 ${digit}。`,
                    en: `For candidate ${digit}, base columns {${baseStr}} and cover rows {${coverStr}} form a ${fishName.en}. Thus, ${digit} can be eliminated from other cells in these rows.`,
                  },
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};
