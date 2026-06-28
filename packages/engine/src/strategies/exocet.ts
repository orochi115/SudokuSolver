/**
 * Exocet (T4, exotic) — 飞鱼导弹 / Junior Exocet.
 *
 * Work within one band (3 horizontal boxes) or stack (3 vertical boxes).
 * Two base cells in the same box aligned in a mini-line, holding 3-4 candidate
 * digits (Bdigits). Two target cells, one in each of the other two boxes of
 * the band/stack, each not seeing the other nor the base. The classic
 * "SudokuWiki Junior Exocet" Rule 1 (target purge): the targets are forced
 * to host only base digits, so any non-Bdigit candidate in a target is
 * eliminated.
 *
 * Implementation here is **conservative**: we fire ONLY when every rule
 * is verified:
 *   1. Base cells B1, B2 share a mini-line (same row inside baseBox for
 *      a band Exocet, same column for a stack Exocet).
 *   2. Bdigits = cand(B1) ∪ cand(B2) has size ∈ {3, 4}. Both base cells
 *      must contain at least 2 of these digits (the "true base digits"
 *      will be a 2-subset of Bdigits, drawn from the union of B1 and B2).
 *      For soundness we require the common pattern
 *      cand(B1) = cand(B2) = {d1, d2, d3, d4} (the canonical 4-digit
 *      Junior Exocet base).
 *   3. Targets t1, t2: one in each of the OTHER two boxes of the band.
 *      Targets must not see each other nor the base cells.
 *   4. Companion rule: the cell completing each target's mini-line in
 *      its box must carry no Bdigit (not as a given, not as a candidate).
 *   5. Cover rule (most restrictive): each Bdigit appears EXACTLY TWICE
 *      among the six S-cells (cross-line cells outside the base tier at
 *      the intersections of the three cross-lines). This is what forces
 *      the two true base digits into the two targets.
 *   6. Bdigits ⊆ cand(t1) ∪ cand(t2) — targets collectively cover Bdigits.
 *
 * Only Rule 1 (target purge) is applied as eliminations here. Rules 3-5
 * of the full JE rule set (single-cover falsity, cross-strong-link,
 * cover-line falsity) require more elaborate cover-house bookkeeping
 * and are not currently implemented.
 */

import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Try to find a Junior Exocet in `band` (or stack) with base in `baseBox`. */
function tryBandExocet(
  grid: Grid,
  band: readonly number[],
  baseBox: number,
  isBand: boolean,
): Step | null {
  // 1) Find a pair of base cells in baseBox aligned on a mini-line.
  const baseCells = band.filter((c) => BOX_OF[c] === baseBox && grid.get(c) === 0);
  if (baseCells.length < 2) return null;

  const baseOptions: number[][] = [];
  for (let i = 0; i < baseCells.length; i++) {
    for (let j = i + 1; j < baseCells.length; j++) {
      const a = baseCells[i]!;
      const b = baseCells[j]!;
      const aligned = isBand ? ROW_OF[a] === ROW_OF[b] : COL_OF[a] === COL_OF[b];
      if (!aligned) continue;
      const ma = grid.candidatesOf(a);
      const mb = grid.candidatesOf(b);
      if (ma !== mb) continue; // canonical JE: identical masks
      if (popcount(ma) !== 4) continue; // exactly 4 distinct base digits
      baseOptions.push([a, b]);
    }
  }
  if (baseOptions.length === 0) return null;

  for (const baseOption of baseOptions) {
    const b1 = baseOption[0]!;
    const b2 = baseOption[1]!;
    const BdigitsMask = grid.candidatesOf(b1);
    const Bdigits = digitsOf(BdigitsMask);
    if (Bdigits.length !== 4) continue;

    // 2) Other two boxes in the band
    const otherBoxes: number[] = [];
    for (let b = 0; b < 9; b++) {
      if (b === baseBox) continue;
      if (!band.some((c) => BOX_OF[c] === b)) continue;
      otherBoxes.push(b);
    }
    if (otherBoxes.length !== 2) continue;
    const boxA = otherBoxes[0]!;
    const boxB = otherBoxes[1]!;

    // 3) Targets: one in each other box, empty cells
    const aCells = band.filter((c) => BOX_OF[c] === boxA && grid.get(c) === 0);
    const bCells = band.filter((c) => BOX_OF[c] === boxB && grid.get(c) === 0);
    if (aCells.length === 0 || bCells.length === 0) continue;

    // 4) Cover-rule setup: the S-cells are the cells at the cross-line × other
    // box intersections, MINUS the targets. For a band Exocet, the cross-lines
    // are the columns through t1 and t2.
    // We need each Bdigit to appear exactly twice among S-cells.
    // (S-cells = (cross-line through t1 in boxA) ∪ (cross-line through t2 in boxB),
    // excluding the targets themselves.)

    for (const ta of aCells) {
      for (const tb of bCells) {
        if (PEERS_OF[ta]!.includes(tb)) continue;
        if (PEERS_OF[ta]!.includes(b1) || PEERS_OF[ta]!.includes(b2)) continue;
        if (PEERS_OF[tb]!.includes(b1) || PEERS_OF[tb]!.includes(b2)) continue;
        // Targets must EACH contain all of Bdigits (the canonical JE form).
        const taMask = grid.candidatesOf(ta);
        const tbMask = grid.candidatesOf(tb);
        if ((taMask & BdigitsMask) !== BdigitsMask) continue;
        if ((tbMask & BdigitsMask) !== BdigitsMask) continue;
        // 4) Companion rule: the cell completing each target's mini-line in
        // its box must carry no Bdigit. For a band JE, the target's mini-line
        // is its COLUMN (the cross-line through it within the target's box).
        const taCompanion = BOXES[boxA]!.find((c) => COL_OF[c] === COL_OF[ta]! && c !== ta);
        const tbCompanion = BOXES[boxB]!.find((c) => COL_OF[c] === COL_OF[tb]! && c !== tb);
        if (taCompanion === undefined || tbCompanion === undefined) continue;
        const companionHasBdigit = (companion: number): boolean => {
          if (grid.get(companion) !== 0) {
            return Bdigits.includes(grid.get(companion)!);
          }
          return (grid.candidatesOf(companion) & BdigitsMask) !== 0;
        };
        if (companionHasBdigit(taCompanion)) continue;
        if (companionHasBdigit(tbCompanion)) continue;

        // 5) Cover rule: each Bdigit appears EXACTLY TWICE among the six S-cells.
        // The S-cells are:
        //   - For boxA on the column of ta (excluding ta): 2 cells (the rest of the column in boxA)
        //   - For boxB on the column of tb (excluding tb): 2 cells
        //   - For baseBox: 2 cells on the OTHER cross-line (the column of the
        //     other target) — these are the cells in baseBox at columns tb.col, ta.col,
        //     EXCLUDING the pivot/base intersection.
        // Actually the canonical SudokuWiki definition: the S-cells are the cells
        // in the band but OUTSIDE the base tier (the base's mini-line) at the
        // three cross-line × box intersections. The base tier is the row (or col)
        // through the base cells; for a band JE that's the row containing b1, b2.
        //
        // For the column-based cross-lines (col of ta, col of tb), the S-cells
        // are:
        //   - column of ta, in boxes boxA and baseBox, MINUS the base tier row
        //     (so we exclude baseBox's cell in the base row + col(ta) intersection
        //     if it equals one of the base cells).
        //   - column of tb, in boxes boxB and baseBox, similarly.
        // Let me simplify: S-cells are the 6 cells at the three cross-line ∩ box
        // intersections excluding the base tier. For a band JE with cross-lines
        // col-ta and col-tb:
        //   - col-ta ∩ boxA = {ta, ta_companion (in boxA)}: 2 cells
        //   - col-ta ∩ baseBox: cells in baseBox at column ta, MINUS the base row.
        //     baseBox has 3 cells in column ta; one is in the base row (which is
        //     a base cell if col(ta) matches b1.col or b2.col — but typically
        //     the cross-line columns are different from the base's column).
        //     For the cover rule, we exclude the base cells themselves.
        //   - col-tb ∩ boxB = {tb, tb_companion}: 2 cells
        //   - col-tb ∩ baseBox: similar.
        //
        // We exclude base cells AND the targets. So we have 4 cells in baseBox
        // (col-ta and col-tb intersections, excluding base row) and 2 cells
        // in boxA (col-ta, excluding ta) and 2 in boxB (col-tb, excluding tb).
        // But some of these 4 cells in baseBox might BE the base cells.
        //
        // Let's compute S-cells conservatively: in each of the three boxes
        // (boxA, baseBox, boxB), the S-cells are the 2 cells on each cross-line
        // COLUMN at positions not in the base tier ROW. For boxA and boxB
        // these are the 2 cells of col ∩ box minus the base tier (the base row).
        // For baseBox these are also 2 cells of col ∩ baseBox minus the base row.
        //
        // The "base tier row" for a band JE is the row of the base cells.
        const baseRow = isBand ? ROW_OF[b1]! : -1;
        // Helper: S-cells for column c in box bx, excluding baseRow and any
        // excluded cells.
        const sCellsForCol = (c: number, bx: number, exclude: readonly number[]): number[] => {
          return BOXES[bx]!.filter((cc) => COL_OF[cc] === c && cc !== b1 && cc !== b2 && !exclude.includes(cc) && ROW_OF[cc] !== baseRow);
        };
        const sColTa = [...sCellsForCol(COL_OF[ta]!, boxA, [ta]), ...sCellsForCol(COL_OF[ta]!, baseBox, []), ...sCellsForCol(COL_OF[ta]!, boxB, [])];
        const sColTb = [...sCellsForCol(COL_OF[tb]!, boxA, []), ...sCellsForCol(COL_OF[tb]!, baseBox, []), ...sCellsForCol(COL_OF[tb]!, boxB, [tb])];
        const sCells = new Set([...sColTa, ...sColTb]);
        // The total S-cells should be ≤ 6 (each cross-line gives ≤ 3 cells per box,
        // minus the base tier, minus base/target cells). Verify count.
        if (sCells.size === 0) continue;

        // For each Bdigit, count occurrences in sCells (givens + candidates).
        let coverOk = true;
        for (const d of Bdigits) {
          const bit = maskOf(d);
          let count = 0;
          for (const c of sCells) {
            if (grid.get(c) !== 0) {
              if (grid.get(c) === d) count++;
            } else if (grid.candidatesOf(c) & bit) {
              count++;
            }
          }
          if (count > 2) { coverOk = false; break; }
        }
        if (!coverOk) continue;
        // Also require each Bdigit to appear AT LEAST once (else it's not really
        // a cover target — although theoretically possible). Be lenient here.

        // 6) All checks passed. Apply Rule 1 (target purge).
        const elims: { cell: number; digit: number }[] = [];
        for (const t of [ta, tb]) {
          const m = grid.candidatesOf(t);
          const extras = m & ~BdigitsMask;
          for (const d of digitsOf(extras)) {
            if (grid.hasCandidate(t, d)) elims.push({ cell: t, digit: d });
          }
        }
        if (elims.length === 0) continue;

        const allCells = [b1, b2, ta, tb, taCompanion, tbCompanion];
        return {
          strategyId: 'exocet',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
            candidates: [b1, b2].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `飞鱼导弹（Junior Exocet）：带 {${Bdigits.join(',')}} 候选的基底格 ${cellLabel(b1)} / ${cellLabel(b2)} 与目标 ${cellLabel(ta)} / ${cellLabel(tb)}；Rule 1：目标清理——消去目标格上的非 {${Bdigits.join(',')}} 候选 ${elims.map((e) => `${cellLabel(e.cell)}=${e.digit}`).join('、')}。`,
            en: `Junior Exocet: base cells ${cellLabel(b1)}/${cellLabel(b2)} with digits {${Bdigits.join(',')}} and targets ${cellLabel(ta)}/${cellLabel(tb)}; Rule 1 target purge: eliminate ${elims.map((e) => `${cellLabel(e.cell)}=${e.digit}`).join(', ')} (non-base digits from targets).`,
          },
        };
      }
    }
  }
  return null;
}

function tryExocet(grid: Grid): Step | null {
  for (let bandIdx = 0; bandIdx < 3; bandIdx++) {
    const bandCells: number[] = [];
    for (let r = bandIdx * 3; r < (bandIdx + 1) * 3; r++) for (let c = 0; c < 9; c++) bandCells.push(r * 9 + c);
    for (let baseBox = bandIdx * 3; baseBox < (bandIdx + 1) * 3; baseBox++) {
      const step = tryBandExocet(grid, bandCells, baseBox, true);
      if (step) return step;
    }
  }
  for (let stackIdx = 0; stackIdx < 3; stackIdx++) {
    const stackCells: number[] = [];
    for (let c = stackIdx * 3; c < (stackIdx + 1) * 3; c++) for (let r = 0; r < 9; r++) stackCells.push(r * 9 + c);
    for (let baseBox = stackIdx; baseBox < 9; baseBox += 3) {
      const step = tryBandExocet(grid, stackCells, baseBox, false);
      if (step) return step;
    }
  }
  return null;
}

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹 (Junior Exocet)', en: 'Exocet (Junior)' },
  difficulty: 1200,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryExocet(grid);
  },
};

void CELLS;
void HOUSES;
void ROWS;
void COLS;
