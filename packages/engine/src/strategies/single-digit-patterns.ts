/**
 * T3: single-digit patterns (Skyscraper, 2-String Kite, Empty Rectangle).
 *
 * These are 2-fish variants with one "bent" cover or a rectangle with empty corners.
 */

import { SIZE, ROW_OF, COL_OF, ROWS, COLS, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findSkyscraper(grid: Grid, digit: number): Step | null {
  // Two rows with two candidates each; the four cells form a "skyscraper" (two verticals + one bent)
  // Elimination at the intersection of the two "bent" covers
  for (let r1 = 0; r1 < SIZE; r1++) {
    const cands1 = COLS.map((_, c) => (grid.hasCandidate(r1 * SIZE + c, digit) ? c : -1)).filter((x) => x >= 0);
    if (cands1.length !== 2) continue;
    for (let r2 = r1 + 1; r2 < SIZE; r2++) {
      const cands2 = COLS.map((_, c) => (grid.hasCandidate(r2 * SIZE + c, digit) ? c : -1)).filter((x) => x >= 0);
      if (cands2.length !== 2) continue;
      // Exactly one shared column → skyscraper
      const shared = cands1.filter((c) => cands2.includes(c));
      if (shared.length !== 1) continue;
      const bent1 = cands1.find((c) => c !== shared[0]!)!;
      const bent2 = cands2.find((c) => c !== shared[0]!)!;
      // Elimination: digit at (r1,bent2) or (r2,bent1) if present
      const e1 = r1 * SIZE + bent2;
      const e2 = r2 * SIZE + bent1;
      const elims: { cell: number; digit: number }[] = [];
      if (grid.hasCandidate(e1, digit)) elims.push({ cell: e1, digit });
      if (grid.hasCandidate(e2, digit)) elims.push({ cell: e2, digit });
      if (elims.length > 0) {
        const baseCells = [r1 * SIZE + cands1[0]!, r1 * SIZE + cands1[1]!, r2 * SIZE + cands2[0]!, r2 * SIZE + cands2[1]!];
        return {
          strategyId: 'single-digit-patterns',
          placements: [],
          eliminations: elims,
          highlights: { cells: baseCells, candidates: baseCells.map((c) => ({ cell: c, digit })), links: [] },
          explanation: {
            zh: `摩天楼：数字 ${digit} 在两行两列形成摩天楼结构，消除交叉候选。`,
            en: `Skyscraper: digit ${digit} forms a skyscraper between two rows; eliminate intersection candidates.`,
          },
        };
      }
    }
  }
  return null;
}

function findTwoStringKite(grid: Grid, digit: number): Step | null {
  // Similar to skyscraper but one base is a box (or row+box hybrid). Simplified: two rows + two boxes.
  // For minimal implementation we reuse the skyscraper logic as a close variant.
  return findSkyscraper(grid, digit); // placeholder; real kite differs in geometry
}

function findEmptyRectangle(grid: Grid, digit: number): Step | null {
  // Find a rectangle (two rows, two cols) where three corners have the digit but one is empty.
  // Elimination at the empty corner's opposite.
  for (let r1 = 0; r1 < SIZE; r1++) {
    for (let r2 = r1 + 1; r2 < SIZE; r2++) {
      for (let c1 = 0; c1 < SIZE; c1++) {
        for (let c2 = c1 + 1; c2 < SIZE; c2++) {
          const cells = [
            r1 * SIZE + c1,
            r1 * SIZE + c2,
            r2 * SIZE + c1,
            r2 * SIZE + c2,
          ];
          const has = cells.map((c) => grid.hasCandidate(c, digit));
          const count = has.filter(Boolean).length;
          if (count !== 3) continue;
          // Find the empty corner
          const emptyIdx = has.findIndex((h) => !h);
          if (emptyIdx < 0) continue;
          // The opposite corner is the one with different row and col
          const oppIdx = 3 - emptyIdx;
          const target = cells[oppIdx]!;
          if (grid.hasCandidate(target, digit)) {
            const baseCells = cells.filter((_, i) => i !== emptyIdx);
            return {
              strategyId: 'single-digit-patterns',
              placements: [],
              eliminations: [{ cell: target, digit }],
              highlights: { cells: baseCells, candidates: baseCells.map((c) => ({ cell: c, digit })), links: [] },
              explanation: {
                zh: `空矩形：数字 ${digit} 在矩形三顶点出现，消除对角候选。`,
                en: `Empty Rectangle: digit ${digit} at three rectangle corners; eliminate opposite corner.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 42,

  apply(_grid: Grid): Step | null {
    // T3 single-digit patterns disabled for M2 soundness guarantee
    return null;
  },
};
