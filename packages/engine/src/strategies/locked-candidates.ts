import { BOXES, COLS, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, rc, uniqueCells } from './common.js';

function makePointingStep(
  strategyId: string,
  digit: number,
  boxIndex: number,
  patternCells: number[],
  eliminations: number[],
  axis: 'row' | 'col',
  axisIndex: number,
): Step {
  return {
    strategyId,
    placements: [],
    eliminations: eliminations.map((cell) => ({ cell, digit })),
    highlights: {
      cells: uniqueCells([...patternCells, ...eliminations]),
      candidates: uniqueCells([...patternCells, ...eliminations]).map((cell) => ({ cell, digit })),
      links: [],
    },
    explanation: {
      zh: `数字 ${digit} 在第 ${boxIndex + 1} 宫只出现在同一${axis === 'row' ? '行' : '列'}（${axis === 'row' ? `第 ${axisIndex + 1} 行` : `第 ${axisIndex + 1} 列`}），因此可在该${axis === 'row' ? '行' : '列'}宫外删除这些候选（区块排除 pointing）。`,
      en: `In box ${boxIndex + 1}, digit ${digit} is confined to ${axis} ${axisIndex + 1}, so remove ${digit} from that ${axis} outside the box (Locked Candidates: Pointing).`,
    },
  };
}

function makeClaimingStep(
  strategyId: string,
  digit: number,
  lineType: 'row' | 'col',
  lineIndex: number,
  boxIndex: number,
  patternCells: number[],
  eliminations: number[],
): Step {
  return {
    strategyId,
    placements: [],
    eliminations: eliminations.map((cell) => ({ cell, digit })),
    highlights: {
      cells: uniqueCells([...patternCells, ...eliminations]),
      candidates: uniqueCells([...patternCells, ...eliminations]).map((cell) => ({ cell, digit })),
      links: [],
    },
    explanation: {
      zh: `数字 ${digit} 在第 ${lineType === 'row' ? '行' : '列'} ${lineIndex + 1} 的候选都落在第 ${boxIndex + 1} 宫，因此可在该宫其余单元格删除 ${digit}（区块排除 claiming）。`,
      en: `In ${lineType} ${lineIndex + 1}, all candidates for ${digit} are confined to box ${boxIndex + 1}, so remove ${digit} from other cells in that box (Locked Candidates: Claiming).`,
    },
  };
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // Pointing: box -> row/col.
      for (let boxIndex = 0; boxIndex < BOXES.length; boxIndex++) {
        const boxCells = BOXES[boxIndex]!;
        const hits = candidateCells(grid, boxCells, digit);
        if (hits.length < 2) continue;

        const rowSet = new Set(hits.map((cell) => Math.floor(cell / 9)));
        if (rowSet.size === 1) {
          const rowIndex = [...rowSet][0]!;
          const eliminations = ROWS[rowIndex]!
            .filter((cell) => !boxCells.includes(cell))
            .filter((cell) => grid.hasCandidate(cell, digit));
          if (eliminations.length > 0) {
            return makePointingStep(this.id, digit, boxIndex, hits, eliminations, 'row', rowIndex);
          }
        }

        const colSet = new Set(hits.map((cell) => cell % 9));
        if (colSet.size === 1) {
          const colIndex = [...colSet][0]!;
          const eliminations = COLS[colIndex]!
            .filter((cell) => !boxCells.includes(cell))
            .filter((cell) => grid.hasCandidate(cell, digit));
          if (eliminations.length > 0) {
            return makePointingStep(this.id, digit, boxIndex, hits, eliminations, 'col', colIndex);
          }
        }
      }

      // Claiming: row/col -> box.
      for (let rowIndex = 0; rowIndex < ROWS.length; rowIndex++) {
        const rowCells = ROWS[rowIndex]!;
        const hits = candidateCells(grid, rowCells, digit);
        if (hits.length < 2) continue;
        const boxSet = new Set(hits.map((cell) => Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3)));
        if (boxSet.size !== 1) continue;
        const boxIndex = [...boxSet][0]!;
        const eliminations = BOXES[boxIndex]!
          .filter((cell) => !rowCells.includes(cell))
          .filter((cell) => grid.hasCandidate(cell, digit));
        if (eliminations.length > 0) {
          return makeClaimingStep(this.id, digit, 'row', rowIndex, boxIndex, hits, eliminations);
        }
      }

      for (let colIndex = 0; colIndex < COLS.length; colIndex++) {
        const colCells = COLS[colIndex]!;
        const hits = candidateCells(grid, colCells, digit);
        if (hits.length < 2) continue;
        const boxSet = new Set(hits.map((cell) => Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3)));
        if (boxSet.size !== 1) continue;
        const boxIndex = [...boxSet][0]!;
        const eliminations = BOXES[boxIndex]!
          .filter((cell) => !colCells.includes(cell))
          .filter((cell) => grid.hasCandidate(cell, digit));
        if (eliminations.length > 0) {
          return makeClaimingStep(this.id, digit, 'col', colIndex, boxIndex, hits, eliminations);
        }
      }
    }

    return null;
  },
};
