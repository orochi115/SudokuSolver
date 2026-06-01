import { ROW_OF, COL_OF, BOXES, ROWS, COLS, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const pointing: Strategy = {
  id: 'pointing',
  name: { zh: '指向数对/三数组', en: 'Pointing Pair/Triple' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (let bIdx = 0; bIdx < 9; bIdx++) {
        const box = BOXES[bIdx]!;
        const candidateCells = box.filter((cell) => grid.hasCandidate(cell, digit));
        if (candidateCells.length < 2 || candidateCells.length > 3) continue;

        // Check if all candidates in the box share the same row
        const firstRow = ROW_OF[candidateCells[0]!]!;
        const sameRow = candidateCells.every((cell) => ROW_OF[cell]! === firstRow);

        if (sameRow) {
          // Find other cells in the same row outside the box that have the digit
          const rowCells = ROWS[firstRow]!;
          const eliminations = rowCells
            .filter((cell) => !box.includes(cell) && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));

          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: candidateCells,
                candidates: [
                  ...candidateCells.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `第 ${bIdx + 1} 宫内数字 ${digit} 的候选位置仅限于第 ${firstRow + 1} 行，因此可以排除该行其他单元格中的候选数 ${digit}（指向数对/三数组）。`,
                en: `In Box ${bIdx + 1}, candidates for digit ${digit} are confined to Row ${firstRow + 1}, so we can eliminate ${digit} from other cells in this row (Pointing Pair/Triple).`,
              },
            };
          }
        }

        // Check if all candidates in the box share the same column
        const firstCol = COL_OF[candidateCells[0]!]!;
        const sameCol = candidateCells.every((cell) => COL_OF[cell]! === firstCol);

        if (sameCol) {
          // Find other cells in the same column outside the box that have the digit
          const colCells = COLS[firstCol]!;
          const eliminations = colCells
            .filter((cell) => !box.includes(cell) && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));

          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: candidateCells,
                candidates: [
                  ...candidateCells.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `第 ${bIdx + 1} 宫内数字 ${digit} 的候选位置仅限于第 ${firstCol + 1} 列，因此可以排除该列其他单元格中的候选数 ${digit}（指向数对/三数组）。`,
                en: `In Box ${bIdx + 1}, candidates for digit ${digit} are confined to Column ${firstCol + 1}, so we can eliminate ${digit} from other cells in this column (Pointing Pair/Triple).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
