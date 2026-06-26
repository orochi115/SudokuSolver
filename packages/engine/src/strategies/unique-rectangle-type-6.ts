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

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];

      // Check if extra candidates exist in exactly two diagonal corners
      const extraCorners: number[] = [];
      for (const c of cells) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & ~intersect) !== 0) {
          extraCorners.push(c);
        }
      }

      if (extraCorners.length !== 2) continue;
      const [diag1, diag2] = extraCorners as [number, number];
      const isDiagonal = (diag1 === c11 && diag2 === c22) || (diag1 === c12 && diag2 === c21);
      if (!isDiagonal) continue;

      const r1 = ROW_OF[c11]!;
      const r2 = ROW_OF[c21]!;
      const col1 = COL_OF[c11]!;
      const col2 = COL_OF[c12]!;

      // For each of the UR digits: is it confined to the rectangle rows/cols?
      for (const locked of [x, y]) {
        const lockedBit = maskOf(locked);

        const r1Ok = ROWS[r1]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit)).every(c => COL_OF[c] === col1 || COL_OF[c] === col2);
        const r2Ok = ROWS[r2]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit)).every(c => COL_OF[c] === col1 || COL_OF[c] === col2);
        const col1Ok = COLS[col1]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit)).every(c => ROW_OF[c] === r1 || ROW_OF[c] === r2);
        const col2Ok = COLS[col2]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit)).every(c => ROW_OF[c] === r1 || ROW_OF[c] === r2);

        if (r1Ok && r2Ok && col1Ok && col2Ok) {
          // Locked forms an X-Wing. Eliminate it from diag1 and diag2
          const elims: CellDigit[] = [];
          if (grid.hasCandidate(diag1, locked)) elims.push({ cell: diag1, digit: locked });
          if (grid.hasCandidate(diag2, locked)) elims.push({ cell: diag2, digit: locked });

          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells,
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `唯一矩形 Type 6：UR对 {${x},${y}} 中，数字 ${locked} 在其所处的行与列中构成 X 翼；在对角格中放置 ${locked} 将强制其伴随格也产生致命图案；消去对角格中的 ${locked}。`,
                en: `Unique Rectangle Type 6: UR pair {${x},${y}}; digit ${locked} forms an X-Wing on the rectangle lines; eliminate ${locked} from diagonal extra corners.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
