import { ROW_OF, COL_OF, BOX_OF, BOXES, ROWS, COLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const claiming: Strategy = {
  id: 'claiming',
  name: { zh: '行列区块', en: 'Claiming' },
  difficulty: 22,

  apply(grid: Grid): Step | null {
    // Check rows first
    for (let r = 0; r < 9; r++) {
      const row = ROWS[r]!;
      for (let digit = 1; digit <= 9; digit++) {
        const potentialCells: number[] = [];
        for (const cell of row) {
          if (grid.hasCandidate(cell, digit)) {
            potentialCells.push(cell);
          }
        }

        if (potentialCells.length >= 2) {
          const firstBox = BOX_OF[potentialCells[0]!]!;
          const sameBox = potentialCells.every(c => BOX_OF[c] === firstBox);

          if (sameBox) {
            const box = BOXES[firstBox]!;
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of box) {
              if (ROW_OF[cell] !== r && grid.hasCandidate(cell, digit)) {
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
                  zh: `第 ${r + 1} 行中的数字 ${digit} 仅分布于宫 ${firstBox + 1}，因此从该宫的其他格子中排除候选数 ${digit}（占位排除）。`,
                  en: `In Row ${r + 1}, digit ${digit} is confined to Box ${firstBox + 1}, so ${digit} can be eliminated from other cells in that Box (Claiming).`,
                }
              };
            }
          }
        }
      }
    }

    // Check columns
    for (let c = 0; c < 9; c++) {
      const col = COLS[c]!;
      for (let digit = 1; digit <= 9; digit++) {
        const potentialCells: number[] = [];
        for (const cell of col) {
          if (grid.hasCandidate(cell, digit)) {
            potentialCells.push(cell);
          }
        }

        if (potentialCells.length >= 2) {
          const firstBox = BOX_OF[potentialCells[0]!]!;
          const sameBox = potentialCells.every(c => BOX_OF[c] === firstBox);

          if (sameBox) {
            const box = BOXES[firstBox]!;
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of box) {
              if (COL_OF[cell] !== c && grid.hasCandidate(cell, digit)) {
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
                  zh: `第 ${c + 1} 列中的数字 ${digit} 仅分布于宫 ${firstBox + 1}，因此从该宫的其他格子中排除候选数 ${digit}（占位排除）。`,
                  en: `In Column ${c + 1}, digit ${digit} is confined to Box ${firstBox + 1}, so ${digit} can be eliminated from other cells in that Box (Claiming).`,
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
