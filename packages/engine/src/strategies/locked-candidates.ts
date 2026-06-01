import type { Strategy } from '../strategy.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import {
  BOXES,
  COL_OF,
  DIGITS,
  ROW_OF,
  candidatesInHouse,
  uniqueCells,
} from './_utils.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let boxIndex = 0; boxIndex < BOXES.length; boxIndex++) {
      const box = BOXES[boxIndex]!;
      for (const digit of DIGITS) {
        const inBox = candidatesInHouse(grid, box, digit);
        if (inBox.length < 2) continue;

        const rows = [...new Set(inBox.map((c) => ROW_OF[c]!))];
        const cols = [...new Set(inBox.map((c) => COL_OF[c]!))];

        if (rows.length === 1) {
          const row = rows[0]!;
          const eliminations = Array.from({ length: 9 }, (_, c) => row * 9 + c)
            .filter((cell) => !box.includes(cell) && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueCells([...inBox, ...eliminations.map((e) => e.cell)]),
                candidates: [
                  ...inBox.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `B${boxIndex + 1} 内数字 ${digit} 只出现在第 ${row + 1} 行（Pointing），所以该行宫外候选 ${digit} 可删除。`,
                en: `In B${boxIndex + 1}, digit ${digit} is confined to row ${row + 1} (Pointing), so eliminate ${digit} from that row outside the box.`,
              },
            };
          }
        }

        if (cols.length === 1) {
          const col = cols[0]!;
          const eliminations = Array.from({ length: 9 }, (_, r) => r * 9 + col)
            .filter((cell) => !box.includes(cell) && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueCells([...inBox, ...eliminations.map((e) => e.cell)]),
                candidates: [
                  ...inBox.map((cell) => ({ cell, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `B${boxIndex + 1} 内数字 ${digit} 只出现在第 ${col + 1} 列（Pointing），所以该列宫外候选 ${digit} 可删除。`,
                en: `In B${boxIndex + 1}, digit ${digit} is confined to column ${col + 1} (Pointing), so eliminate ${digit} from that column outside the box.`,
              },
            };
          }
        }
      }
    }

    for (const digit of DIGITS) {
      for (let row = 0; row < 9; row++) {
        const rowCells = Array.from({ length: 9 }, (_, c) => row * 9 + c);
        const inRow = rowCells.filter((cell) => grid.hasCandidate(cell, digit));
        if (inRow.length < 2) continue;
        const boxes = [...new Set(inRow.map((cell) => Math.floor(ROW_OF[cell]! / 3) * 3 + Math.floor(COL_OF[cell]! / 3)))];
        if (boxes.length !== 1) continue;
        const boxIndex = boxes[0]!;
        const eliminations = BOXES[boxIndex]!
          .filter((cell) => ROW_OF[cell] !== row && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([...inRow, ...eliminations.map((e) => e.cell)]),
              candidates: [
                ...inRow.map((cell) => ({ cell, digit })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `第 ${row + 1} 行里的数字 ${digit} 候选全部落在 B${boxIndex + 1}（Claiming），所以该宫其余格可删去 ${digit}。`,
              en: `In row ${row + 1}, all candidates for digit ${digit} are inside B${boxIndex + 1} (Claiming), so remove ${digit} from the rest of that box.`,
            },
          };
        }
      }

      for (let col = 0; col < 9; col++) {
        const colCells = Array.from({ length: 9 }, (_, r) => r * 9 + col);
        const inCol = colCells.filter((cell) => grid.hasCandidate(cell, digit));
        if (inCol.length < 2) continue;
        const boxes = [...new Set(inCol.map((cell) => Math.floor(ROW_OF[cell]! / 3) * 3 + Math.floor(COL_OF[cell]! / 3)))];
        if (boxes.length !== 1) continue;
        const boxIndex = boxes[0]!;
        const eliminations = BOXES[boxIndex]!
          .filter((cell) => COL_OF[cell] !== col && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([...inCol, ...eliminations.map((e) => e.cell)]),
              candidates: [
                ...inCol.map((cell) => ({ cell, digit })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `第 ${col + 1} 列里的数字 ${digit} 候选全部落在 B${boxIndex + 1}（Claiming），所以该宫其余格可删去 ${digit}。`,
              en: `In column ${col + 1}, all candidates for digit ${digit} are inside B${boxIndex + 1} (Claiming), so remove ${digit} from the rest of that box.`,
            },
          };
        }
      }
    }

    return null;
  },
};
