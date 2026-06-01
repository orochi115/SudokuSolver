import { BOXES, COL_OF, COLS, ROW_OF, ROWS, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, candidatesFor, createEliminationStep, uniqueSorted } from './utils.js';

export const pointing: Strategy = {
  id: 'pointing',
  name: { zh: '指向数对/三数组', en: 'Pointing Pair/Triple' },
  difficulty: 20,
  apply(grid: Grid): Step | null {
    for (let box = 0; box < BOXES.length; box++) {
      const boxCells = BOXES[box]!;
      for (let digit = 1; digit <= SIZE; digit++) {
        const positions = candidateCells(grid, boxCells, digit);
        if (positions.length < 2) continue;
        const rows = uniqueSorted(positions.map((cell) => ROW_OF[cell]!));
        const cols = uniqueSorted(positions.map((cell) => COL_OF[cell]!));
        if (rows.length === 1) {
          const eliminations = ROWS[rows[0]!]!.filter((cell) => !boxCells.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) {
            return createEliminationStep({ strategy: this, cells: positions, candidates: candidatesFor(positions, digit), eliminations, zh: `第 ${box + 1} 宫中数字 ${digit} 的候选都锁定在同一行，可从该行宫外删除 ${digit}（指向）。`, en: `In box ${box + 1}, all candidates for ${digit} are locked in one row, so ${digit} can be removed from that row outside the box (Pointing).` });
          }
        }
        if (cols.length === 1) {
          const eliminations = COLS[cols[0]!]!.filter((cell) => !boxCells.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) {
            return createEliminationStep({ strategy: this, cells: positions, candidates: candidatesFor(positions, digit), eliminations, zh: `第 ${box + 1} 宫中数字 ${digit} 的候选都锁定在同一列，可从该列宫外删除 ${digit}（指向）。`, en: `In box ${box + 1}, all candidates for ${digit} are locked in one column, so ${digit} can be removed from that column outside the box (Pointing).` });
          }
        }
      }
    }
    return null;
  },
};
