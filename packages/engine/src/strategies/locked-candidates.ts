import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      // 1. Pointing (Box -> Row/Col)
      for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
        const boxCells = BOXES[boxIdx]!;
        const possibleCells: number[] = [];
        for (const cell of boxCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }

        if (possibleCells.length >= 2 && possibleCells.length <= 3) {
          // Check if all in same row
          const firstRow = ROW_OF[possibleCells[0]!]!;
          const sameRow = possibleCells.every(c => ROW_OF[c] === firstRow);

          if (sameRow) {
            const eliminations: CellDigit[] = [];
            const rowCells = ROWS[firstRow]!;
            for (const cell of rowCells) {
              if (BOX_OF[cell] !== boxIdx && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              const lineNum = firstRow + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...possibleCells],
                  candidates: possibleCells.map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `在第 ${boxIdx + 1} 宫中，所有能填入候选数 ${digit} 的格子都位于第 ${lineNum} 行。因此，可从第 ${lineNum} 行的其他格子中排除候选数 ${digit}（指向区块排除）。`,
                  en: `In box ${boxIdx + 1}, all candidates for ${digit} are locked in row ${lineNum}. Thus, ${digit} can be eliminated from other cells in row ${lineNum} (Pointing).`,
                },
              };
            }
          }

          // Check if all in same col
          const firstCol = COL_OF[possibleCells[0]!]!;
          const sameCol = possibleCells.every(c => COL_OF[c] === firstCol);

          if (sameCol) {
            const eliminations: CellDigit[] = [];
            const colCells = COLS[firstCol]!;
            for (const cell of colCells) {
              if (BOX_OF[cell] !== boxIdx && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              const lineNum = firstCol + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...possibleCells],
                  candidates: possibleCells.map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `在第 ${boxIdx + 1} 宫中，所有能填入候选数 ${digit} 的格子都位于第 ${lineNum} 列。因此，可从第 ${lineNum} 列的其他格子中排除候选数 ${digit}（指向区块排除）。`,
                  en: `In box ${boxIdx + 1}, all candidates for ${digit} are locked in column ${lineNum}. Thus, ${digit} can be eliminated from other cells in column ${lineNum} (Pointing).`,
                },
              };
            }
          }
        }
      }

      // 2. Claiming (Row/Col -> Box)
      // Check ROWS
      for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
        const rowCells = ROWS[rowIdx]!;
        const possibleCells: number[] = [];
        for (const cell of rowCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }

        if (possibleCells.length >= 2 && possibleCells.length <= 3) {
          const firstBox = BOX_OF[possibleCells[0]!]!;
          const sameBox = possibleCells.every(c => BOX_OF[c] === firstBox);

          if (sameBox) {
            const eliminations: CellDigit[] = [];
            const boxCells = BOXES[firstBox]!;
            for (const cell of boxCells) {
              if (ROW_OF[cell] !== rowIdx && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              const lineNum = rowIdx + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...possibleCells],
                  candidates: possibleCells.map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `在第 ${lineNum} 行中，所有能填入候选数 ${digit} 的格子都位于第 ${firstBox + 1} 宫。因此，可从第 ${firstBox + 1} 宫的其他格子中排除候选数 ${digit}（占位区块排除）。`,
                  en: `In row ${lineNum}, all candidates for ${digit} are locked in box ${firstBox + 1}. Thus, ${digit} can be eliminated from other cells in box ${firstBox + 1} (Claiming).`,
                },
              };
            }
          }
        }
      }

      // Check COLS
      for (let colIdx = 0; colIdx < 9; colIdx++) {
        const colCells = COLS[colIdx]!;
        const possibleCells: number[] = [];
        for (const cell of colCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }

        if (possibleCells.length >= 2 && possibleCells.length <= 3) {
          const firstBox = BOX_OF[possibleCells[0]!]!;
          const sameBox = possibleCells.every(c => BOX_OF[c] === firstBox);

          if (sameBox) {
            const eliminations: CellDigit[] = [];
            const boxCells = BOXES[firstBox]!;
            for (const cell of boxCells) {
              if (COL_OF[cell] !== colIdx && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              const lineNum = colIdx + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...possibleCells],
                  candidates: possibleCells.map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `在第 ${lineNum} 列中，所有能填入候选数 ${digit} 的格子都位于第 ${firstBox + 1} 宫。因此，可从第 ${firstBox + 1} 宫的其他格子中排除候选数 ${digit}（占位区块排除）。`,
                  en: `In column ${lineNum}, all candidates for ${digit} are locked in box ${firstBox + 1}. Thus, ${digit} can be eliminated from other cells in box ${firstBox + 1} (Claiming).`,
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
