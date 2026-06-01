import type { Strategy } from '../strategy.js';
import { BOXES, BOX_OF, COLS, ROWS, candidateCellsIn, makeEliminationStep } from './helpers.js';

export const lockedCandidatesClaiming: Strategy = {
  id: 'locked-candidates-claiming',
  name: { zh: '区块排除（占位）', en: 'Locked Candidates (Claiming)' },
  difficulty: 20,

  apply(grid) {
    const lines = [...ROWS, ...COLS];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      const isRow = lineIndex < 9;
      for (let digit = 1; digit <= 9; digit++) {
        const pattern = candidateCellsIn(line, grid, digit);
        if (pattern.length < 2) continue;
        const boxIndex = BOX_OF[pattern[0]!]!;
        if (!pattern.every((cell) => BOX_OF[cell] === boxIndex)) continue;
        const box = BOXES[boxIndex]!;
        const eliminations = box
          .filter((cell) => !line.includes(cell) && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length === 0) continue;
        return makeEliminationStep(
          this.id,
          pattern,
          pattern.map((cell) => ({ cell, digit })),
          eliminations,
          `${isRow ? `第 ${lineIndex + 1} 行` : `第 ${lineIndex - 8} 列`} 中 ${digit} 的候选都落在第 ${boxIndex + 1} 宫，可从该宫其他格删除 ${digit}（占位）。`,
          `In ${isRow ? `row ${lineIndex + 1}` : `column ${lineIndex - 8}`}, all candidates for ${digit} lie in box ${boxIndex + 1}; remove ${digit} from the rest of that box (Claiming).`,
        );
      }
    }
    return null;
  },
};
