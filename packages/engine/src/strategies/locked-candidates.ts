import { BOXES, COLS, ROWS, BOX_OF, COL_OF, ROW_OF } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, cellName } from './common.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (let box = 0; box < BOXES.length; box++) {
        const cells = candidateCells(grid, BOXES[box]!, digit);
        if (cells.length < 2) continue;

        const row = ROW_OF[cells[0]!]!;
        if (cells.every((cell) => ROW_OF[cell] === row)) {
          const eliminations = ROWS[row]!
            .filter((cell) => BOX_OF[cell] !== box && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) return lockedStep(this.id, digit, cells, eliminations, 'pointing');
        }

        const col = COL_OF[cells[0]!]!;
        if (cells.every((cell) => COL_OF[cell] === col)) {
          const eliminations = COLS[col]!
            .filter((cell) => BOX_OF[cell] !== box && grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length > 0) return lockedStep(this.id, digit, cells, eliminations, 'pointing');
        }
      }

      for (let row = 0; row < ROWS.length; row++) {
        const cells = candidateCells(grid, ROWS[row]!, digit);
        if (cells.length < 2) continue;
        const box = BOX_OF[cells[0]!]!;
        if (!cells.every((cell) => BOX_OF[cell] === box)) continue;
        const eliminations = BOXES[box]!
          .filter((cell) => ROW_OF[cell] !== row && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) return lockedStep(this.id, digit, cells, eliminations, 'claiming');
      }

      for (let col = 0; col < COLS.length; col++) {
        const cells = candidateCells(grid, COLS[col]!, digit);
        if (cells.length < 2) continue;
        const box = BOX_OF[cells[0]!]!;
        if (!cells.every((cell) => BOX_OF[cell] === box)) continue;
        const eliminations = BOXES[box]!
          .filter((cell) => COL_OF[cell] !== col && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) return lockedStep(this.id, digit, cells, eliminations, 'claiming');
      }
    }
    return null;
  },
};

function lockedStep(strategyId: string, digit: number, patternCells: number[], eliminations: Array<{ cell: number; digit: number }>, variant: 'pointing' | 'claiming'): Step {
  const zhVariant = variant === 'pointing' ? '指向数对/三数组' : '声明/占位排除';
  const enVariant = variant === 'pointing' ? 'Pointing Pair/Triple' : 'Claiming';
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: { cells: patternCells, candidates: patternCells.map((cell) => ({ cell, digit })), links: [] },
    explanation: {
      zh: `${patternCells.map(cellName).join('、')} 将候选数 ${digit} 锁定在交叉区域，可从其它相关格删除 ${digit}（${zhVariant}）。`,
      en: `${patternCells.map(cellName).join(', ')} lock candidate ${digit} into the intersection, so ${digit} can be removed elsewhere (${enVariant}).`,
    },
  };
}
