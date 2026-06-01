import type { Strategy } from '../strategy.js';
import { BOXES, COLS, ROWS, candidateCellsIn, commonPeers, makeEliminationStep } from './helpers.js';

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 50,

  apply(grid) {
    for (let digit = 1; digit <= 9; digit++) {
      for (let boxIndex = 0; boxIndex < BOXES.length; boxIndex++) {
        const boxCells = candidateCellsIn(BOXES[boxIndex]!, grid, digit);
        if (boxCells.length < 2) continue;
        for (const row of ROWS) {
          const rowInBox = boxCells.filter((cell) => row.includes(cell));
          if (rowInBox.length === 0) continue;
          const rowAll = candidateCellsIn(row, grid, digit);
          if (rowAll.length !== 2) continue;
          const rowEnd = rowAll.find((cell) => !BOXES[boxIndex]!.includes(cell));
          if (rowEnd === undefined) continue;
          for (const col of COLS) {
            const colInBox = boxCells.filter((cell) => col.includes(cell));
            if (colInBox.length === 0) continue;
            if (!boxCells.every((cell) => row.includes(cell) || col.includes(cell))) continue;
            const colAll = candidateCellsIn(col, grid, digit);
            if (colAll.length !== 2) continue;
            const colEnd = colAll.find((cell) => !BOXES[boxIndex]!.includes(cell));
            if (colEnd === undefined) continue;
            const pattern = [...boxCells, rowEnd, colEnd];
            const eliminations = commonPeers([rowEnd, colEnd]).filter((cell) => !pattern.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
            if (eliminations.length === 0) continue;
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit })),
              eliminations,
              `${digit} 在一个宫内形成空矩形，并与行、列共轭相连，可删除同时看到两个外端的 ${digit}。`,
              `The ${digit} candidates form an Empty Rectangle in one box connected to row and column conjugates; remove ${digit} from cells seeing both outer ends.`,
            );
          }
        }
      }
    }
    return null;
  },
};
