import { ROW_OF, COL_OF, BOX_OF, BOXES, ROWS, COLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const claiming: Strategy = {
  id: 'claiming',
  name: { zh: '占位排除', en: 'Claiming' },
  difficulty: 22,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // 1. Check Row Claiming: candidates in row r confined to box b
      for (let rIdx = 0; rIdx < 9; rIdx++) {
        const row = ROWS[rIdx]!;
        const candidateCells = row.filter((cell) => grid.hasCandidate(cell, digit));
        if (candidateCells.length < 2 || candidateCells.length > 3) continue;

        const firstBox = BOX_OF[candidateCells[0]!]!;
        const sameBox = candidateCells.every((cell) => BOX_OF[cell]! === firstBox);

        if (sameBox) {
          const box = BOXES[firstBox]!;
          const eliminations = box
            .filter((cell) => ROW_OF[cell]! !== rIdx && grid.hasCandidate(cell, digit))
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
                zh: `第 ${rIdx + 1} 行内数字 ${digit} 的候选位置仅限于第 ${firstBox + 1} 宫，因此可以排除该宫其他单元格中的候选数 ${digit}（占位排除）。`,
                en: `In Row ${rIdx + 1}, candidates for digit ${digit} are confined to Box ${firstBox + 1}, so we can eliminate ${digit} from other cells in this box (Claiming).`,
              },
            };
          }
        }
      }

      // 2. Check Column Claiming: candidates in col c confined to box b
      for (let cIdx = 0; cIdx < 9; cIdx++) {
        const col = COLS[cIdx]!;
        const candidateCells = col.filter((cell) => grid.hasCandidate(cell, digit));
        if (candidateCells.length < 2 || candidateCells.length > 3) continue;

        const firstBox = BOX_OF[candidateCells[0]!]!;
        const sameBox = candidateCells.every((cell) => BOX_OF[cell]! === firstBox);

        if (sameBox) {
          const box = BOXES[firstBox]!;
          const eliminations = box
            .filter((cell) => COL_OF[cell]! !== cIdx && grid.hasCandidate(cell, digit))
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
                zh: `第 ${cIdx + 1} 列内数字 ${digit} 的候选位置仅限于第 ${firstBox + 1} 宫，因此可以排除该宫其他单元格中的候选数 ${digit}（占位排除）。`,
                en: `In Column ${cIdx + 1}, candidates for digit ${digit} are confined to Box ${firstBox + 1}, so we can eliminate ${digit} from other cells in this box (Claiming).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
