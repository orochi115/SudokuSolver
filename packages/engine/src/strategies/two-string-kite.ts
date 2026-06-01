import { ROW_OF, COL_OF, BOX_OF, ROWS, COLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 52,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // Find rows and cols with exactly 2 candidates
      const rowPairs: { r: number; cells: number[] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cells = ROWS[r]!.filter((cell) => grid.hasCandidate(cell, digit));
        if (cells.length === 2) {
          rowPairs.push({ r, cells });
        }
      }

      const colPairs: { c: number; cells: number[] }[] = [];
      for (let c = 0; c < 9; c++) {
        const cells = COLS[c]!.filter((cell) => grid.hasCandidate(cell, digit));
        if (cells.length === 2) {
          colPairs.push({ c, cells });
        }
      }

      for (const rowItem of rowPairs) {
        for (const colItem of colPairs) {
          const r = rowItem.r;
          const c = colItem.c;

          // For each row pair and col pair, check if they share a box in one of their candidates
          for (let rIdx = 0; rIdx < 2; rIdx++) {
            for (let cIdx = 0; cIdx < 2; cIdx++) {
              const r_in = rowItem.cells[rIdx]!;
              const r_out = rowItem.cells[1 - rIdx]!;
              const c_in = colItem.cells[cIdx]!;
              const c_out = colItem.cells[1 - cIdx]!;

              const b = BOX_OF[r_in]!;
              if (
                b === BOX_OF[c_in]! &&
                b !== BOX_OF[r_out]! &&
                b !== BOX_OF[c_out]! &&
                r_in !== c_in
              ) {
                // Potential 2-String Kite
                const intersection = ROW_OF[c_out]! * 9 + COL_OF[r_out]!;

                if (grid.hasCandidate(intersection, digit)) {
                  const ri = ROW_OF[intersection]! + 1;
                  const ci = COL_OF[intersection]! + 1;

                  const links: Link[] = [
                    { from: { cell: r_out, digit }, to: { cell: r_in, digit }, type: 'strong' },
                    { from: { cell: r_in, digit }, to: { cell: c_in, digit }, type: 'weak' },
                    { from: { cell: c_in, digit }, to: { cell: c_out, digit }, type: 'strong' },
                  ];

                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: [{ cell: intersection, digit }],
                    highlights: {
                      cells: [r_in, r_out, c_in, c_out],
                      candidates: [
                        { cell: r_in, digit },
                        { cell: r_out, digit },
                        { cell: c_in, digit },
                        { cell: c_out, digit },
                        { cell: intersection, digit },
                      ],
                      links,
                    },
                    explanation: {
                      zh: `对于数字 ${digit}，第 ${r + 1} 行与第 ${c + 1} 列的强链接在第 ${b + 1} 宫内关联，构成双线风筝，因此可以从两端点交叉的单元格 R${ri}C${ci} 中排除候选数 ${digit}。`,
                      en: `For digit ${digit}, Row ${r + 1} and Column ${c + 1} have conjugate pairs connected in Box ${b + 1}, forming a 2-String Kite. We can eliminate ${digit} from the intersection cell R${ri}C${ci}.`,
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
