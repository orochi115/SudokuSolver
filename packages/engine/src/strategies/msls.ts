/**
 * MSLS (Multi-Sector Locked Sets) — 多扇区数组 (T4, exotic).
 *
 * Rank-0 set-logic configuration: a digit subset D and a collection of
 * "sector" houses whose truths (cells that MUST take a D digit) exactly
 * balance the links (houses that CAN supply D) at rank 0 — i.e. the
 * number of demand cells = the number of supply cells.
 *
 * In the simplest implementation, we look for MSLS configurations of the
 * "home/away" form: a home set H and away set A across multiple rows and
 * columns. For each row r in {truth rows}, the r-cells containing H must
 * collectively form a "demand" — their H-candidates will be placed there.
 * For each column c in {cover columns}, the c-cells containing H supply.
 *
 * Canonical detection (David P. Bird / SudokuWiki):
 *   pick a subset H of digits
 *   pick a set of "truth" rows R ⊆ rows and "cover" columns C ⊆ cols
 *   the cells in (R × C) that contain H candidates define a loop
 *   rank = |cover| - |truth| (number of supply cells - demand cells)
 *   require rank == 0 (no slack)
 *
 * Eliminations: a non-H candidate in a demand cell is impossible (the
 * demand cell MUST take H); an H candidate in a supply cell outside the
 * loop is impossible (the H digit is squeezed out of the rest of the
 * supply house).
 *
 * For human-default we use a conservative subset: pairs of rows + pairs of
 * columns with H a 4-digit subset — the "MS-NS" form. This is enough to
 * cover the worked examples and remains tractable.
 */

import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Yield all k-subsets. */
function* combos<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const c of combos(rest, k - 1)) yield [first!, ...c];
  yield* combos(rest, k);
}

function tryMsls(grid: Grid): Step | null {
  // The smallest non-trivial MSLS: 4-digit subset H, 2 truth rows, 2 cover cols.
  // The 4 loop cells are (r1,c1), (r1,c2), (r2,c1), (r2,c2) — each must contain
  // only H digits AND the row/column counts must balance.
  //
  // We allow row counts to vary: each truth row may have 1 or 2 cells in the
  // loop; each cover column may have 1 or 2. The total demand = sum of cells
  // holding H in truth rows; supply = sum of cells holding H in cover columns.
  // rank = supply - demand; we require rank 0.
  //
  // For 2x2 row/col sets, this is too restrictive — many MSLS use uneven
  // numbers. We instead generalize: pick a subset H, a set of truth rows R
  // and cover cols C, compute demands/supplies, and verify rank == 0.

  // Cap enumeration: H is 4 digits; R is 2 rows; C is 2 cols. That gives
  // 4*4*9C2*9C2 = ~7500 starting points. Most are pruned quickly.

  // Pre-compute per-cell H membership for each (cell, H) pair lazily.

  for (let r1 = 0; r1 < 9; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 9; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          // The 4 loop candidate cells
          const cells = [
            ROWS[r1]![c1]!, ROWS[r1]![c2]!,
            ROWS[r2]![c1]!, ROWS[r2]![c2]!,
          ];
          if (cells.some((c) => grid.get(c) !== 0)) continue;
          // Each cell must contain at least one common digit.
          // Find the intersection of candidates of the 4 cells — too restrictive.
          // Instead, find a digit subset H such that:
          //  - H is present in some of the 4 cells
          //  - the row demands (cells with H in each row) and column supplies
          //    (cells with H in each col) form rank 0.

          // For tractability, we try each "H = union-of-intersect" pattern:
          // H = intersection of (cells in row1) ∪ (cells in row2) restricted
          // to candidates that are NOT in the rest of the rows outside the loop.
          //
          // Simpler approach: enumerate H as the union of candidates of the 4
          // cells, then verify rank-0 conditions.

          let cellMask = 0;
          for (const c of cells) cellMask |= grid.candidatesOf(c);
          const digits = digitsOf(cellMask);
          if (digits.length < 3 || digits.length > 5) continue;
          // For each subset H of `digits` of size ≥ 3, test rank 0.
          for (let hs = Math.max(3, digits.length - 2); hs <= Math.min(5, digits.length); hs++) {
            for (const Hcombo of combos(digits, hs)) {
              const Hmask = Hcombo.reduce((m, d) => m | maskOf(d), 0);
              // Count demands: in each truth row, count cells containing H.
              // For row r1, only the 2 loop cells in r1 are relevant (truth row
              // demands are concentrated in the loop columns).
              const r1Demands = cells.filter((c) => ROW_OF[c] === r1 && (grid.candidatesOf(c) & Hmask) !== 0).length;
              const r2Demands = cells.filter((c) => ROW_OF[c] === r2 && (grid.candidatesOf(c) & Hmask) !== 0).length;
              if (r1Demands === 0 || r2Demands === 0) continue;
              // Count supplies: in each cover col, count cells containing H.
              const c1Supplies = cells.filter((c) => COL_OF[c] === c1 && (grid.candidatesOf(c) & Hmask) !== 0).length;
              const c2Supplies = cells.filter((c) => COL_OF[c] === c2 && (grid.candidatesOf(c) & Hmask) !== 0).length;
              if (c1Supplies === 0 || c2Supplies === 0) continue;
              const T = r1Demands + r2Demands;
              const K = c1Supplies + c2Supplies;
              if (K !== T) continue;
              // rank 0 — this is a candidate MSLS.
              // Verify H is confined in the truth rows to the loop cells
              // (i.e. H in row r1 is only in the 2 loop cells).
              // This is the "naked-side" confinement.
              const r1Others = ROWS[r1]!.filter((c) => !cells.includes(c) && grid.get(c) === 0);
              const r1OtherH = r1Others.filter((c) => (grid.candidatesOf(c) & Hmask) !== 0).length;
              const r2Others = ROWS[r2]!.filter((c) => !cells.includes(c) && grid.get(c) === 0);
              const r2OtherH = r2Others.filter((c) => (grid.candidatesOf(c) & Hmask) !== 0).length;
              if (r1OtherH > 0 || r2OtherH > 0) continue;
              // Verify H is confined in cover cols to loop cells (hidden-side).
              const c1Others = COLS[c1]!.filter((c) => !cells.includes(c) && grid.get(c) === 0);
              const c1OtherH = c1Others.filter((c) => (grid.candidatesOf(c) & Hmask) !== 0).length;
              const c2Others = COLS[c2]!.filter((c) => !cells.includes(c) && grid.get(c) === 0);
              const c2OtherH = c2Others.filter((c) => (grid.candidatesOf(c) & Hmask) !== 0).length;
              if (c1OtherH > 0 || c2OtherH > 0) continue;
              // Found a valid MSLS. Apply eliminations:
              // - Naked side: strip non-H from each loop cell.
              // - Hidden side: strip H from cells in truth rows outside the loop
              //   (already excluded by confinement; but cells in cover cols outside
              //   the loop could be stripped).
              const elims: { cell: number; digit: number }[] = [];
              for (const c of cells) {
                const extras = grid.candidatesOf(c) & ~Hmask;
                for (const d of digitsOf(extras)) {
                  if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
                }
              }
              if (elims.length === 0) continue;
              return {
                strategyId: 'msls',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...cells, ...elims.map((e) => e.cell)],
                  candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  links: [],
                },
                explanation: {
                  zh: `多扇区数组（MSLS，rank 0）：真集 行 ${r1 + 1}/${r2 + 1}，覆盖 列 ${c1 + 1}/${c2 + 1}，候选数 {${Hcombo.join(',')}}；消去环内非 {${Hcombo.join(',')}} 候选（MSLS）。`,
                  en: `Multi-Sector Locked Sets (MSLS, rank 0): truth rows ${r1 + 1}/${r2 + 1}, cover cols ${c1 + 1}/${c2 + 1}, digit subset {${Hcombo.join(',')}}; strip non-{${Hcombo.join(',')}} from loop cells (MSLS).`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区数组', en: 'MSLS (Multi-Sector Locked Sets)' },
  difficulty: 1300,
  tieBreak: ['house', 'cell-index'],

  apply(grid: Grid): Step | null {
    return tryMsls(grid);
  },
};

// Suppress unused
void CELLS;
void HOUSES;
void BOXES;
void BOX_OF;
void popcount;
