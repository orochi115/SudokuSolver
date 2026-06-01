import { ROW_OF, COL_OF, BOX_OF, BOXES, ROWS, COLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 54,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (let bIdx = 0; bIdx < 9; bIdx++) {
        const box = BOXES[bIdx]!;
        const cb = box.filter((cell) => grid.hasCandidate(cell, digit));
        if (cb.length < 2) continue;

        // Get rows and columns spanned by box bIdx
        const bRows = Array.from(new Set(box.map((cell) => ROW_OF[cell]!)));
        const bCols = Array.from(new Set(box.map((cell) => COL_OF[cell]!)));

        for (const r of bRows) {
          for (const c of bCols) {
            // Check if all candidates in box bIdx lie within row r or column c
            const isER = cb.every((cell) => ROW_OF[cell]! === r || COL_OF[cell]! === c);
            if (!isER) continue;

            // 1. Look for a conjugate pair in column c_line outside box bIdx
            for (let c_line = 0; c_line < 9; c_line++) {
              if (bCols.includes(c_line)) continue; // Must be outside the box

              const colCells = COLS[c_line]!.filter((cell) => grid.hasCandidate(cell, digit));
              if (colCells.length !== 2) continue;

              const cell1 = colCells[0]!;
              const cell2 = colCells[1]!;

              let top = -1, other = -1;
              if (ROW_OF[cell1]! === r) {
                top = cell1;
                other = cell2;
              } else if (ROW_OF[cell2]! === r) {
                top = cell2;
                other = cell1;
              }

              if (top !== -1) {
                const otherRow = ROW_OF[other]!;
                const intersection = otherRow * 9 + c;

                if (BOX_OF[intersection]! !== bIdx && grid.hasCandidate(intersection, digit)) {
                  const ri = ROW_OF[intersection]! + 1;
                  const ci = COL_OF[intersection]! + 1;

                  const links: Link[] = [
                    { from: { cell: other, digit }, to: { cell: top, digit }, type: 'strong' },
                  ];

                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: [{ cell: intersection, digit }],
                    highlights: {
                      cells: [...cb, other, top],
                      candidates: [
                        ...cb.map((cell) => ({ cell, digit })),
                        { cell: other, digit },
                        { cell: top, digit },
                        { cell: intersection, digit },
                      ],
                      links,
                    },
                    explanation: {
                      zh: `对于数字 ${digit}，第 ${bIdx + 1} 宫内候选数构成空矩形（交叉于 R${r + 1}C${c + 1}），与外部强链接（R${ROW_OF[other]! + 1}C${COL_OF[other]! + 1} = R${ROW_OF[top]! + 1}C${COL_OF[top]! + 1}）关联，因此可以排除交叉点 R${ri}C${ci} 中的候选数 ${digit}。`,
                      en: `For digit ${digit}, candidates in Box ${bIdx + 1} form an Empty Rectangle intersecting at R${r + 1}C${c + 1}. Connected with an external conjugate pair, we can eliminate ${digit} from R${ri}C${ci}.`,
                    },
                  };
                }
              }
            }

            // 2. Look for a conjugate pair in row r_line outside box bIdx
            for (let r_line = 0; r_line < 9; r_line++) {
              if (bRows.includes(r_line)) continue; // Must be outside the box

              const rowCells = ROWS[r_line]!.filter((cell) => grid.hasCandidate(cell, digit));
              if (rowCells.length !== 2) continue;

              const cell1 = rowCells[0]!;
              const cell2 = rowCells[1]!;

              let top = -1, other = -1;
              if (COL_OF[cell1]! === c) {
                top = cell1;
                other = cell2;
              } else if (COL_OF[cell2]! === c) {
                top = cell2;
                other = cell1;
              }

               if (top !== -1) {
                const otherCol = COL_OF[other]!;
                const intersection = r * 9 + otherCol;

                if (BOX_OF[intersection]! !== bIdx && grid.hasCandidate(intersection, digit)) {
                  const ri = ROW_OF[intersection]! + 1;
                  const ci = COL_OF[intersection]! + 1;

                  const links: Link[] = [
                    { from: { cell: other, digit }, to: { cell: top, digit }, type: 'strong' },
                  ];

                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: [{ cell: intersection, digit }],
                    highlights: {
                      cells: [...cb, other, top],
                      candidates: [
                        ...cb.map((cell) => ({ cell, digit })),
                        { cell: other, digit },
                        { cell: top, digit },
                        { cell: intersection, digit },
                      ],
                      links,
                    },
                    explanation: {
                      zh: `对于数字 ${digit}，第 ${bIdx + 1} 宫内候选数构成空矩形（交叉于 R${r + 1}C${c + 1}），与外部强链接（R${ROW_OF[other]! + 1}C${COL_OF[other]! + 1} = R${ROW_OF[top]! + 1}C${COL_OF[top]! + 1}）关联，因此可以排除交叉点 R${ri}C${ci} 中的候选数 ${digit}。`,
                      en: `For digit ${digit}, candidates in Box ${bIdx + 1} form an Empty Rectangle intersecting at R${r + 1}C${c + 1}. Connected with an external conjugate pair, we can eliminate ${digit} from R${ri}C${ci}.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};
