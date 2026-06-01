import type { Strategy } from '../strategy.js';
import { BOXES, COL_OF, ROW_OF, candidateCellsIn, makeEliminationStep } from './helpers.js';

export const lockedCandidatesPointing: Strategy = {
  id: 'locked-candidates-pointing',
  name: { zh: '区块排除（指向）', en: 'Locked Candidates (Pointing)' },
  difficulty: 20,

  apply(grid) {
    for (let boxIndex = 0; boxIndex < BOXES.length; boxIndex++) {
      const box = BOXES[boxIndex]!;
      for (let digit = 1; digit <= 9; digit++) {
        const pattern = candidateCellsIn(box, grid, digit);
        if (pattern.length < 2) continue;

        const row = ROW_OF[pattern[0]!]!;
        if (pattern.every((cell) => ROW_OF[cell] === row)) {
          const eliminations = [];
          for (let col = 0; col < 9; col++) {
            const cell = row * 9 + col;
            if (!box.includes(cell) && grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
          }
          if (eliminations.length > 0) {
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit })),
              eliminations,
              `第 ${boxIndex + 1} 宫中 ${digit} 的候选都锁定在第 ${row + 1} 行，可从该行其他格删除 ${digit}（指向）。`,
              `In box ${boxIndex + 1}, all candidates for ${digit} are locked in row ${row + 1}; remove ${digit} from the rest of that row (Pointing).`,
            );
          }
        }

        const col = COL_OF[pattern[0]!]!;
        if (pattern.every((cell) => COL_OF[cell] === col)) {
          const eliminations = [];
          for (let row = 0; row < 9; row++) {
            const cell = row * 9 + col;
            if (!box.includes(cell) && grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
          }
          if (eliminations.length > 0) {
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit })),
              eliminations,
              `第 ${boxIndex + 1} 宫中 ${digit} 的候选都锁定在第 ${col + 1} 列，可从该列其他格删除 ${digit}（指向）。`,
              `In box ${boxIndex + 1}, all candidates for ${digit} are locked in column ${col + 1}; remove ${digit} from the rest of that column (Pointing).`,
            );
          }
        }
      }
    }
    return null;
  },
};
