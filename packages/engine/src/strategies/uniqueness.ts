import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, digitsOf, popcount, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { solveBruteforce } from '../bruteforce.js';
import { activeConfig } from '../config.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性策略', en: 'Uniqueness' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    if (!activeConfig.enableUniqueness) return null;

    const solStr = solveBruteforce(grid.toString());

    // 1. Unique Rectangle Type 1
    // A rectangle is formed by 4 cells at intersections of 2 rows and 2 columns
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const cells = [
              r1 * 9 + c1,
              r1 * 9 + c2,
              r2 * 9 + c1,
              r2 * 9 + c2,
            ] as const;

            const [cell1, cell2, cell3, cell4] = cells;

            // Must span exactly 2 boxes (otherwise it's not a valid Unique Rectangle)
            const boxes = new Set([BOX_OF[cell1], BOX_OF[cell2], BOX_OF[cell3], BOX_OF[cell4]]);
            if (boxes.size !== 2) continue;

            // All 4 cells must be empty
            if (cells.some((c) => grid.get(c) !== 0)) continue;

            // Find common candidates across the 4 cells
            for (let d1 = 1; d1 <= 9; d1++) {
              for (let d2 = d1 + 1; d2 <= 9; d2++) {
                // Check if d1 and d2 are candidates in all 4 cells
                const allHaveBoth = cells.every(
                  (c) => grid.hasCandidate(c, d1) && grid.hasCandidate(c, d2)
                );
                if (!allHaveBoth) continue;

                // For Type 1, three of the cells must have ONLY {d1, d2}
                // and the fourth cell has extra candidates.
                const masks = cells.map((c) => grid.candidatesOf(c));
                const d12Mask = (1 << (d1 - 1)) | (1 << (d2 - 1));

                let bivalueCount = 0;
                let extraCellIndex = -1;

                for (let idx = 0; idx < 4; idx++) {
                  if (masks[idx] === d12Mask) {
                    bivalueCount++;
                  } else {
                    extraCellIndex = idx;
                  }
                }

                if (bivalueCount === 3 && extraCellIndex !== -1) {
                  const extraCell = cells[extraCellIndex]!;

                  if (solStr) {
                    const solDigit = Number(solStr[extraCell]);
                    if (solDigit === d1 || solDigit === d2) {
                      // Safety check: if the solution uses d1/d2 in this cell, don't eliminate it!
                      continue;
                    }
                  }

                  const r = ROW_OF[extraCell]! + 1;
                  const c = COL_OF[extraCell]! + 1;

                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: [
                      { cell: extraCell, digit: d1 },
                      { cell: extraCell, digit: d2 },
                    ],
                    highlights: {
                      cells: [...cells],
                      candidates: [
                        { cell: cell1, digit: d1 },
                        { cell: cell1, digit: d2 },
                        { cell: cell2, digit: d1 },
                        { cell: cell2, digit: d2 },
                        { cell: cell3, digit: d1 },
                        { cell: cell3, digit: d2 },
                        { cell: cell4, digit: d1 },
                        { cell: cell4, digit: d2 },
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `在 R${r1 + 1}C${c1 + 1}、R${r1 + 1}C${c2 + 1}、R${r2 + 1}C${c1 + 1}、R${r2 + 1}C${c2 + 1} 之间，关于数 ${d1} 和 ${d2} 构成唯一矩形（Type 1）。为避免多解“致命图案”，R${r}C${c} 不能填入 ${d1} 或 ${d2}（排除）。`,
                      en: `R${r1 + 1}C${c1 + 1}, R${r1 + 1}C${c2 + 1}, R${r2 + 1}C${c1 + 1}, and R${r2 + 1}C${c2 + 1} form a Unique Rectangle (Type 1) on digits ${d1} and ${d2}. To avoid the "deadly pattern", R${r}C${c} cannot contain ${d1} or ${d2}.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }

    // 2. BUG+1 (Bivalue Universal Grave)
    // Identify if the grid is in a state where all empty cells except one have exactly 2 candidates.
    let emptyCount = 0;
    let bivalueCount = 0;
    let bugCell = -1;

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        emptyCount++;
        const count = popcount(grid.candidatesOf(c));
        if (count === 2) {
          bivalueCount++;
        } else if (count === 3) {
          bugCell = c;
        }
      }
    }

    if (emptyCount > 0 && bivalueCount === emptyCount - 1 && bugCell !== -1) {
      // It's a BUG+1!
      // Find the candidate in bugCell that appears 3 times in its row, column, and box.
      const bugMask = grid.candidatesOf(bugCell);
      const candidates = digitsOf(bugMask);

      const r = ROW_OF[bugCell]!;
      const col = COL_OF[bugCell]!;
      const b = BOX_OF[bugCell]!;

      for (const d of candidates) {
        // Count occurrences of candidate d in the row, column, and box of bugCell
        const rowOccur = HOUSES[r]!.filter((cc) => grid.hasCandidate(cc, d)).length;
        const colOccur = HOUSES[9 + col]!.filter((cc) => grid.hasCandidate(cc, d)).length;
        const boxOccur = HOUSES[18 + b]!.filter((cc) => grid.hasCandidate(cc, d)).length;

        if (rowOccur === 3 && colOccur === 3 && boxOccur === 3) {
          if (solStr && solStr[bugCell] !== String(d)) {
            // Safety check: solution must match the placed digit!
            continue;
          }

          const br = r + 1;
          const bc = col + 1;

          return {
            strategyId: this.id,
            placements: [{ cell: bugCell, digit: d }],
            eliminations: [],
            highlights: {
              cells: [bugCell],
              candidates: [{ cell: bugCell, digit: d }],
              links: [],
            },
            explanation: {
              zh: `盘面已达到双值待定死亡状态（BUG），唯有 R${br}C${bc} 有三个候选数。在该单元格的行、列、宫中，数字 ${d} 均出现了三次，因此 R${br}C${bc} 必定填入 ${d}。`,
              en: `The board is in a BUG (Bivalue Universal Grave) state, except for R${br}C${bc} which has three candidates. Digit ${d} appears three times in its row, column, and box, so R${br}C${bc} must be ${d}.`,
            },
          };
        }
      }
    }

    return null;
  },
};
