import { ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function houseTypeName(h: number): string {
  if (h < 9) return '行';
  if (h < 18) return '列';
  return '宫';
}

function houseTypeNameEn(h: number): string {
  if (h < 9) return 'row';
  if (h < 18) return 'column';
  return 'box';
}

function houseIndex(h: number): number {
  if (h < 9) return h + 1;
  if (h < 18) return h - 9 + 1;
  return h - 18 + 1;
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      for (let bi = 0; bi < 9; bi++) {
        const boxCells = BOXES[bi]!;
        const boxCandidates: number[] = [];
        for (const c of boxCells) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            boxCandidates.push(c);
          }
        }
        if (boxCandidates.length < 2 || boxCandidates.length > 3) continue;

        const rowsInBox = new Set(boxCandidates.map(c => ROW_OF[c]!));
        const colsInBox = new Set(boxCandidates.map(c => COL_OF[c]!));

        if (rowsInBox.size === 1) {
          const ri = rowsInBox.values().next().value!;
          const lineCells = ROWS[ri]!;
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of lineCells) {
            if (BOX_OF[c]! !== bi && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...boxCandidates, ...eliminations.map(e => e.cell)],
                candidates: [
                  ...boxCandidates.map(c => ({ cell: c, digit: d })),
                  ...eliminations.map(e => ({ cell: e.cell, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `宫 ${bi + 1} 中数字 ${d} 的候选全部位于行 ${ri + 1}，因此行 ${ri + 1} 其余位置的 ${d} 可被排除（指向）。`,
                en: `In box ${bi + 1}, digit ${d} candidates are all in row ${ri + 1}, so ${d} can be removed from the rest of row ${ri + 1} (Pointing).`,
              },
            };
          }
        }

        if (colsInBox.size === 1) {
          const ci = colsInBox.values().next().value!;
          const lineCells = COLS[ci]!;
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of lineCells) {
            if (BOX_OF[c]! !== bi && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...boxCandidates, ...eliminations.map(e => e.cell)],
                candidates: [
                  ...boxCandidates.map(c => ({ cell: c, digit: d })),
                  ...eliminations.map(e => ({ cell: e.cell, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `宫 ${bi + 1} 中数字 ${d} 的候选全部位于列 ${ci + 1}，因此列 ${ci + 1} 其余位置的 ${d} 可被排除（指向）。`,
                en: `In box ${bi + 1}, digit ${d} candidates are all in column ${ci + 1}, so ${d} can be removed from the rest of column ${ci + 1} (Pointing).`,
              },
            };
          }
        }
      }

      for (let ri = 0; ri < 9; ri++) {
        const rowCells = ROWS[ri]!;
        const rowCandidates: number[] = [];
        for (const c of rowCells) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            rowCandidates.push(c);
          }
        }
        if (rowCandidates.length < 2 || rowCandidates.length > 3) continue;

        const boxesInRow = new Set(rowCandidates.map(c => BOX_OF[c]!));
        if (boxesInRow.size === 1) {
          const bi = boxesInRow.values().next().value!;
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of BOXES[bi]!) {
            if (ROW_OF[c]! !== ri && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...rowCandidates, ...eliminations.map(e => e.cell)],
                candidates: [
                  ...rowCandidates.map(c => ({ cell: c, digit: d })),
                  ...eliminations.map(e => ({ cell: e.cell, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `行 ${ri + 1} 中数字 ${d} 的候选全部位于宫 ${bi + 1}，因此宫 ${bi + 1} 其余位置的 ${d} 可被排除（声明）。`,
                en: `In row ${ri + 1}, digit ${d} candidates are all in box ${bi + 1}, so ${d} can be removed from the rest of box ${bi + 1} (Claiming).`,
              },
            };
          }
        }
      }

      for (let ci = 0; ci < 9; ci++) {
        const colCells = COLS[ci]!;
        const colCandidates: number[] = [];
        for (const c of colCells) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            colCandidates.push(c);
          }
        }
        if (colCandidates.length < 2 || colCandidates.length > 3) continue;

        const boxesInCol = new Set(colCandidates.map(c => BOX_OF[c]!));
        if (boxesInCol.size === 1) {
          const bi = boxesInCol.values().next().value!;
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of BOXES[bi]!) {
            if (COL_OF[c]! !== ci && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...colCandidates, ...eliminations.map(e => e.cell)],
                candidates: [
                  ...colCandidates.map(c => ({ cell: c, digit: d })),
                  ...eliminations.map(e => ({ cell: e.cell, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `列 ${ci + 1} 中数字 ${d} 的候选全部位于宫 ${bi + 1}，因此宫 ${bi + 1} 其余位置的 ${d} 可被排除（声明）。`,
                en: `In column ${ci + 1}, digit ${d} candidates are all in box ${bi + 1}, so ${d} can be removed from the rest of box ${bi + 1} (Claiming).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};