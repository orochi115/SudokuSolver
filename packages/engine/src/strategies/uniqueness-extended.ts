/**
 * Extended Unique Rectangle Types (T4) — 扩展唯一矩形类型
 *
 * Implements UR Type 3, Type 5, Type 6, and Hidden Unique Rectangle,
 * extending the shared UR engine in uniqueness.ts.
 *
 * All share the deadly-pattern (uniqueness) assumption: the puzzle has a unique solution.
 *
 * Research card: research/sudoku-human-solving/local-library/techniques/10-uniqueness/unique-rectangle-bug.md
 *
 * E3: This module provides the shared allRectangles generator and per-type detectors,
 * completing the UR engine that was split across type-1/2/4 in uniqueness.ts.
 */

import {
  CELLS, ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Find all UR rectangles: 4 cells in 2 rows, 2 cols, spanning exactly 2 boxes. */
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

/**
 * UR Type 3: Treat the two roof cells as a pseudo-cell with their extra candidates.
 * If they combine with outside cells in a shared house to form a naked subset,
 * eliminate those subset digits from other cells in that house.
 *
 * Roof cells share either a line or a box.
 */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // Find common UR pair: all 4 cells must have both UR digits as candidates
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // All cells must have the UR pair (some may have extra candidates)
    if (masks.some((m, i) => m !== 0 && (m & intersect) !== intersect)) continue;

    // Identify roof cells (with extra candidates) and floor cells (only UR pair)
    const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    const floorCells = cells.filter((_, i) => masks[i] === intersect);

    if (roofCells.length !== 2) continue;

    // Roof cells must share a house
    const sharedHouses = getCommonHouses(roofCells[0]!, roofCells[1]!);
    if (sharedHouses.length === 0) continue;

    // The pseudo-cell: union of extra candidates from both roof cells
    const extra0 = masks[cells.indexOf(roofCells[0]!)]! & ~intersect;
    const extra1 = masks[cells.indexOf(roofCells[1]!)]! & ~intersect;
    const pseudoMask = extra0 | extra1;
    const pseudoCount = popcount(pseudoMask);
    if (pseudoCount === 0) continue;

      // Try each shared house
    for (const houseIdx of sharedHouses) {
      const house = HOUSES[houseIdx]!;
      const outsideCells = house.filter(
        (c) => !cells.includes(c) && grid.get(c) === 0 && grid.candidatesOf(c) !== 0,
      );

      // UR Type-3: the two roof cells together act as ONE pseudo-cell with candidates pseudoMask.
      // A naked subset of size S consists of S cells (counting the pseudo-cell as 1) with exactly S candidates total.
      //   k=0: pseudo-cell alone → naked subset of size 1 (only if pseudoCount=1, degenerate/rare)
      //   k=1: pseudo-cell + 1 outside cell → naked pair (size 2)
      //   k=2: pseudo-cell + 2 outside cells → naked triple (size 3)
      //   k=3: pseudo-cell + 3 outside cells → naked quad (size 4)
      //
      // The subset size (in cell count) = 1 (pseudo) + k (outside)
      // The required candidate count = 1 + k (= subset cell count, for a proper naked subset)
      // 
      // Combined union of ALL candidates of subset = pseudoMask | outside[0].cands | ... must equal exactly 1+k digits.

      function* combineK(arr: number[], size: number): Generator<number[]> {
        if (arr.length < size) return;
        if (size === 0) { yield []; return; }
        const idx = Array.from({ length: size }, (_, i) => i);
        while (true) {
          yield idx.map((i) => arr[i]!);
          let i = size - 1;
          while (i >= 0 && idx[i]! === arr.length - size + i) i--;
          if (i < 0) break;
          idx[i]!++;
          for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
        }
      }

      for (let k = 0; k <= Math.min(3, outsideCells.length); k++) {
        const subsetSize = 1 + k; // 1 pseudo-cell + k outside cells
        if (subsetSize < 2 || subsetSize > 4) continue; // standard naked subsets 2-4

        for (const outsideCombo of combineK(outsideCells, k)) {
          // Union of all candidates in the subset (pseudo + outside cells)
          let unionMask = pseudoMask;
          for (const oc of outsideCombo) unionMask |= grid.candidatesOf(oc);

          // Naked subset condition: exactly subsetSize distinct candidates
          if (popcount(unionMask) !== subsetSize) continue;

          // All subset candidates must be confined to the subset cells in the house
          // (standard naked subset) — verify no other house cell has a subset digit
          const subsetCells = new Set([...roofCells, ...outsideCombo]);
          let confined = true;
          for (const d of digitsOf(unionMask)) {
            const bit = maskOf(d);
            for (const hc of house) {
              if (subsetCells.has(hc)) continue;
              if (grid.get(hc) === 0 && (grid.candidatesOf(hc) & bit) !== 0) {
                // There's an outside cell with this digit — but that's fine: we'll eliminate it.
                // No wait: naked subset doesn't require confinement BEFORE elimination; the elimination
                // IS valid whenever the union has exactly subsetSize digits. The "confined" check is
                // just whether there are any cells to eliminate from, which we check below.
                // So we don't need to check confinement here.
                confined = false; // not pre-confined, but we can still eliminate
                break;
              }
            }
            if (!confined) break;
          }
          // Note: confined=false just means there are cells to eliminate from (good)

          // Eliminate subset digits from other cells in house
          const elims: { cell: number; digit: number }[] = [];
          for (const houseCell of house) {
            if (subsetCells.has(houseCell)) continue;
            if (grid.get(houseCell) !== 0) continue;
            for (const d of digitsOf(unionMask)) {
              if (grid.hasCandidate(houseCell, d)) elims.push({ cell: houseCell, digit: d });
            }
          }
          if (elims.length === 0) continue;

          // SOUNDNESS CHECK: the naked subset logic is only valid for the EXTRA candidates
          // (not the UR pair). The UR pair digits {x,y} are NOT part of the pseudo-cell's
          // external candidates — they should not appear in unionMask.
          // The UR pair digits in the roof cells are part of the "deadly pattern" constraint,
          // not of the pseudo-cell's available-to-use candidates.
          //
          // Also: the naked subset logic says "these N cells hold only these N candidates".
          // But the roof cells actually also hold the UR pair digits {x,y}. So the pseudo-cell
          // is NOT purely pseudoMask — it could also be x or y. This means the standard naked
          // subset logic does NOT directly apply!
          //
          // The correct interpretation of UR Type-3 is:
          // "The roof cells need to resolve the UR by one of them being a non-UR digit.
          //  The combined non-UR digits of the roof cells form a virtual naked set."
          // This is valid only when the union of non-UR digits of the roof + k outside cells
          // form a naked subset, AND we restrict eliminations to the non-UR digits only.

          // Ensure we're not eliminating UR pair digits (those are handled by UR Type 1/2/4)
          const [x, y] = digitsOf(intersect) as [number, number];
          const pureElims = elims.filter(e => e.digit !== x && e.digit !== y);
          if (pureElims.length === 0) continue;

          const extraDigits = digitsOf(unionMask).filter(d => d !== x && d !== y).join(',');

          return {
            strategyId,
            placements: [],
            eliminations: pureElims,
            highlights: {
              cells: [...new Set([...cells, ...outsideCombo, ...pureElims.map((e) => e.cell)])],
              candidates: [
                ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...outsideCombo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ],
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type3：UR对 {${x},${y}} 的两底层格视为伪格（额外候选 ${digitsOf(pseudoMask).join(',')}），与 ${k} 个外部格构成裸数组（${digitsOf(unionMask).join(',')}），从房间其他格消去 ${extraDigits}。`,
              en: `Unique Rectangle Type 3: the two roof cells form a pseudo-cell (extra candidates ${digitsOf(pseudoMask).join(',')}) that, with ${k} outside cell(s), forms a naked subset (${digitsOf(unionMask).join(',')}); eliminate non-UR extra digits from other cells in the shared house.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/**
 * UR Type 5: Extra single digit c in two diagonal corners (or three corners).
 * c must appear in one of those cells. Eliminate c from cells seeing all extra-candidate corners.
 */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    if (masks.some((m, i) => m !== 0 && (m & intersect) !== intersect)) continue;

    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);

    // Type 5: extra candidates in diagonal corners (2 diagonal) or 3 corners
    // For 2-diagonal case: the 2 roof cells are diagonally opposite
    if (roofCells.length !== 2 && roofCells.length !== 3) continue;

    // Check diagonal: c11 and c22 are diagonal; c12 and c21 are diagonal
    const isDiagonal = (roofCells.length === 2) &&
      ((roofCells[0] === c11 && roofCells[1] === c22) ||
       (roofCells[0] === c22 && roofCells[1] === c11) ||
       (roofCells[0] === c12 && roofCells[1] === c21) ||
       (roofCells[0] === c21 && roofCells[1] === c12));

    if (roofCells.length === 2 && !isDiagonal) continue;

    // Find extra digit c: each roof cell has exactly UR pair + c
    const extras = roofCells.map((rc) => {
      const m = grid.candidatesOf(rc);
      return m & ~intersect;
    });

    // All extras must be the same single digit c (Type 5 standard)
    if (!extras.every((e) => e !== 0 && popcount(e) === 1 && e === extras[0])) continue;
    const c = digitsOf(extras[0]!)[0]!;

    // Eliminate c from cells seeing ALL roof cells
    if (roofCells.length < 2) continue;
    const peersFirst = new Set(PEERS_OF[roofCells[0]!]!);
    let candidatePeers = PEERS_OF[roofCells[0]!]!.filter((p) => grid.get(p) === 0 && grid.hasCandidate(p, c));
    for (let i = 1; i < roofCells.length; i++) {
      const peersI = new Set(PEERS_OF[roofCells[i]!]!);
      candidatePeers = candidatePeers.filter((p) => peersI.has(p));
    }
    const elims = candidatePeers.filter((p) => !cells.includes(p));
    if (elims.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims.map((p) => ({ cell: p, digit: c })),
      highlights: {
        cells: [...new Set([...cells, ...elims])],
        candidates: cells.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((d) => ({ cell: cc, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type5：UR对 {${x},${y}} 的多个角格含相同额外候选 ${c}；必须其中一个为 ${c}，消去能看到全部含 ${c} 角格的格中的 ${c}。`,
        en: `Unique Rectangle Type 5: UR pair {${x},${y}} with extra digit ${c} in multiple corners; one must be ${c}; eliminate ${c} from cells seeing all extra-candidate corners.`,
      },
    };
  }
  return null;
}

/**
 * UR Type 6: Extra candidates in two diagonal corners; one UR digit a forms an X-Wing
 * through the diagonal extra-candidate corners. Eliminate a from both diagonal corners.
 *
 * Specifically: the two diagonal extra-candidate corners each have {a,b} plus extras.
 * If digit a appears ONLY inside the UR's rows and columns (forms an X-Wing on the 4 UR cells),
 * then placing a in a diagonal corner forces the pattern → eliminate a from both diagonal corners.
 */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    if (masks.some((m, i) => m !== 0 && (m & intersect) !== intersect)) continue;

    // Type 6: exactly two diagonal corners have extra candidates
    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    if (roofCells.length !== 2) continue;

    // Must be diagonal
    const isDiag =
      (roofCells[0] === c11 && roofCells[1] === c22) ||
      (roofCells[0] === c22 && roofCells[1] === c11) ||
      (roofCells[0] === c12 && roofCells[1] === c21) ||
      (roofCells[0] === c21 && roofCells[1] === c12);
    if (!isDiag) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Check each UR digit: does it form an X-Wing on the 4 UR cells?
    for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
      const bit = maskOf(a);
      const r1 = ROW_OF[c11]!;
      const r2 = ROW_OF[c21]!;
      const col1 = COL_OF[c11]!;
      const col2 = COL_OF[c12]!;

      // X-Wing condition: digit a appears in both rows only in the two UR columns,
      // and in both columns only in the two UR rows
      const row1Cands = ROWS[r1]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      const row2Cands = ROWS[r2]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);

      if (row1Cands.length !== 2 || row2Cands.length !== 2) continue;
      if (!row1Cands.every((c) => COL_OF[c] === col1 || COL_OF[c] === col2)) continue;
      if (!row2Cands.every((c) => COL_OF[c] === col1 || COL_OF[c] === col2)) continue;

      // a forms an X-Wing on the UR cells → eliminate a from diagonal extra-candidate corners
      const elims = roofCells
        .filter((rc) => grid.hasCandidate(rc, a))
        .map((rc) => ({ cell: rc, digit: a }));

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
          zh: `唯一矩形 Type6：UR对 {${x},${y}} 的两对角底层格各含额外候选；数字 ${a} 在矩形所在行列只出现在矩形内（X翼形式），故消去两对角格的 ${a}。`,
          en: `Unique Rectangle Type 6: UR pair {${x},${y}} with extra candidates in two diagonal corners; digit ${a} forms an X-Wing on the UR cells, so eliminate ${a} from both diagonal corners.`,
        },
      };
    }
  }
  return null;
}

/**
 * Hidden Unique Rectangle (HUR):
 * Allow two or three corners to have extra candidates.
 * Pick a corner WITHOUT extra candidates as the "anchor"; look at its diagonally opposite corner.
 * If one UR digit a appears NOWHERE outside the UR in both the row and column through the
 * diagonally opposite corner, then b can be eliminated from that opposite corner.
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // All 4 cells must be empty and have both UR digits
    if (masks.some((m) => m === 0)) continue;

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    if (masks.some((m) => (m & intersect) !== intersect)) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Try each corner as the "anchor" (no extra candidates = exactly the UR pair)
    for (let anchorIdx = 0; anchorIdx < 4; anchorIdx++) {
      if (masks[anchorIdx] !== intersect) continue; // anchor must be floor cell

      const anchor = cells[anchorIdx]!;
      // Diagonal opposite of anchor
      const diagIdx = 3 - anchorIdx; // c11↔c22, c12↔c21
      // Actually: [0,1,2,3] = [c11,c12,c21,c22]
      // c11 diagonal = c22 (idx 3), c12 diagonal = c21 (idx 2)
      const diagMap: Record<number, number> = { 0: 3, 1: 2, 2: 1, 3: 0 };
      const oppIdx = diagMap[anchorIdx]!;
      const opp = cells[oppIdx]!;

      if (grid.get(opp) !== 0) continue;
      if (!grid.hasCandidate(opp, x) && !grid.hasCandidate(opp, y)) continue;

      // For each UR digit a: check if a appears nowhere outside the UR
      // in both the row AND the column through `opp`
      for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
        const bit = maskOf(a);
        const oppRow = ROW_OF[opp]!;
        const oppCol = COL_OF[opp]!;

        // Check row of opp: a only in UR cells?
        const rowCands = ROWS[oppRow]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        const rowOutside = rowCands.filter((c) => !cells.includes(c));
        if (rowOutside.length > 0) continue;

        // Check col of opp: a only in UR cells?
        const colCands = COLS[oppCol]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        const colOutside = colCands.filter((c) => !cells.includes(c));
        if (colOutside.length > 0) continue;

        // a is locked to the UR through the row and column of opp
        // Eliminate b from opp
        if (!grid.hasCandidate(opp, b)) continue;

        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: opp, digit: b }],
          highlights: {
            cells: [...cells],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `隐性唯一矩形：UR对 {${x},${y}} 中，数字 ${a} 在对角格 ${cellLabel(opp)} 所在行列仅出现于矩形内，故 ${opp === opp ? cellLabel(opp) : ''} 不能为 ${b}，消去之。`,
            en: `Hidden Unique Rectangle: UR pair {${x},${y}}; digit ${a} appears only inside the UR in the row and column through the opposite corner ${cellLabel(opp)}; eliminate ${b} from ${cellLabel(opp)}.`,
          },
        };
      }
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
