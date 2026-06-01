import type { Strategy } from '../strategy.js';
import { COLS, ROWS, candidateCellsIn, combinations, makeEliminationStep } from './helpers.js';

const fishNames: Record<number, { id: string; zh: string; en: string }> = {
  2: { id: 'x-wing', zh: 'X 翼', en: 'X-Wing' },
  3: { id: 'swordfish', zh: '剑鱼', en: 'Swordfish' },
  4: { id: 'jellyfish', zh: '水母', en: 'Jellyfish' },
};

function positionsInRows(grid: Parameters<Strategy['apply']>[0], digit: number): number[][] {
  return ROWS.map((row) => candidateCellsIn(row, grid, digit).map((cell) => cell % 9));
}

function positionsInCols(grid: Parameters<Strategy['apply']>[0], digit: number): number[][] {
  return COLS.map((col) => candidateCellsIn(col, grid, digit).map((cell) => Math.floor(cell / 9)));
}

export function createFishStrategy(size: 2 | 3 | 4): Strategy {
  const label = fishNames[size]!;
  return {
    id: label.id,
    name: { zh: label.zh, en: label.en },
    difficulty: 40,

    apply(grid) {
      for (let digit = 1; digit <= 9; digit++) {
        const rowPositions = positionsInRows(grid, digit);
        for (const baseRows of combinations([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((row) => rowPositions[row]!.length >= 2 && rowPositions[row]!.length <= size), size)) {
          const coverCols = [...new Set(baseRows.flatMap((row) => rowPositions[row]!))].sort((a, b) => a - b);
          if (coverCols.length !== size) continue;
          const eliminations = [];
          for (const col of coverCols) {
            for (let row = 0; row < 9; row++) {
              if (baseRows.includes(row)) continue;
              const cell = row * 9 + col;
              if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
            }
          }
          if (eliminations.length > 0) {
            const pattern = baseRows.flatMap((row) => rowPositions[row]!.map((col) => row * 9 + col));
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit })),
              eliminations,
              `${digit} 在 ${size} 个基底行中只落入 ${size} 个覆盖列，形成${label.zh}，可从覆盖列其他格删除 ${digit}。`,
              `For ${digit}, ${size} base rows are covered by the same ${size} columns, forming a ${label.en}; remove ${digit} from the other cells in those cover columns.`,
            );
          }
        }

        const colPositions = positionsInCols(grid, digit);
        for (const baseCols of combinations([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((col) => colPositions[col]!.length >= 2 && colPositions[col]!.length <= size), size)) {
          const coverRows = [...new Set(baseCols.flatMap((col) => colPositions[col]!))].sort((a, b) => a - b);
          if (coverRows.length !== size) continue;
          const eliminations = [];
          for (const row of coverRows) {
            for (let col = 0; col < 9; col++) {
              if (baseCols.includes(col)) continue;
              const cell = row * 9 + col;
              if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
            }
          }
          if (eliminations.length > 0) {
            const pattern = baseCols.flatMap((col) => colPositions[col]!.map((row) => row * 9 + col));
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit })),
              eliminations,
              `${digit} 在 ${size} 个基底列中只落入 ${size} 个覆盖行，形成${label.zh}，可从覆盖行其他格删除 ${digit}。`,
              `For ${digit}, ${size} base columns are covered by the same ${size} rows, forming a ${label.en}; remove ${digit} from the other cells in those cover rows.`,
            );
          }
        }
      }
      return null;
    },
  };
}
