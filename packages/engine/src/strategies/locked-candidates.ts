/**
 * Locked Candidates (T2) — 区块排除.
 *
 * Two flavours, both single-digit intersection eliminations:
 *  - Pointing (宫→行/列): within a box, all candidates of a digit lie on one
 *    row (or column) → the digit can be eliminated from that row/column
 *    outside the box.
 *  - Claiming (行/列→宫): within a row (or column), all candidates of a digit
 *    lie in one box → the digit can be eliminated from that box outside the
 *    row/column.
 */

import {
  SIZE,
} from '../grid.js';
import {
  BOXES,
  ROWS,
  COLS,
  ROW_OF,
  COL_OF,
  BOX_OF,
  cellsWithCandidate,
  cellLabel,
  houseLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function makeStep(
  id: string,
  digit: number,
  defining: number[],
  eliminations: CellDigit[],
  zhKind: string,
  enKind: string,
  fromHouse: number,
  toHouse: number,
): Step {
  const from = houseLabel(fromHouse);
  const to = houseLabel(toHouse);
  return {
    strategyId: id,
    placements: [],
    eliminations,
    highlights: {
      cells: defining,
      candidates: defining.map((c) => ({ cell: c, digit })),
      links: [],
    },
    explanation: {
      zh: `${zhKind}：数字 ${digit} 在${from.zh}内只出现在 ${defining.map(cellLabel).join('、')}（同属${to.zh}），因此可从${to.zh}的其余格中排除 ${digit}。`,
      en: `${enKind}: digit ${digit} in ${from.en} appears only at ${defining.map(cellLabel).join(', ')} (all in ${to.en}), so ${digit} can be removed from the rest of ${to.en}.`,
    },
  };
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // ---- Pointing: box -> line ----
    for (let b = 0; b < 9; b++) {
      const box = BOXES[b]!;
      const boxHouse = 18 + b;
      for (let digit = 1; digit <= SIZE; digit++) {
        const spots = cellsWithCandidate(grid, box, digit);
        if (spots.length < 2 || spots.length > 3) continue;

        // Same row?
        const rows = new Set(spots.map((c) => ROW_OF[c]!));
        if (rows.size === 1) {
          const r = [...rows][0]!;
          const lineHouse = r; // ROWS index == house index
          const elims: CellDigit[] = [];
          for (const c of cellsWithCandidate(grid, ROWS[r]!, digit)) {
            if (BOX_OF[c] !== b) elims.push({ cell: c, digit });
          }
          if (elims.length > 0) {
            return makeStep(this.id, digit, spots, elims, '指向（宫→行）', 'Pointing (box→row)', boxHouse, lineHouse);
          }
        }

        // Same column?
        const cols = new Set(spots.map((c) => COL_OF[c]!));
        if (cols.size === 1) {
          const cc = [...cols][0]!;
          const lineHouse = 9 + cc;
          const elims: CellDigit[] = [];
          for (const c of cellsWithCandidate(grid, COLS[cc]!, digit)) {
            if (BOX_OF[c] !== b) elims.push({ cell: c, digit });
          }
          if (elims.length > 0) {
            return makeStep(this.id, digit, spots, elims, '指向（宫→列）', 'Pointing (box→column)', boxHouse, lineHouse);
          }
        }
      }
    }

    // ---- Claiming: line -> box ----
    for (let r = 0; r < 9; r++) {
      const rowHouse = r;
      for (let digit = 1; digit <= SIZE; digit++) {
        const spots = cellsWithCandidate(grid, ROWS[r]!, digit);
        if (spots.length < 2 || spots.length > 3) continue;
        const boxes = new Set(spots.map((c) => BOX_OF[c]!));
        if (boxes.size !== 1) continue;
        const b = [...boxes][0]!;
        const elims: CellDigit[] = [];
        for (const c of cellsWithCandidate(grid, BOXES[b]!, digit)) {
          if (ROW_OF[c] !== r) elims.push({ cell: c, digit });
        }
        if (elims.length > 0) {
          return makeStep(this.id, digit, spots, elims, '声明（行→宫）', 'Claiming (row→box)', rowHouse, 18 + b);
        }
      }
    }
    for (let cc = 0; cc < 9; cc++) {
      const colHouse = 9 + cc;
      for (let digit = 1; digit <= SIZE; digit++) {
        const spots = cellsWithCandidate(grid, COLS[cc]!, digit);
        if (spots.length < 2 || spots.length > 3) continue;
        const boxes = new Set(spots.map((c) => BOX_OF[c]!));
        if (boxes.size !== 1) continue;
        const b = [...boxes][0]!;
        const elims: CellDigit[] = [];
        for (const c of cellsWithCandidate(grid, BOXES[b]!, digit)) {
          if (COL_OF[c] !== cc) elims.push({ cell: c, digit });
        }
        if (elims.length > 0) {
          return makeStep(this.id, digit, spots, elims, '声明（列→宫）', 'Claiming (column→box)', colHouse, 18 + b);
        }
      }
    }

    return null;
  },
};
