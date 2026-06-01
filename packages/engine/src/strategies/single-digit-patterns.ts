import { ROWS, COLS, BOXES, CELLS, SIZE, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      const rowsWith2: { index: number; cells: number[] }[] = [];
      const colsWith2: { index: number; cells: number[] }[] = [];
      for (let i = 0; i < 9; i++) {
        const row = ROWS[i]!;
        const rowCands: number[] = [];
        for (const c of row) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) rowCands.push(c);
        }
        if (rowCands.length === 2) rowsWith2.push({ index: i, cells: rowCands });

        const col = COLS[i]!;
        const colCands: number[] = [];
        for (const c of col) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) colCands.push(c);
        }
        if (colCands.length === 2) colsWith2.push({ index: i, cells: colCands });
      }

      const result = findSkyscraperPairs(grid, d, bit, rowsWith2, true);
      if (result) return result;
      const result2 = findSkyscraperPairs(grid, d, bit, colsWith2, false);
      if (result2) return result2;
    }
    return null;
  },
};

function findSkyscraperPairs(
  grid: Grid,
  digit: number,
  bit: number,
  entries: { index: number; cells: number[] }[],
  isRow: boolean,
): Step | null {
  const strongSets = isRow ? ROWS : COLS;
  const perpSets = isRow ? COLS : ROWS;

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!;
      const b = entries[j]!;

      const aCols = a.cells.map((c) => (isRow ? COL_OF[c]! : ROW_OF[c]!));
      const bCols = b.cells.map((c) => (isRow ? COL_OF[c]! : ROW_OF[c]!));

      if (aCols[0] === bCols[0] && aCols[1] === bCols[1]) continue;
      if (aCols[0] === bCols[1] && aCols[1] === bCols[0]) continue;

      if (aCols[0] === bCols[0]) {
        const eliminations = removeCellsSeeingBoth(grid, bit, digit, a.cells[1]!, b.cells[1]!);
        if (eliminations.length > 0) {
          const r = ROW_OF[a.cells[1]!]! + 1;
          const c = COL_OF[a.cells[1]!]! + 1;
          return {
            strategyId: 'skyscraper',
            placements: [],
            eliminations,
            highlights: {
              cells: [a.cells[0]!, a.cells[1]!, b.cells[0]!, b.cells[1]!],
              candidates: [a.cells[0]!, a.cells[1]!, b.cells[0]!, b.cells[1]!].map((cell) => ({ cell, digit })),
              links: [],
            },
            explanation: {
              zh: `数字 ${digit} 在${isRow ? '行' : '列'} ${a.index + 1} 和 ${b.index + 1} 构成摩天楼，共用的${isRow ? '列' : '行'} ${aCols[0]! + 1} 处为弱链，两端 R${r}C${c} 可见的格中可排除 ${digit}。`,
              en: `Digit ${digit} forms a Skyscraper on ${isRow ? 'rows' : 'cols'} ${a.index + 1} and ${b.index + 1}, eliminating ${digit} from cells seeing both endpoints.`,
            },
          };
        }
      }
      if (aCols[1] === bCols[1]) {
        const eliminations = removeCellsSeeingBoth(grid, bit, digit, a.cells[0]!, b.cells[0]!);
        if (eliminations.length > 0) {
          const r = ROW_OF[a.cells[0]!]! + 1;
          const c = COL_OF[a.cells[0]!]! + 1;
          return {
            strategyId: 'skyscraper',
            placements: [],
            eliminations,
            highlights: {
              cells: [a.cells[0]!, a.cells[1]!, b.cells[0]!, b.cells[1]!],
              candidates: [a.cells[0]!, a.cells[1]!, b.cells[0]!, b.cells[1]!].map((cell) => ({ cell, digit })),
              links: [],
            },
            explanation: {
              zh: `数字 ${digit} 在${isRow ? '行' : '列'} ${a.index + 1} 和 ${b.index + 1} 构成摩天楼，共用的${isRow ? '列' : '行'} ${aCols[1]! + 1} 处为弱链，两端 R${r}C${c} 可见的格中可排除 ${digit}。`,
              en: `Digit ${digit} forms a Skyscraper on ${isRow ? 'rows' : 'cols'} ${a.index + 1} and ${b.index + 1}, eliminating ${digit} from cells seeing both endpoints.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function removeCellsSeeingBoth(grid: Grid, bit: number, digit: number, c1: number, c2: number): { cell: number; digit: number }[] {
  const elims: { cell: number; digit: number }[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (!(grid.candidatesOf(cell) & bit)) continue;
    if (cell === c1 || cell === c2) continue;
    if (cellsSee(c1, cell) && cellsSee(c2, cell)) {
      elims.push({ cell, digit });
    }
  }
  return elims;
}

function cellsSee(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      for (let bi = 0; bi < 9; bi++) {
        const box = BOXES[bi]!;
        const boxCands: number[] = [];
        for (const c of box) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) boxCands.push(c);
        }
        if (boxCands.length < 2) continue;

        for (let i = 0; i < boxCands.length; i++) {
          for (let j = i + 1; j < boxCands.length; j++) {
            const a = boxCands[i]!;
            const b = boxCands[j]!;
            const ar = ROW_OF[a]!;
            const ac = COL_OF[a]!;
            const br = ROW_OF[b]!;
            const bc = COL_OF[b]!;
            if (ar === br || ac === bc) continue;

            const rowCells = ROWS[ar]!;
            const rowCands: number[] = [];
            for (const c of rowCells) {
              if (grid.get(c) !== 0 || BOX_OF[c] === bi) continue;
              if (grid.candidatesOf(c) & bit) rowCands.push(c);
            }
            if (rowCands.length !== 1) continue;

            const colCells = COLS[bc]!;
            const colCands: number[] = [];
            for (const c of colCells) {
              if (grid.get(c) !== 0 || BOX_OF[c] === bi) continue;
              if (grid.candidatesOf(c) & bit) colCands.push(c);
            }
            if (colCands.length !== 1) continue;

            const rowEnd = rowCands[0]!;
            const colEnd = colCands[0]!;
            if (ROW_OF[rowEnd] === ROW_OF[colEnd] || COL_OF[rowEnd] === COL_OF[colEnd] || cellsSee(rowEnd, colEnd)) {
              const elims: { cell: number; digit: number }[] = [];
              for (let cell = 0; cell < CELLS; cell++) {
                if (grid.get(cell) !== 0) continue;
                if (!(grid.candidatesOf(cell) & bit)) continue;
                if (cell === a || cell === b || cell === rowEnd || cell === colEnd) continue;
                if (cellsSee(cell, rowEnd) && cellsSee(cell, colEnd)) {
                  elims.push({ cell, digit: d });
                }
              }
              if (elims.length > 0) {
                return {
                  strategyId: 'two-string-kite',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [a, b, rowEnd, colEnd],
                    candidates: [a, b, rowEnd, colEnd].map((cell) => ({ cell, digit: d })),
                    links: [],
                  },
                  explanation: {
                    zh: `数字 ${d} 在宫 ${bi + 1} 中的候选沿行 R${ar + 1}C${ac + 1}→R${ar + 1}C${COL_OF[rowEnd]! + 1} 和列 R${br + 1}C${bc + 1}→R${ROW_OF[colEnd]! + 1}C${bc + 1} 构成双线风筝，可排除两端共同可见格中的 ${d}。`,
                    en: `Digit ${d} forms a 2-String Kite in box ${bi + 1}, eliminating ${d} from cells seeing both endpoints.`,
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

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      for (let bi = 0; bi < 9; bi++) {
        const box = BOXES[bi]!;
        const boxCands: number[] = [];
        const rowsInBox = new Set<number>();
        const colsInBox = new Set<number>();
        for (const c of box) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) {
            boxCands.push(c);
            rowsInBox.add(ROW_OF[c]!);
            colsInBox.add(COL_OF[c]!);
          }
        }
        if (boxCands.length < 2) continue;
        if (rowsInBox.size === 1 || colsInBox.size === 1) continue;
        if (rowsInBox.size === 3 && colsInBox.size === 3) continue;

        const rowsArr = [...rowsInBox];
        const colsArr = [...colsInBox];

        for (const rr of rowsArr) {
          for (const cc of colsArr) {
            const cellInBox = rr * 9 + cc;
            const inBox = box.includes(cellInBox);
            if (!inBox) continue;
            if (grid.get(cellInBox) !== 0) continue;
            if (!(grid.candidatesOf(cellInBox) & bit)) {
              const rowCells = ROWS[rr]!;
              const rowEnds: number[] = [];
              for (const c of rowCells) {
                if (grid.get(c) !== 0 || BOX_OF[c] === bi) continue;
                if (grid.candidatesOf(c) & bit) rowEnds.push(c);
              }
              if (rowEnds.length !== 1) continue;

              const colCells = COLS[cc]!;
              const colEnds: number[] = [];
              for (const c of colCells) {
                if (grid.get(c) !== 0 || BOX_OF[c] === bi) continue;
                if (grid.candidatesOf(c) & bit) colEnds.push(c);
              }
              if (colEnds.length !== 1) continue;

              const rowEnd = rowEnds[0]!;
              const colEnd = colEnds[0]!;
              if (!cellsSee(rowEnd, colEnd)) continue;

              const elims: { cell: number; digit: number }[] = [];
              for (let cell = 0; cell < CELLS; cell++) {
                if (grid.get(cell) !== 0) continue;
                if (!(grid.candidatesOf(cell) & bit)) continue;
                if (cell === cellInBox || cell === rowEnd || cell === colEnd) continue;
                if (cellsSee(cell, rowEnd) && cellsSee(cell, colEnd)) {
                  elims.push({ cell, digit: d });
                }
              }
              if (elims.length > 0) {
                return {
                  strategyId: 'empty-rectangle',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...boxCands, rowEnd, colEnd],
                    candidates: [...boxCands, rowEnd, colEnd].map((cell) => ({ cell, digit: d })),
                    links: [],
                  },
                  explanation: {
                    zh: `数字 ${d} 在宫 ${bi + 1} 中形成空矩形，结合行 R${rr + 1} 和列 R${ROW_OF[colEnd]! + 1}C${cc + 1} 构成单链，从两端共同可见格中排除 ${d}。`,
                    en: `Digit ${d} forms an Empty Rectangle in box ${bi + 1}, eliminating ${d} from cells seeing both endpoints outside the box.`,
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