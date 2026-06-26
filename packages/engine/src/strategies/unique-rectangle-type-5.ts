import {
  ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf,
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

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];

      const extraCorners: number[] = [];
      for (const c of cells) {
        if (grid.get(c) === 0) {
          const m = grid.candidatesOf(c);
          if ((m & ~intersect) !== 0) {
            extraCorners.push(c);
          }
        }
      }

      // Type 5: extra candidates in exactly 2 diagonal corners, or exactly 3 corners.
      let isValidType5 = false;
      if (extraCorners.length === 2) {
        // Must be diagonal: (c11, c22) or (c12, c21)
        const [e1, e2] = extraCorners as [number, number];
        if ((e1 === c11 && e2 === c22) || (e1 === c12 && e2 === c21)) {
          isValidType5 = true;
        }
      } else if (extraCorners.length === 3) {
        isValidType5 = true;
      }

      if (!isValidType5) continue;

      let allHaveOneExtra = true;
      for (const c of extraCorners) {
        if (popcount(grid.candidatesOf(c) & ~intersect) !== 1) {
          allHaveOneExtra = false;
          break;
        }
      }
      if (!allHaveOneExtra) continue;

      // Find if there is a common extra digit z present in all extraCorners
      let commonExtras = 0x1ff;
      for (const c of extraCorners) {
        commonExtras &= (grid.candidatesOf(c) & ~intersect);
      }

      if (commonExtras === 0) continue;

      const extraDigits = digitsOf(commonExtras);
      for (const z of extraDigits) {
        // Eliminate z from any cell that sees all extraCorners
        const elims: CellDigit[] = [];
        for (let cell = 0; cell < 81; cell++) {
          if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, z) || cells.includes(cell)) continue;
          const seesAll = extraCorners.every((ec) => PEERS_OF[ec]!.includes(cell));
          if (seesAll) {
            elims.push({ cell, digit: z });
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells, ...elims.map((e) => e.cell)],
              candidates: [
                ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type 5：在角格中存在对角或三个角格含有额外候选数 ${z}（UR对 {${x},${y}}）；其中一格必须为 ${z} 才能破坏致命矩形；消除所有能看到这些角格的格子中的 ${z}。`,
              en: `Unique Rectangle Type 5: diagonal or three corners have extra candidate ${z} (UR pair {${x},${y}}); ${z} must go in one of those corners; eliminate ${z} from cells seeing all extra corners.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}
