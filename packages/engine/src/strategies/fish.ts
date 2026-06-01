import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, path: T[]) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]!);
      helper(i + 1, path);
      path.pop();
    }
  }
  helper(0, []);
  return result;
}

function makeFish(N: 2 | 3 | 4): Strategy {
  const fishNameZh = N === 2 ? 'X翼' : N === 3 ? '剑鱼' : '水母';
  const fishNameEn = N === 2 ? 'X-Wing' : N === 3 ? 'Swordfish' : 'Jellyfish';
  const id = N === 2 ? 'x-wing' : N === 3 ? 'swordfish' : 'jellyfish';
  const difficulty = 40 + (N - 2) * 2; // Size 2: 40, Size 3: 42, Size 4: 44

  return {
    id,
    name: { zh: fishNameZh, en: fishNameEn },
    difficulty,

    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        // --- 1. Row-based Fish ---
        const candidateColsPerRow: number[][] = Array.from({ length: 9 }, () => []);
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = r * 9 + c;
            if (grid.hasCandidate(cell, digit)) {
              candidateColsPerRow[r]!.push(c);
            }
          }
        }

        const validRows: number[] = [];
        for (let r = 0; r < 9; r++) {
          const cols = candidateColsPerRow[r]!;
          if (cols.length >= 2 && cols.length <= N) {
            validRows.push(r);
          }
        }

        if (validRows.length >= N) {
          const rowCombos = getCombinations(validRows, N);
          for (const baseRows of rowCombos) {
            const colUnionSet = new Set<number>();
            for (const r of baseRows) {
              for (const c of candidateColsPerRow[r]!) {
                colUnionSet.add(c);
              }
            }

            if (colUnionSet.size === N) {
              const coverCols = [...colUnionSet].sort((a, b) => a - b);
              const eliminations: CellDigit[] = [];
              const highlightsCells: number[] = [];

              for (const r of baseRows) {
                for (const c of candidateColsPerRow[r]!) {
                  highlightsCells.push(r * 9 + c);
                }
              }

              for (const c of coverCols) {
                for (let r = 0; r < 9; r++) {
                  if (!baseRows.includes(r)) {
                    const cell = r * 9 + c;
                    if (grid.hasCandidate(cell, digit)) {
                      eliminations.push({ cell, digit });
                    }
                  }
                }
              }

              if (eliminations.length > 0) {
                const baseRowNames = baseRows.map(r => r + 1).join(', ');
                const coverColNames = coverCols.map(c => c + 1).join(', ');
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: highlightsCells,
                    candidates: highlightsCells.map(cell => ({ cell, digit })),
                    links: []
                  },
                  explanation: {
                    zh: `找到数字 ${digit} 的 ${fishNameZh}（基准行：第 ${baseRowNames} 行，覆盖列：第 ${coverColNames} 列），因此排除覆盖列中其他格子上的候选数 ${digit}。`,
                    en: `Found ${fishNameEn} for digit ${digit} (Base rows: Row ${baseRowNames}, Cover columns: Column ${coverColNames}), so ${digit} can be eliminated from other cells in the cover columns.`,
                  }
                };
              }
            }
          }
        }

        // --- 2. Column-based Fish ---
        const candidateRowsPerCol: number[][] = Array.from({ length: 9 }, () => []);
        for (let c = 0; c < 9; c++) {
          for (let r = 0; r < 9; r++) {
            const cell = r * 9 + c;
            if (grid.hasCandidate(cell, digit)) {
              candidateRowsPerCol[c]!.push(r);
            }
          }
        }

        const validCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          const rows = candidateRowsPerCol[c]!;
          if (rows.length >= 2 && rows.length <= N) {
            validCols.push(c);
          }
        }

        if (validCols.length >= N) {
          const colCombos = getCombinations(validCols, N);
          for (const baseCols of colCombos) {
            const rowUnionSet = new Set<number>();
            for (const c of baseCols) {
              for (const r of candidateRowsPerCol[c]!) {
                rowUnionSet.add(r);
              }
            }

            if (rowUnionSet.size === N) {
              const coverRows = [...rowUnionSet].sort((a, b) => a - b);
              const eliminations: CellDigit[] = [];
              const highlightsCells: number[] = [];

              for (const c of baseCols) {
                for (const r of candidateRowsPerCol[c]!) {
                  highlightsCells.push(r * 9 + c);
                }
              }

              for (const r of coverRows) {
                for (let c = 0; c < 9; c++) {
                  if (!baseCols.includes(c)) {
                    const cell = r * 9 + c;
                    if (grid.hasCandidate(cell, digit)) {
                      eliminations.push({ cell, digit });
                    }
                  }
                }
              }

              if (eliminations.length > 0) {
                const baseColNames = baseCols.map(c => c + 1).join(', ');
                const coverRowNames = coverRows.map(r => r + 1).join(', ');
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: highlightsCells,
                    candidates: highlightsCells.map(cell => ({ cell, digit })),
                    links: []
                  },
                  explanation: {
                    zh: `找到数字 ${digit} 的 ${fishNameZh}（基准列：第 ${baseColNames} 列，覆盖行：第 ${coverRowNames} 行），因此排除覆盖行中其他格子上的候选数 ${digit}。`,
                    en: `Found ${fishNameEn} for digit ${digit} (Base columns: Column ${baseColNames}, Cover rows: Row ${coverRowNames}), so ${digit} can be eliminated from other cells in the cover rows.`,
                  }
                };
              }
            }
          }
        }
      }
      return null;
    }
  };
}

export const xWing = makeFish(2);
export const swordfish = makeFish(3);
export const jellyfish = makeFish(4);
