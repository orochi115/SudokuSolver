import type { Strategy } from '../strategy.js';
import { COLS, ROWS, candidateCellsIn, commonPeers, makeEliminationStep, sameBox } from './helpers.js';

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 50,

  apply(grid) {
    for (let digit = 1; digit <= 9; digit++) {
      for (const row of ROWS) {
        const rowCells = candidateCellsIn(row, grid, digit);
        if (rowCells.length !== 2) continue;
        for (const col of COLS) {
          const colCells = candidateCellsIn(col, grid, digit);
          if (colCells.length !== 2) continue;
          for (const rowBoxCell of rowCells) {
            for (const colBoxCell of colCells) {
              if (rowBoxCell === colBoxCell) continue;
              if (!sameBox(rowBoxCell, colBoxCell)) continue;
              const rowEnd = rowCells.find((cell) => cell !== rowBoxCell)!;
              const colEnd = colCells.find((cell) => cell !== colBoxCell)!;
              const pattern = [rowBoxCell, rowEnd, colBoxCell, colEnd];
              const eliminations = commonPeers([rowEnd, colEnd]).filter((cell) => !pattern.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
              if (eliminations.length === 0) continue;
              return makeEliminationStep(
                this.id,
                pattern,
                pattern.map((cell) => ({ cell, digit })),
                eliminations,
                `${digit} 的一个行共轭和一个列共轭在同一宫相连，形成双线风筝，可删除同时看到两个外端的 ${digit}。`,
                `A row conjugate and a column conjugate for ${digit} connect through one box, forming a 2-String Kite; remove ${digit} from cells seeing both outer ends.`,
              );
            }
          }
        }
      }
    }
    return null;
  },
};
