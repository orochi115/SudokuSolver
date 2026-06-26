/**
 * Extended Unique Rectangle types (3, 5, 6) + Hidden Unique Rectangle.
 *
 * All uniqueness techniques assume the puzzle has a UNIQUE solution. They
 * detect a *deadly pattern* (a 2×2 / 2-box / 2-digit configuration that
 * admits two solutions) and forbid the candidate placements that would
 * complete it.
 *
 *   UR Type 3: extras in two adjacent corners form a pseudo-cell. Combined
 *     with outside cells, they form a naked subset → eliminate the subset
 *     digits from the rest of the house.
 *   UR Type 5: extras in two diagonal (or three) corners, all with the SAME
 *     extra digit Z. Z must occupy one of those corners. Eliminate Z from
 *     cells seeing all the extra-candidate corners.
 *   UR Type 6: extras in two diagonal corners, where one UR digit X forms an
 *     X-Wing on the 4 UR cells. Placing X in a diagonal extra-corner would
 *     force X into its diagonal partner → deadly swap. Eliminate X from
 *     both diagonal extra-corners.
 *   Hidden UR: three corners carry arbitrary extras. Pick the corner WITHOUT
 *     extras; its diagonal opposite is the target. If the OTHER UR digit
 *     appears nowhere outside the UR in the two houses through the opposite
 *     corner, eliminate the opposite digit from the opposite corner.
 *
 * This module extends `uniqueness.ts` (which hosts the existing Type 1/2/4
 * + BUG+1) — each strategy is its own pure function. The shared `allRectangles`
 * generator and `getCommonHouses` are re-declared locally to keep this file
 * standalone.
 */

import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF, HOUSES,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
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

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

// ---- UR Type 3 ----
/** Two floor cells (adjacent corners) carry extra candidates that, combined
 * with outside cells in their shared house, form a naked subset. Eliminate
 * the subset's digits from the other cells in that house. */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    // The two floor cells form a pseudo-cell with combined extras.
    const f1 = floorCells[0]!;
    const f2 = floorCells[1]!;
    const extra1 = grid.candidatesOf(f1) & ~intersect;
    const extra2 = grid.candidatesOf(f2) & ~intersect;
    const extraUnion = extra1 | extra2;
    // The pseudo-cell "holds" extraUnion. For Type 3, the pseudo-cell + outside cells
    // in a shared house form a locked subset.
    const sharedHouses = getCommonHouses(f1, f2);
    if (sharedHouses.length === 0) continue;
    const [x, y] = digitsOf(intersect) as [number, number];

    for (const houseIdx of sharedHouses) {
      const house = HOUSES[houseIdx]!;
      // Outside cells in the house (not in {f1, f2}) that carry any extraUnion digit.
      const outside = house.filter(
        (c) => c !== f1 && c !== f2 && grid.get(c) === 0 && (grid.candidatesOf(c) & extraUnion) !== 0,
      );
      // The pseudo-cell has |extraUnion| digits, plus the 2 outside cells. For a
      // locked subset of size k = |extraUnion|, we need k outside cells (size 1 → pair,
      // size 2 → triple, etc.). If exactly k outside cells, form a locked subset.
      const k = popcount(extraUnion);
      if (outside.length !== k) continue;
      // The union of pseudo-cell and outside cells = subset of size (1 + k) cells,
      // holding only the k extraUnion digits. So this is a locked subset of size (1+k)
      // over k digits. Eliminate the k digits from the rest of the house.
      const subset = new Set<number>([f1, f2, ...outside]);
      const elims: { cell: number; digit: number }[] = [];
      for (const c of house) {
        if (subset.has(c)) continue;
        if (grid.get(c) !== 0) continue;
        for (const d of digitsOf(extraUnion)) {
          if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
      }
      if (elims.length === 0) continue;
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...cells, ...outside, ...elims.map((e) => e.cell)],
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type3：UR对 {${x},${y}}，两个底层格的额外候选与共享宫/行/列中的另 ${k} 个格构成 ${k + 1} 格 ${k} 数字的锁集；消去该宫/行/列其余格中的额外候选。`,
          en: `Unique Rectangle Type 3: UR pair {${x},${y}}; the two floor cells' extras plus ${k} outside cells in their shared house form a locked subset of ${k + 1} cells on ${k} digits; eliminate the extra digits from the rest of that house.`,
        },
      };
    }
  }
  return null;
}

// ---- UR Type 5 ----
/** Extras in two diagonal (or three) corners, all the SAME extra digit Z.
 * Z must occupy one of those corners. Eliminate Z from cells seeing all
 * extra-candidate corners. */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Find cells with extras (mask != intersect but mask & intersect == intersect)
    // AND with the extra set being exactly {Z} (popcount(extra) === 1).
    const extraCells: { cell: number; extra: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const m = masks[i]!;
      if (m === intersect || m === 0) continue;
      const extraMask = m & ~intersect;
      if (popcount(extraMask) === 1) extraCells.push({ cell: cells[i]!, extra: digitsOf(extraMask)[0]! });
    }
    // Type 5: 2 or 3 extra cells (same single extra digit Z).
    if (extraCells.length < 2 || extraCells.length > 3) continue;
    const Zs = new Set(extraCells.map((e) => e.extra));
    if (Zs.size !== 1) continue; // all extras must be the same digit
    const Z = [...Zs][0]!;

    // Find cells seeing ALL extraCells and carrying Z. Eliminate Z from them.
    const extraCellSet = new Set(extraCells.map((e) => e.cell));
    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (extraCellSet.has(c)) continue;
      if (grid.get(c) !== 0) continue;
      if (!grid.hasCandidate(c, Z)) continue;
      // Must see all extra cells.
      let seesAll = true;
      for (const ec of extraCellSet) {
        if (!PEERS_OF[ec]!.includes(c)) {
          seesAll = false;
          break;
        }
      }
      if (seesAll) elims.push({ cell: c, digit: Z });
    }
    if (elims.length === 0) continue;
    const [x, y] = digitsOf(intersect) as [number, number];
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
        zh: `唯一矩形 Type5：UR对 {${x},${y}}，${extraCells.length} 个对角/三宫角格有共同额外候选 ${Z}；Z 必在其中之一；同时看到这 ${extraCells.length} 格的格中消去 ${Z}。`,
        en: `Unique Rectangle Type 5: UR pair {${x},${y}}; ${extraCells.length} diagonal/triple corners share the extra digit ${Z}; Z must occupy one of them; eliminate ${Z} from cells seeing all those corners.`,
      },
    };
  }
  return null;
}

// ---- UR Type 6 ----
/** Extras in two diagonal corners, where one UR digit X forms an X-Wing on
 * the 4 UR cells (X appears in all 4 cells of the X-Wing, or is confined).
 * Eliminate X from both diagonal extra-corners.
 *
 * Properly, the OTHER diagonal pair must be ROOF (UR pair only, no extras) — otherwise
 * the deadly pattern is not as cleanly defined. We require that. */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two diagonal pairs. For each pair, check if BOTH have extras AND the OTHER
    // diagonal pair is exactly the UR pair (roof).
    const diagPairs: { pair: [number, number]; other: [number, number] }[] = [
      { pair: [c11, c22], other: [c12, c21] },
      { pair: [c12, c21], other: [c11, c22] },
    ];
    for (const { pair: [d1, d2], other: [o1, o2] } of diagPairs) {
      // Other diagonal must be ROOF (UR pair only, no extras).
      if (grid.candidatesOf(o1) !== intersect) continue;
      if (grid.candidatesOf(o2) !== intersect) continue;
      // This diagonal must have extras (at least one extra digit each).
      const m1 = grid.candidatesOf(d1);
      const m2 = grid.candidatesOf(d2);
      if (m1 === 0 || m2 === 0) continue;
      const e1 = m1 & ~intersect;
      const e2 = m2 & ~intersect;
      if (popcount(e1) === 0 || popcount(e2) === 0) continue;
      // Type 6: at least one of the UR digits (call it X) appears in EVERY corner
      // (X-Wing condition on the 4 UR cells).
      const [x, y] = digitsOf(intersect) as [number, number];
      for (const X of [x, y] as number[]) {
        const xBit = maskOf(X);
        if (cells.every((c) => (grid.candidatesOf(c) & xBit) !== 0)) {
          // Eliminate X from both diagonal extra corners (d1, d2).
          const elims: { cell: number; digit: number }[] = [];
          for (const c of [d1, d2]) {
            if (grid.hasCandidate(c, X)) elims.push({ cell: c, digit: X });
          }
          if (elims.length === 0) continue;
          return {
            strategyId,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type6：UR对 {${x},${y}} 中 ${X} 出现在全部四格（X-Wing），故对角两个额外角格中消去 ${X}（避免双解）。`,
              en: `Unique Rectangle Type 6: in UR pair {${x},${y}}, ${X} appears in all 4 corners (X-Wing); eliminate ${X} from the two diagonal extra corners to avoid a deadly swap.`,
            },
          };
        }
      }
    }
  }
  return null;
}

// ---- Hidden UR ----
/** Pick the UR corner WITHOUT extras. Look at the row+col of the diagonally
 * opposite corner. If one UR digit A appears NOWHERE outside the UR in those
 * two houses, eliminate the OTHER UR digit B from the opposite corner. */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Find the corner WITHOUT extras (mask == intersect). If found, look at the
    // diagonal opposite corner.
    const noExtra = cells.filter((_, i) => masks[i] === intersect);
    if (noExtra.length !== 1) continue;
    const start = noExtra[0]!;
    // The diagonal opposite of `start`:
    const opposite = start === c11 ? c22 : start === c12 ? c21 : start === c21 ? c12 : c11;
    // Collect the houses through `opposite`: its row and its col.
    const oppRow = ROW_OF[opposite]!;
    const oppCol = COL_OF[opposite]!;
    const otherCells = cells.filter((c) => c !== opposite);
    const [x, y] = digitsOf(intersect) as [number, number];
    // For each UR digit, check if it appears in ROW oppRow or COL oppCol outside the UR.
    for (const [elimDigit, lockedDigit] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(lockedDigit);
      // In the row + col, any cell outside the UR carrying lockedDigit?
      let outsideLocked = false;
      for (let c = 0; c < 9; c++) {
        const rCell = oppRow * 9 + c;
        const cCell = c * 9 + oppCol;
        for (const cell of [rCell, cCell]) {
          if (otherCells.includes(cell)) continue;
          if (cell === opposite) continue;
          if (grid.get(cell) !== 0) continue;
          if ((grid.candidatesOf(cell) & lockedBit) !== 0) {
            outsideLocked = true;
            break;
          }
        }
        if (outsideLocked) break;
      }
      if (outsideLocked) continue;
      // lockedDigit appears only in the UR (in oppRow + oppCol) → opposite corner must be lockedDigit.
      // So elimDigit can be eliminated from the opposite corner.
      if (!grid.hasCandidate(opposite, elimDigit)) continue;
      return {
        strategyId,
        placements: [],
        eliminations: [{ cell: opposite, digit: elimDigit }],
        highlights: {
          cells: [...cells],
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `隐性唯一矩形（HUR）：UR对 {${x},${y}} 中 ${lockedDigit} 在对角格的所在行/列中只出现在 UR 内，故对角格必须为 ${lockedDigit}；消去该格的 ${elimDigit}。`,
          en: `Hidden Unique Rectangle: in UR pair {${x},${y}}, ${lockedDigit} is confined to the UR in the row/column of the diagonal corner; that corner must be ${lockedDigit}; eliminate ${elimDigit} from it.`,
        },
      };
    }
  }
  return null;
}

export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType3(grid, 'unique-rectangle-type-3');
  },
};

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType5(grid, 'unique-rectangle-type-5');
  },
};

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType6(grid, 'unique-rectangle-type-6');
  },
};

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryHiddenUR(grid, 'hidden-unique-rectangle');
  },
};
