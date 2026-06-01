import { ROW_OF, COL_OF, BOX_OF, BOXES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const pointing: Strategy = {
  id: 'pointing',
  name: { zh: '指向区块', en: 'Pointing' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let b = 0; b < 9; b++) {
      const box = BOXES[b]!;
      for (let digit = 1; digit <= 9; digit++) {
        const potentialCells: number[] = [];
        for (const cell of box) {
          if (grid.hasCandidate(cell, digit)) {
            potentialCells.push(cell);
          }
        }

        if (potentialCells.length >= 2 && potentialCells.length <= 3) {
          // Check if they are all in the same row
          const firstRow = ROW_OF[potentialCells[0]!]!;
          const sameRow = potentialCells.every(c => ROW_OF[c] === firstRow);

          if (sameRow) {
            const rowCells = Array.from({ length: 9 }, (_, col) => firstRow * 9 + col);
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of rowCells) {
              if (BOX_OF[cell] !== b && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: potentialCells,
                  candidates: potentialCells.map(c => ({ cell: c, digit })),
                  links: []
                },
                explanation: {
                  zh: `宫 ${b + 1} 中的数字 ${digit} 仅分布于第 ${firstRow + 1} 行，因此从该行的其他格子中排除候选数 ${digit}（指向数对/三数组）。`,
                  en: `In Box ${b + 1}, digit ${digit} is confined to Row ${firstRow + 1}, so ${digit} can be eliminated from other cells in that Row (Pointing).`,
                }
              };
            }
          }

          // Check if they are all in the same column
          const firstCol = COL_OF[potentialCells[0]!]!;
          const sameCol = potentialCells.every(c => COL_OF[c] === firstCol);

          if (sameCol) {
            const colCells = Array.from({ length: 9 }, (_, row) => row * 9 + firstCol);
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of colCells) {
              if (BOX_OF[cell] !== b && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: potentialCells,
                  candidates: potentialCells.map(c => ({ cell: c, digit })),
                  links: []
                },
                explanation: {
                  zh: `宫 ${b + 1} 中的数字 ${digit} 仅分布于第 ${firstCol + 1} 列，因此从该列的其他格子中排除候选数 ${digit}（指向数对/三数组）。`,
                  en: `In Box ${b + 1}, digit ${digit} is confined to Column ${firstCol + 1}, so ${digit} can be eliminated from other cells in that Column (Pointing).`,
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
