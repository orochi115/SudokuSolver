/**
 * Locked Candidates (T2) — 区块排除.
 *
 * Pointing: all candidates for a digit in a box lie on one row/column.
 * Claiming: all candidates for a digit in a row/column lie in one box.
 */

import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function makeStep(
  digit: number,
  sourceCells: number[],
  eliminationCells: number[],
  explanation: { zh: string; en: string },
): Step {
  return {
    strategyId: 'locked-candidates',
    placements: [],
    eliminations: eliminationCells.map((cell) => ({ cell, digit })),
    highlights: {
      cells: [...sourceCells, ...eliminationCells],
      candidates: [...sourceCells, ...eliminationCells].map((cell) => ({ cell, digit })),
      links: [],
    },
    explanation,
  };
}

function betterStep(next: Step, current: Step | null): Step {
  if (!current) return next;
  const nextDigit = next.eliminations[0]!.digit;
  const currentDigit = current.eliminations[0]!.digit;
  if (nextDigit !== currentDigit) return nextDigit < currentDigit ? next : current;
  const nextCell = next.eliminations[0]!.cell;
  const currentCell = current.eliminations[0]!.cell;
  return nextCell < currentCell ? next : current;
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    let best: Step | null = null;

    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const box = BOXES[boxIndex]!;

      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const cells = box.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        if (cells.length < 2) continue;

        const rows = new Set(cells.map((cell) => ROW_OF[cell]!));
        if (rows.size === 1) {
          const rowIndex = rows.values().next().value as number;
          const eliminations = ROWS[rowIndex]!.filter(
            (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && BOX_OF[cell] !== boxIndex,
          );
          if (eliminations.length > 0) {
            const source = cells.map(cellLabel).join(', ');
            best = betterStep(makeStep(digit, cells, eliminations, {
              zh: `宫 B${boxIndex + 1} 中，数字 ${digit} 的候选数（${source}）都在第 ${rowIndex + 1} 行，可以消除该行其他格中的 ${digit}（指向排除）。`,
              en: `In box B${boxIndex + 1}, all candidates for ${digit} (${source}) lie in row R${rowIndex + 1}, so ${digit} can be eliminated from that row outside the box (Pointing).`,
            }), best);
          }
        }

        const cols = new Set(cells.map((cell) => COL_OF[cell]!));
        if (cols.size === 1) {
          const colIndex = cols.values().next().value as number;
          const eliminations = COLS[colIndex]!.filter(
            (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && BOX_OF[cell] !== boxIndex,
          );
          if (eliminations.length > 0) {
            const source = cells.map(cellLabel).join(', ');
            best = betterStep(makeStep(digit, cells, eliminations, {
              zh: `宫 B${boxIndex + 1} 中，数字 ${digit} 的候选数（${source}）都在第 ${colIndex + 1} 列，可以消除该列其他格中的 ${digit}（指向排除）。`,
              en: `In box B${boxIndex + 1}, all candidates for ${digit} (${source}) lie in column C${colIndex + 1}, so ${digit} can be eliminated from that column outside the box (Pointing).`,
            }), best);
          }
        }
      }
    }

    for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
      const row = ROWS[rowIndex]!;
      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const cells = row.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
        if (boxes.size !== 1) continue;
        const boxIndex = boxes.values().next().value as number;
        const eliminations = BOXES[boxIndex]!.filter(
          (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && ROW_OF[cell] !== rowIndex,
        );
        if (eliminations.length === 0) continue;
        const source = cells.map(cellLabel).join(', ');
        best = betterStep(makeStep(digit, cells, eliminations, {
          zh: `第 ${rowIndex + 1} 行中，数字 ${digit} 的候选数（${source}）都在宫 B${boxIndex + 1}，可以消除该宫其他格中的 ${digit}（声明排除）。`,
          en: `In row R${rowIndex + 1}, all candidates for ${digit} (${source}) are in box B${boxIndex + 1}, so ${digit} can be eliminated from the rest of that box (Claiming).`,
        }), best);
      }
    }

    for (let colIndex = 0; colIndex < 9; colIndex++) {
      const col = COLS[colIndex]!;
      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const cells = col.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        if (cells.length < 2) continue;
        const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
        if (boxes.size !== 1) continue;
        const boxIndex = boxes.values().next().value as number;
        const eliminations = BOXES[boxIndex]!.filter(
          (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && COL_OF[cell] !== colIndex,
        );
        if (eliminations.length === 0) continue;
        const source = cells.map(cellLabel).join(', ');
        best = betterStep(makeStep(digit, cells, eliminations, {
          zh: `第 ${colIndex + 1} 列中，数字 ${digit} 的候选数（${source}）都在宫 B${boxIndex + 1}，可以消除该宫其他格中的 ${digit}（声明排除）。`,
          en: `In column C${colIndex + 1}, all candidates for ${digit} (${source}) are in box B${boxIndex + 1}, so ${digit} can be eliminated from the rest of that box (Claiming).`,
        }), best);
      }
    }

    return best;
  },
};
