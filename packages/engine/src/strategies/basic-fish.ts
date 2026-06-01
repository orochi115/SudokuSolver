/**
 * T3: Basic fish (X-Wing, Swordfish, Jellyfish) via unified base/cover model.
 *
 * For a given digit, if N base rows (or columns) have all their candidates
 * for that digit covered by exactly N columns (or rows), then that digit can be
 * eliminated from all cover-house cells outside the base houses.
 *
 * - Size 2: X-Wing
 * - Size 3: Swordfish
 * - Size 4: Jellyfish
 */

import { ROWS, COLS, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    const names = ['', 'X-Wing', 'Swordfish', 'Jellyfish'];
    const zhNames = ['', 'X翼', '剑鱼', '水母'];

    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);

      // Try row-base / col-cover
      for (let size = 2; size <= 4; size++) {
        // Get all rows that have between 1 and size candidates for this digit
        const candidateRows: { row: number; cols: number[] }[] = [];
        for (let ri = 0; ri < 9; ri++) {
          const cols: number[] = [];
          for (const cell of ROWS[ri]!) {
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
              cols.push(cell % 9);
            }
          }
          if (cols.length >= 1 && cols.length <= size + 1) {
            candidateRows.push({ row: ri, cols });
          }
        }

        // Try all combinations of 'size' base rows
        const baseRowIdxs = getCombinations(candidateRows.length, size);
        for (const baseIdxCombo of baseRowIdxs) {
          const baseRows = baseIdxCombo.map((i) => candidateRows[i]!);
          const baseCols = [...new Set(baseRows.flatMap((b) => b.cols))];

          if (baseCols.length === size) {
            const allBaseCells = baseRows.flatMap((b) =>
              ROWS[b.row]!.filter((c) => baseCols.includes(c % 9) && grid.hasCandidate(c, digit))
            );

            const eliminations: { cell: number; digit: number }[] = [];
            for (const col of baseCols) {
              for (let ri = 0; ri < 9; ri++) {
                if (baseRows.some((b) => b.row === ri)) continue;
                const cell = ri * 9 + col;
                if (grid.hasCandidate(cell, digit)) {
                  eliminations.push({ cell, digit });
                }
              }
            }

            if (eliminations.length > 0) {
              const fishName = names[size];
              const rList = baseRows.map((b) => b.row + 1).join(',');
              const cList = baseCols.map((c) => c + 1).join(',');
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: allBaseCells,
                  candidates: allBaseCells.map((c) => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `数字 ${digit} 在行 ${rList} 上的候选被列 ${cList} 覆盖，形成${zhNames[size]}，从列 ${cList} 其他行消去 ${digit}。`,
                  en: `Digit ${digit} in rows ${rList} is covered by columns ${cList} — a ${fishName}; eliminate ${digit} from other cells in those columns.`,
                },
              };
            }
          }
        }
      }

      // Try col-base / row-cover
      for (let size = 2; size <= 4; size++) {
        const candidateCols: { col: number; rows: number[] }[] = [];
        for (let ci = 0; ci < 9; ci++) {
          const rows: number[] = [];
          for (const cell of COLS[ci]!) {
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
              rows.push(Math.floor(cell / 9));
            }
          }
          if (rows.length >= 1 && rows.length <= size + 1) {
            candidateCols.push({ col: ci, rows });
          }
        }

        const baseColIdxs = getCombinations(candidateCols.length, size);
        for (const baseIdxCombo of baseColIdxs) {
          const baseCols = baseIdxCombo.map((i) => candidateCols[i]!);
          const baseRows = [...new Set(baseCols.flatMap((b) => b.rows))];

          if (baseRows.length === size) {
            const allBaseCells = baseCols.flatMap((b) =>
              COLS[b.col]!.filter((c) => baseRows.includes(Math.floor(c / 9)) && grid.hasCandidate(c, digit))
            );

            const eliminations: { cell: number; digit: number }[] = [];
            for (const row of baseRows) {
              for (let ci = 0; ci < 9; ci++) {
                if (baseCols.some((b) => b.col === ci)) continue;
                const cell = row * 9 + ci;
                if (grid.hasCandidate(cell, digit)) {
                  eliminations.push({ cell, digit });
                }
              }
            }

            if (eliminations.length > 0) {
              const fishName = names[size];
              const cList = baseCols.map((b) => b.col + 1).join(',');
              const rList = baseRows.map((r) => r + 1).join(',');
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: allBaseCells,
                  candidates: allBaseCells.map((c) => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `数字 ${digit} 在列 ${cList} 上的候选被行 ${rList} 覆盖，形成${zhNames[size]}，从行 ${rList} 其他列消去 ${digit}。`,
                  en: `Digit ${digit} in columns ${cList} is covered by rows ${rList} — a ${fishName}; eliminate ${digit} from other cells in those rows.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};

function getCombinations(n: number, k: number): number[][] {
  const result: number[][] = [];
  const comb: number[] = [];
  function backtrack(start: number, depth: number) {
    if (depth === k) {
      result.push([...comb]);
      return;
    }
    for (let i = start; i < n; i++) {
      comb.push(i);
      backtrack(i + 1, depth + 1);
      comb.pop();
    }
  }
  backtrack(0, 0);
  return result;
}