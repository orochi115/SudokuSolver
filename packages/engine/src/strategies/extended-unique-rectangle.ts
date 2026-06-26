import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allEURRectangles(): Generator<number[]> {
  // Vertical (3 rows, 2 columns)
  for (let r1 = 0; r1 < 3; r1++) {
    for (let r2 = 3; r2 < 6; r2++) {
      for (let r3 = 6; r3 < 9; r3++) {
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2,
              r2 * 9 + c1, r2 * 9 + c2,
              r3 * 9 + c1, r3 * 9 + c2
            ];
            const boxes = new Set(cells.map(c => BOX_OF[c]!));
            if (boxes.size === 3) {
              yield cells;
            }
          }
        }
      }
    }
  }

  // Horizontal (2 rows, 3 columns)
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      if (Math.floor(r1 / 3) === Math.floor(r2 / 3)) continue;
      for (let c1 = 0; c1 < 3; c1++) {
        for (let c2 = 3; c2 < 6; c2++) {
          for (let c3 = 6; c3 < 9; c3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
              r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3
            ];
            const boxes = new Set(cells.map(c => BOX_OF[c]!));
            if (boxes.size === 3) {
              yield cells;
            }
          }
        }
      }
    }
  }
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const cells of allEURRectangles()) {
      if (cells.some(c => grid.get(c) !== 0)) continue;

      // Try each cell as the target cell (carrying the extra candidate(s))
      for (let i = 0; i < 6; i++) {
        const target = cells[i]!;
        const cleanCells = cells.filter(c => c !== target);

        // All clean cells must have their candidates ⊆ cleanMask
        let cleanMask = 0;
        for (const c of cleanCells) {
          cleanMask |= grid.candidatesOf(c);
        }

        if (popcount(cleanMask) === 3) {
          const ds = digitsOf(cleanMask);
          // Check that target cell has candidates outside cleanMask (the extras)
          const targetCands = grid.candidatesOf(target);
          if ((targetCands & ~cleanMask) !== 0) {
            // Find candidates in target that are in cleanMask (the EUR digits to eliminate)
            const elims = ds
              .filter(d => (targetCands & maskOf(d)) !== 0)
              .map(d => ({ cell: target, digit: d }));

            if (elims.length > 0) {
              const placements = popcount(targetCands & ~cleanMask) === 1
                ? [{ cell: target, digit: digitsOf(targetCands & ~cleanMask)[0]! }]
                : [];

              return {
                strategyId: this.id,
                placements,
                eliminations: elims,
                highlights: {
                  cells,
                  candidates: [
                    ...cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                    ...elims
                  ],
                  links: []
                },
                explanation: {
                  zh: `扩展唯一矩形 Type 1：在格 ${cells.map(c => cellLabel(c)).join(', ')} 中，若目标格 ${cellLabel(target)} 仅包含数字 {${ds.join(',')}} 则由于其 2×3 的对称结构而产生多解；因此消除该格中的 {${ds.join(',')}}。`,
                  en: `Extended Unique Rectangle Type 1: cells ${cells.map(c => cellLabel(c)).join(', ')} form a deadly 2×3 pattern on digits {${ds.join(',')}}; eliminate {${ds.join(',')}} from target ${cellLabel(target)} to preserve uniqueness.`
                }
              };
            }
          }
        }
      }
    }
    return null;
  }
};
