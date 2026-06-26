import {
  ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];

      // A Hidden UR starts from a corner with EXACTLY {x, y}
      for (let i = 0; i < 4; i++) {
        const startCell = cells[i]!;
        if (masks[i] !== intersect) continue;

        // Find the diagonally opposite cell
        let oppCell = c22;
        if (startCell === c11) oppCell = c22;
        else if (startCell === c12) oppCell = c21;
        else if (startCell === c21) oppCell = c12;
        else if (startCell === c22) oppCell = c11;

        if (grid.get(oppCell) !== 0) continue;

        const oppRow = ROW_OF[oppCell]!;
        const oppCol = COL_OF[oppCell]!;

        // Test both UR digits as "a" (locked) and "b" (eliminated)
        for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
          const aBit = maskOf(a);

          // a must appear nowhere outside the UR in the row and column of oppCell
          const rowCands = ROWS[oppRow]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit));
          const colCands = COLS[oppCol]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit));

          const rowOk = rowCands.every(c => cells.includes(c));
          const colOk = colCands.every(c => cells.includes(c));

          if (rowOk && colOk && grid.hasCandidate(oppCell, b)) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: [{ cell: oppCell, digit: b }],
              highlights: {
                cells,
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `隐性唯一矩形：UR对 {${x},${y}} 中，${a} 在对角格 ${cellLabel(oppCell)} 所在的行与列中除了该矩形外没有其他可能；故消去对角格中的另一个候选数 ${b}。`,
                en: `Hidden Unique Rectangle: UR pair {${x},${y}}; ${a} is confined to the rectangle lines of the opposite corner ${cellLabel(oppCell)}; eliminate ${b} from the opposite corner.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}
