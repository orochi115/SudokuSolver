import { BOXES, COLS, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { boxIndexOf, cellName, colIndexOf, rowIndexOf } from './_common.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    const pointing = findPointing(grid, this.id);
    if (pointing) return pointing;
    return findClaiming(grid, this.id);
  },
};

function findPointing(grid: Grid, strategyId: string): Step | null {
  for (let box = 0; box < 9; box++) {
    const boxCells = BOXES[box]!;
    for (let digit = 1; digit <= 9; digit++) {
      const cands = boxCells.filter((cell) => grid.hasCandidate(cell, digit));
      if (cands.length < 2) continue;

      const rows = [...new Set(cands.map((c) => rowIndexOf(c)))];
      if (rows.length === 1) {
        const row = rows[0]!;
        const eliminations = ROWS[row]!
          .filter((cell) => boxIndexOf(cell) !== box && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) {
          const line = `R${row + 1}`;
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: { cells: cands, candidates: cands.map((cell) => ({ cell, digit })), links: [] },
            explanation: {
              zh: `数字 ${digit} 在 B${box + 1} 只出现在 ${line}，因此可从同一行其它宫删除 ${digit}（Locked Candidates: Pointing）。`,
              en: `Digit ${digit} in B${box + 1} is confined to ${line}, so remove ${digit} from the rest of that row outside the box (Locked Candidates: Pointing).`,
            },
          };
        }
      }

      const cols = [...new Set(cands.map((c) => colIndexOf(c)))];
      if (cols.length === 1) {
        const col = cols[0]!;
        const eliminations = COLS[col]!
          .filter((cell) => boxIndexOf(cell) !== box && grid.hasCandidate(cell, digit))
          .map((cell) => ({ cell, digit }));
        if (eliminations.length > 0) {
          const line = `C${col + 1}`;
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: { cells: cands, candidates: cands.map((cell) => ({ cell, digit })), links: [] },
            explanation: {
              zh: `数字 ${digit} 在 B${box + 1} 只出现在 ${line}，因此可从同一列其它宫删除 ${digit}（Locked Candidates: Pointing）。`,
              en: `Digit ${digit} in B${box + 1} is confined to ${line}, so remove ${digit} from the rest of that column outside the box (Locked Candidates: Pointing).`,
            },
          };
        }
      }
    }
  }
  return null;
}

function findClaiming(grid: Grid, strategyId: string): Step | null {
  for (let row = 0; row < 9; row++) {
    const rowCells = ROWS[row]!;
    for (let digit = 1; digit <= 9; digit++) {
      const cands = rowCells.filter((cell) => grid.hasCandidate(cell, digit));
      if (cands.length < 2) continue;
      const boxes = [...new Set(cands.map((cell) => boxIndexOf(cell)))];
      if (boxes.length !== 1) continue;

      const box = boxes[0]!;
      const eliminations = BOXES[box]!
        .filter((cell) => rowIndexOf(cell) !== row && grid.hasCandidate(cell, digit))
        .map((cell) => ({ cell, digit }));
      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: { cells: cands, candidates: cands.map((cell) => ({ cell, digit })), links: [] },
        explanation: {
          zh: `在 R${row + 1} 中，数字 ${digit} 的候选全部落在 B${box + 1}，因此可从该宫其它格删除 ${digit}（Locked Candidates: Claiming）。`,
          en: `In R${row + 1}, all candidates for digit ${digit} are inside B${box + 1}, so remove ${digit} from other cells in that box (Locked Candidates: Claiming).`,
        },
      };
    }
  }

  for (let col = 0; col < 9; col++) {
    const colCells = COLS[col]!;
    for (let digit = 1; digit <= 9; digit++) {
      const cands = colCells.filter((cell) => grid.hasCandidate(cell, digit));
      if (cands.length < 2) continue;
      const boxes = [...new Set(cands.map((cell) => boxIndexOf(cell)))];
      if (boxes.length !== 1) continue;

      const box = boxes[0]!;
      const eliminations = BOXES[box]!
        .filter((cell) => colIndexOf(cell) !== col && grid.hasCandidate(cell, digit))
        .map((cell) => ({ cell, digit }));
      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: { cells: cands, candidates: cands.map((cell) => ({ cell, digit })), links: [] },
        explanation: {
          zh: `在 C${col + 1} 中，数字 ${digit} 的候选全部落在 B${box + 1}，因此可从该宫其它格删除 ${digit}（Locked Candidates: Claiming）。`,
          en: `In C${col + 1}, all candidates for digit ${digit} are inside B${box + 1}, so remove ${digit} from other cells in that box (Locked Candidates: Claiming).`,
        },
      };
    }
  }

  return null;
}

export const _lockedCandidatesInternals = { findPointing, findClaiming, cellName };
