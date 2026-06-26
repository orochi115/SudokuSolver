import { BOX_OF } from '../grid.js';

export type UniqueRectangleCells = [number, number, number, number];

export function* allUniqueRectangles(): Generator<UniqueRectangleCells> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells: UniqueRectangleCells = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          const boxes = new Set(cells.map((cell) => BOX_OF[cell]!));
          if (boxes.size === 2) yield cells;
        }
      }
    }
  }
}
