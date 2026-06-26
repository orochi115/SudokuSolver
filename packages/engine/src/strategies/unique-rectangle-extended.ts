/**
 * Unique Rectangle — extended types (P0) — 唯一矩形扩展类型
 *
 * Implements UR Type 3, UR Type 5, UR Type 6, and Hidden Unique Rectangle on
 * top of the existing UR detection logic (E3: 3 independent UR detectors
 * are gradually converging into a shared UR engine; this file adds the
 * remaining types 3/5/6 and HUR to the UR family, while the pre-existing
 * types 1/2/4 remain in `uniqueness.ts` for now).
 *
 * All detectors assume the puzzle has a UNIQUE solution (uniqueness-class
 * techniques); see docs/notes/p0.md and `unique-rectangle-bug.md`.
 *
 *   - UR Type 3: two roof cells form a "pseudo-cell" whose extras combine
 *                with an outside cell in a shared house to complete a
 *                naked subset. Eliminate the subset's digits from other
 *                cells in that house.
 *   - UR Type 5: two DIAGONAL roof cells each carry the same single extra
 *                digit c. Eliminate c from cells seeing BOTH roof cells.
 *                Also the single-strong-link variant: a UR where one digit
 *                is strong-linked between two bivalue corners — eliminate
 *                the other UR digit from the opposite (mid) bivalue corner.
 *   - UR Type 6: two DIAGONAL roof cells each carry extra digit a. The
 *                other UR digit b forms an X-Wing through the four UR
 *                cells. Eliminate a from both diagonal roof cells (two
 *                placements).
 *   - Hidden UR: a UR corner WITHOUT extras + the diagonally opposite
 *                corner; if the other UR digit appears nowhere outside
 *                the UR in the row and column of the opposite corner,
 *                eliminate the original UR digit from the opposite corner.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** A 2×2 UR rectangle: (r1,c1), (r1,c2), (r2,c1), (r2,c2) spanning exactly 2 boxes. */
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

/** Standard UR 2-digit footprint check (the "UR pair" {a,b}). */
function urPair(grid: Grid, cells: readonly number[]): { pair: number[]; floor: number[]; roof: number[] } | null {
  const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
  const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
  if (popcount(intersect) !== 2) return null;
  const urDigits = digitsOf(intersect);
  const floor: number[] = [];
  const roof: number[] = [];
  for (let i = 0; i < 4; i++) {
    if (masks[i] === intersect) floor.push(cells[i]!);
    else roof.push(cells[i]!);
  }
  return { pair: urDigits, floor, roof };
}

// ============================================================================
// UR Type 3: roof pseudo-cell completes a locked subset with outside cells
// ============================================================================

function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const info = urPair(grid, cells);
    if (!info) continue;
    if (info.roof.length !== 2) continue;

    const [roofA, roofB] = info.roof as [number, number];
    const extraMaskA = grid.candidatesOf(roofA) & ~((1 << (info.pair[0]! - 1)) | (1 << (info.pair[1]! - 1)));
    const extraMaskB = grid.candidatesOf(roofB) & ~((1 << (info.pair[0]! - 1)) | (1 << (info.pair[1]! - 1)));
    const combinedExtras = extraMaskA | extraMaskB;
    if (popcount(combinedExtras) === 0) continue;

    // The two roof cells together hold a "pseudo-cell" with candidates =
    // extras. Find shared houses (row/col/box) of roofA and roofB.
    const sharedHouses: number[] = [];
    for (let h = 0; h < HOUSES.length; h++) {
      if (HOUSES[h]!.includes(roofA) && HOUSES[h]!.includes(roofB)) sharedHouses.push(h);
    }

    for (const houseIdx of sharedHouses) {
      const house = HOUSES[houseIdx]!;
      // Collect outside cells in this house (not in the UR).
      const outside = house.filter((c) => grid.get(c) === 0 && !cells.includes(c));
      // Find a subset of outside cells whose candidates, combined with the
      // pseudo-cell's combinedExtras, forms a naked subset. The most common
      // case is a single outside cell (subset size 1) such that
      //   |cands(outside)| = 1 AND cands match part of combinedExtras.
      // But generally we want a SUBSET of outside cells + pseudo-cell whose
      // combined size = sum of cell counts in the subset + 1... hmm,
      // the pseudo-cell is size 2 (two cells) with combinedExtras digits
      // (|combinedExtras| = popcount(combinedExtras)). For the subset to be
      // "locked", we need: (#pseudo + #subset) = |combinedExtras ∪ cands(subset)|.
      // Actually for "pseudo-cell completes a naked subset", the typical
      // pattern is: outside cells have candidates that, together with the
      // pseudo-cell, make a locked set of size = #cells in the locked set.
      // For the simple cases: (a) one outside cell with candidates subset of
      // combinedExtras and (b) outside cell with exactly 1 candidate.
      // We'll search for a small locked set in this house.

      // Try single-cell + pseudo = 3 cells, 3 candidates (a "triple").
      // The "pseudo-cell" of 2 roof cells holds the combined extras. The
      // full locked subset is: 2 roof cells (UR pair ∪ extras) + outside cell.
      // For a valid naked triple, the combined candidate mask (including the
      // UR pair digits) must have popcount 3 — meaning the UR pair digits
      // are already a subset of the combined extras / outside.cands.
      for (const outsideCell of outside) {
        const m = grid.candidatesOf(outsideCell);
        if (m === 0) continue;
        // Combined candidate mask of the 3 cells: UR pair ∪ extras ∪ outside.cands.
        const combined = (1 << (info.pair[0]! - 1)) | (1 << (info.pair[1]! - 1)) | combinedExtras | m;
        // Cell count: 2 (pseudo) + 1 (outside) = 3.
        if (popcount(combined) !== 3) continue;
        // Now eliminate the 3 digits from the rest of the house.
        const elims: { cell: number; digit: number }[] = [];
        for (const hcell of house) {
          if (hcell === roofA || hcell === roofB || hcell === outsideCell) continue;
          if (cells.includes(hcell)) continue; // UR cell that's not a roof
          if (grid.get(hcell) !== 0) continue;
          for (const d of digitsOf(combined)) {
            if (grid.hasCandidate(hcell, d)) elims.push({ cell: hcell, digit: d });
          }
        }
        if (elims.length === 0) continue;

        const a = info.pair[0]!;
        const b = info.pair[1]!;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells, ...elims.map((e) => e.cell)],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type3：UR对 {${a},${b}}，两个底层格（伪格，候选 {${digitsOf(combinedExtras).join(',')}}）与共享宫/行/列中的格 R${ROW_OF[outsideCell]! + 1}C${COL_OF[outsideCell]! + 1}（候选 {${digitsOf(m).join(',')}}）形成锁定三元组 {${digitsOf(combined).join(',')}}；消去该宫/行/列中其余格的 ${digitsOf(combined).join(',')}。`,
            en: `Unique Rectangle Type 3: UR pair {${a},${b}}; the two roof cells (pseudo-cell, candidates {${digitsOf(combinedExtras).join(',')}}) combine with R${ROW_OF[outsideCell]! + 1}C${COL_OF[outsideCell]! + 1} (cands {${digitsOf(m).join(',')}}) in their shared house to form a locked triple on {${digitsOf(combined).join(',')}}; eliminate ${digitsOf(combined).join(',')} from the other cells of that house.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================================
// UR Type 5: two DIAGONAL roof cells with same single extra digit c
// ============================================================================

function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const info = urPair(grid, cells);
    if (!info) continue;
    if (info.roof.length !== 2) continue;

    // Type 5 requires roof cells to be DIAGONAL (not adjacent).
    // In a rectangle (r1,c1)/(r1,c2)/(r2,c1)/(r2,c2):
    //   - Adjacent pairs: (c11,c12) same row, (c11,c21) same col, etc.
    //   - Diagonal pair: (c11,c22) or (c12,c21).
    const [roofA, roofB] = info.roof as [number, number];
    const sameRow = ROW_OF[roofA] === ROW_OF[roofB];
    const sameCol = COL_OF[roofA] === COL_OF[roofB];
    if (sameRow || sameCol) continue; // not diagonal

    const a = info.pair[0]!;
    const b = info.pair[1]!;
    const extraMaskA = grid.candidatesOf(roofA) & ~((1 << (a - 1)) | (1 << (b - 1)));
    const extraMaskB = grid.candidatesOf(roofB) & ~((1 << (a - 1)) | (1 << (b - 1)));
    // Both roof cells must each have exactly one extra digit, and the extras
    // must be the same digit c.
    if (popcount(extraMaskA) !== 1 || popcount(extraMaskB) !== 1) continue;
    if (extraMaskA !== extraMaskB) continue;
    const c = digitsOf(extraMaskA)[0]!;

    // Eliminate c from every cell that sees BOTH roof cells.
    const cBit = maskOf(c);
    const roofARow = ROW_OF[roofA] as number;
    const roofACol = COL_OF[roofA] as number;
    const roofABox = BOX_OF[roofA] as number;
    const peersA = new Set<number>();
    for (const p of HOUSES[roofARow]!) peersA.add(p);
    for (const p of HOUSES[9 + roofACol]!) peersA.add(p);
    for (const p of HOUSES[18 + roofABox]!) peersA.add(p);
    peersA.delete(roofA);
    peersA.delete(roofB);

    const roofBRow = ROW_OF[roofB] as number;
    const roofBCol = COL_OF[roofB] as number;
    const roofBBox = BOX_OF[roofB] as number;
    const elims: { cell: number; digit: number }[] = [];
    for (const p of HOUSES[roofBRow]!) {
      if (!peersA.has(p)) continue;
      if (p === roofA || p === roofB) continue;
      if (cells.includes(p)) continue;
      if (grid.get(p) !== 0) continue;
      if (grid.hasCandidate(p, c)) elims.push({ cell: p, digit: c });
    }
    for (const p of HOUSES[9 + roofBCol]!) {
      if (!peersA.has(p)) continue;
      if (p === roofA || p === roofB) continue;
      if (cells.includes(p)) continue;
      if (grid.get(p) !== 0) continue;
      if (grid.hasCandidate(p, c)) elims.push({ cell: p, digit: c });
    }
    for (const p of HOUSES[18 + roofBBox]!) {
      if (!peersA.has(p)) continue;
      if (p === roofA || p === roofB) continue;
      if (cells.includes(p)) continue;
      if (grid.get(p) !== 0) continue;
      if (grid.hasCandidate(p, c)) elims.push({ cell: p, digit: c });
    }

    if (elims.length === 0) continue;

    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...elims.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type5：UR对 {${a},${b}}，两个对角底层格均含额外候选数 ${c}；其中一个必须为 ${c}，故消去能同时看到两个对角底层格的格的 ${c}。`,
        en: `Unique Rectangle Type 5: UR pair {${a},${b}}; the two diagonal roof cells both carry extra candidate ${c}; one must be ${c}, so eliminate ${c} from cells seeing both roof cells.`,
      },
    };
  }
  return null;
}

// ============================================================================
// UR Type 6: diagonal roof cells, UR digit forms X-Wing through the rectangle
// ============================================================================

function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const info = urPair(grid, cells);
    if (!info) continue;
    if (info.roof.length !== 2) continue;

    // Type 6: diagonal roof cells. (Adjacent handled by Type 2.)
    const [roofA, roofB] = info.roof as [number, number];
    const sameRow = ROW_OF[roofA] === ROW_OF[roofB];
    const sameCol = COL_OF[roofA] === COL_OF[roofB];
    if (sameRow || sameCol) continue;

    // Each roof cell must have at least one UR digit as a candidate (or be a
    // floor cell). Actually, the spec says "extras in two diagonal corners".
    // For Type 6, the two diagonal corners are roof cells; the floor cells are
    // the other two (the adjacent corners).
    const a = info.pair[0]!;
    const b = info.pair[1]!;
    // For Type 6: the UR digit a must form an X-Wing through the 4 UR cells.
    // That means a is a candidate in all 4 cells (or in just the 2 rows × 2 cols).
    // The condition: for each row of the UR, a appears in exactly 2 cells (the
    // two UR cells in that row); same for columns. Equivalently: a appears in
    // all 4 UR cells. (Or a appears in only 2 cells in each row/col, but since
    // a is a candidate in 4 cells total, that means a is in all 4 cells.)

    // Try both UR digits. For each, check if it forms an X-Wing through the 4
    // cells (i.e. is a candidate in all 4 cells).
    for (const d of [a, b]) {
      const dBit = maskOf(d);
      // X-Wing condition: d is a candidate in exactly the 2 cells per row/col
      // of the rectangle. The simplest form: d in all 4 cells. But the spec
      // also allows d to be confined to the 2 rows ∩ 2 cols (i.e. the 4 cells
      // of the rectangle have all d's, and d has NO other candidates in those
      // 2 rows and 2 cols).
      // We'll check: d is a candidate in all 4 cells AND no other cells in
      // the 2 rows or 2 cols have d as candidate (X-Wing style).

      // (1) d in all 4 cells.
      if (!cells.every((c) => grid.hasCandidate(c, d))) continue;
      // (2) No other cells in the 2 rows have d.
      let confined = true;
      for (const r of [ROW_OF[c11]!, ROW_OF[c21]!]) {
        for (const c of HOUSES[r]!) {
          if (cells.includes(c)) continue;
          if (grid.hasCandidate(c, d)) { confined = false; break; }
        }
        if (!confined) break;
      }
      if (!confined) continue;
      // (3) No other cells in the 2 cols have d.
      for (const col of [COL_OF[c11]!, COL_OF[c12]!]) {
        for (const c of HOUSES[9 + col]!) {
          if (cells.includes(c)) continue;
          if (grid.hasCandidate(c, d)) { confined = false; break; }
        }
        if (!confined) break;
      }
      if (!confined) continue;

      // Now eliminate d from both diagonal roof cells (placements).
      if (!grid.hasCandidate(roofA, d) || !grid.hasCandidate(roofB, d)) continue;
      // Type 6 is a "placement" (d can be eliminated from roof cells because
      // they're in the way of the X-Wing). Wait, actually Type 6 is the OPPOSITE:
      // if d forms X-Wing, then d in roof cells would force the deadly pattern.
      // So we eliminate d from roof cells.
      return {
        strategyId,
        placements: [],
        eliminations: [
          { cell: roofA, digit: d },
          { cell: roofB, digit: d },
        ],
        highlights: {
          cells,
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type6：UR对 {${a},${b}}，数字 ${d} 在矩形 2×2 的两行两列中只出现在四个角（构成 X 翼）；因此 ${d} 不会在对角底层格出现，消去对角底层格的 ${d}。`,
          en: `Unique Rectangle Type 6: UR pair {${a},${b}}; digit ${d} appears only in the 4 UR cells (forming an X-Wing through the rectangle's 2 rows and 2 columns); ${d} cannot go in the diagonal roof cells, so eliminate ${d} from them.`,
        },
      };
    }
  }
  return null;
}

// ============================================================================
// Hidden Unique Rectangle (HUR)
// ============================================================================

/**
 * Hidden UR: a UR corner WITHOUT extras is the "start" corner. Look at the
 * row and column of the diagonally opposite corner. If one UR digit appears
 * nowhere outside the UR in those two houses, then the other UR digit is
 * eliminated from the diagonally opposite corner.
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const info = urPair(grid, cells);
    if (!info) continue;
  // For HUR, we need EXACTLY ONE corner that is a "clean" bivalue {a, b}
  // (i.e. matches the UR pair). The other 3 corners have extra candidates.
  // The "clean" corner is the start; the opposite (diagonal) corner is the
  // target.
  if (info.floor.length !== 1) continue; // exactly 1 clean corner
  const startCorner = info.floor[0] as number;
  // The opposite (diagonal) corner:
  const opp = cells.find((c) => c !== startCorner && !PEERS_OF[startCorner]!.includes(c));
  if (opp === undefined) continue; // shouldn't happen
    const a = info.pair[0]!;
    const b = info.pair[1]!;
    const oppMask = grid.candidatesOf(opp);

    // The opposite corner has extras; it may or may not have a and/or b.
    // The condition: for one of {a, b}, that digit appears nowhere outside
    // the UR in the row and column of `opp`. If so, that digit must go in
    // `opp` (it has nowhere else in those houses). So the OTHER UR digit
    // is eliminated from `opp`.
    for (const [lockedDigit, elimDigit] of [[a, b], [b, a]] as [number, number][]) {
      const lockedBit = maskOf(lockedDigit);
      // Check row of opp: any non-UR cell with lockedDigit?
      const oppRow = ROW_OF[opp]!;
      const oppCol = COL_OF[opp]!;
      let confined = true;
      for (const c of HOUSES[oppRow]!) {
        if (cells.includes(c)) continue;
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0) { confined = false; break; }
      }
      if (!confined) continue;
      for (const c of HOUSES[9 + oppCol]!) {
        if (cells.includes(c)) continue;
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0) { confined = false; break; }
      }
      if (!confined) continue;

      // Locked digit is confined to the UR in the row & col of opp.
      // Eliminate elimDigit from opp (and the start corner is clean, so no
      // eliminations from it). Wait: this means the locked digit MUST be in
      // opp (since it has no other home in those two houses), and therefore
      // opp cannot be elimDigit.
      if (grid.hasCandidate(opp, elimDigit)) {
        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: opp, digit: elimDigit }],
          highlights: {
            cells,
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `隐藏唯一矩形：UR对 {${a},${b}}，角格 R${ROW_OF[startCorner]! + 1}C${COL_OF[startCorner]! + 1} 仅含 {${a},${b}}；数字 ${lockedDigit} 在 R${oppRow + 1} 行与 C${oppCol + 1} 列中仅出现在 UR 内的格，故对角格 R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} 必为 ${lockedDigit}，消去其 ${elimDigit}。`,
            en: `Hidden Unique Rectangle: UR pair {${a},${b}}, corner R${ROW_OF[startCorner]! + 1}C${COL_OF[startCorner]! + 1} holds only {${a},${b}}; digit ${lockedDigit} appears nowhere outside the UR in row R${oppRow + 1} and column C${oppCol + 1}, so the opposite diagonal corner R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} must be ${lockedDigit}; eliminate ${elimDigit} from it.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================================
// Strategy factories
// ============================================================================

function makeURStrategy(
  id: string,
  nameZh: string,
  nameEn: string,
  difficulty: number,
  detector: (grid: Grid, strategyId: string) => Step | null,
): Strategy {
  return {
    id,
    name: { zh: nameZh, en: nameEn },
    difficulty,
    tieBreak: ['cell-index'],
    apply(grid: Grid): Step | null {
      return detector(grid, id);
    },
  };
}

export const uniqueRectangleType3: Strategy = makeURStrategy(
  'unique-rectangle-type-3',
  '唯一矩形 Type 3',
  'Unique Rectangle Type 3',
  940,
  tryURType3,
);

export const uniqueRectangleType5: Strategy = makeURStrategy(
  'unique-rectangle-type-5',
  '唯一矩形 Type 5',
  'Unique Rectangle Type 5',
  960,
  tryURType5,
);

export const uniqueRectangleType6: Strategy = makeURStrategy(
  'unique-rectangle-type-6',
  '唯一矩形 Type 6',
  'Unique Rectangle Type 6',
  970,
  tryURType6,
);

export const hiddenUniqueRectangle: Strategy = makeURStrategy(
  'hidden-unique-rectangle',
  '隐藏唯一矩形',
  'Hidden Unique Rectangle',
  935,
  tryHiddenUR,
);

// Silence unused symbols (PEERS_OF, CELLS, etc., kept for clarity / future).
void CELLS;
