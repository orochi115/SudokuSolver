import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const c11 = r1 * 9 + c1;
          const c12 = r1 * 9 + c2;
          const c21 = r2 * 9 + c1;
          const c22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[c11]!, BOX_OF[c12]!, BOX_OF[c21]!, BOX_OF[c22]!]);
          if (boxes.size !== 2) continue;
          yield [c11, c12, c21, c22];
        }
      }
    }
  }
}

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 983,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map(c => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
      if (masks.some(m => m === 0)) continue;

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];

      const eliminations: { cell: number; digit: number }[] = [];
      for (const cell of cells) {
        const extraMask = grid.candidatesOf(cell) & ~intersect;
        for (const d of digitsOf(extraMask)) {
          if (grid.hasCandidate(cell, d)) eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length > 0) {
        return {
          strategyId: 'unique-loop',
          placements: [],
          eliminations,
          highlights: {
            cells: [...cells, ...eliminations.map(e => e.cell)],
            candidates: cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `唯一环：UR 矩形四格仅含 {${x},${y}} 将导致双解，消去相关格中的非 {${x},${y}} 候选。`,
            en: `Unique Loop: UR rectangle with only {${x},${y}} would cause dual solution; eliminate non-{${x},${y}} candidates from rectangle cells.`,
          },
        };
      }
    }
    return null;
  },
};