import { BOXES, BOX_OF, COLS, ROWS, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, candidatesFor, createEliminationStep, uniqueSorted } from './utils.js';

export const claiming: Strategy = {
  id: 'claiming',
  name: { zh: '声明/占位排除', en: 'Claiming' },
  difficulty: 20,
  apply(grid: Grid): Step | null {
    const lines = [...ROWS, ...COLS];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      for (let digit = 1; digit <= SIZE; digit++) {
        const positions = candidateCells(grid, line, digit);
        if (positions.length < 2) continue;
        const boxes = uniqueSorted(positions.map((cell) => BOX_OF[cell]!));
        if (boxes.length !== 1) continue;
        const box = boxes[0]!;
        const eliminations = BOXES[box]!.filter((cell) => !line.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
        if (eliminations.length === 0) continue;
        const lineName = lineIndex < 9 ? `第 ${lineIndex + 1} 行` : `第 ${lineIndex - 8} 列`;
        const lineNameEn = lineIndex < 9 ? `row ${lineIndex + 1}` : `column ${lineIndex - 8}`;
        return createEliminationStep({ strategy: this, cells: positions, candidates: candidatesFor(positions, digit), eliminations, zh: `${lineName} 中数字 ${digit} 的候选都落在第 ${box + 1} 宫，可从该宫同行/列外删除 ${digit}（声明/占位排除）。`, en: `In ${lineNameEn}, all candidates for ${digit} lie in box ${box + 1}, so ${digit} can be removed from the rest of that box (Claiming).` });
      }
    }
    return null;
  },
};
