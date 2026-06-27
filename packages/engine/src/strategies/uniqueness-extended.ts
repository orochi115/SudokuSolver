/**
 * Extended Uniqueness Techniques (T4) — 扩展唯一性技巧
 *
 * This module extends the existing UR engine (uniqueness.ts) with:
 *   - UR Type 3: roof cells form a "pseudo-cell" that completes a naked subset
 *   - UR Type 5: extra candidates in two diagonal or three corners (same extra digit)
 *   - UR Type 6: X-Wing on a UR digit through diagonal extras
 *   - Hidden UR (HUR): one corner has no extras; diagonal opposite constrained
 *
 * These reuse the allRectangles() pattern from uniqueness.ts.
 * (E3: share UR engine — these share the rectangle enumeration logic)
 *
 * All these techniques assume the puzzle has a unique solution.
 */

import {
  CELLS, ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

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

function getCommonHouseIndices(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/**
 * UR Type 3: Two floor cells have the UR pair; two roof cells have extra candidates.
 * Treat the two roof cells as a single pseudo-cell holding only their extras.
 * The pseudo-cell + outside cells must form a naked subset (pair/triple/quad).
 *
 * Key rule: pseudo-cell counts as ONE entity in the subset.
 * - pseudoSize=2 + 1 outside cell ⊆ {c,d} → naked pair (pseudo+out1)
 * - pseudoSize=3 + 2 outside cells ⊆ {c,d,e} → naked triple (pseudo+out1+out2)
 * - pseudoSize=2 + 2 outside cells ⊆ {c,d} → also naked triple (3 entities, 2 digits)
 *
 * Eliminates the subset digits from all other cells in the shared house.
 *
 * Type 3: roof cells share a line (same row or col)
 * Type 3b: roof cells share a box
 */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // All 4 cells must be empty
    if (masks.some((m) => m === 0)) continue;

    // Find UR pair: intersection of all 4 cells' candidates
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // All cells must have the UR pair
    if (!masks.every((m) => (m & intersect) === intersect)) continue;

    // Two cells exactly the UR pair (floor), two with extras (roof)
    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => masks[i] !== intersect);

    if (floorCells.length !== 2 || roofCells.length !== 2) continue;

    // Extra candidates from each roof cell (beyond UR pair)
    const extrasA = grid.candidatesOf(roofCells[0]!) & ~intersect;
    const extrasB = grid.candidatesOf(roofCells[1]!) & ~intersect;

    if (extrasA === 0 || extrasB === 0) continue;

    // Pseudo-cell mask: union of both roof's extras
    const pseudoMask = extrasA | extrasB;
    const pseudoSize = popcount(pseudoMask);

    // Roof cells must share at least one house
    const roofHouseIndices = getCommonHouseIndices(roofCells[0]!, roofCells[1]!);
    if (roofHouseIndices.length === 0) continue;

    for (const houseIdx of roofHouseIndices) {
      const house = HOUSES[houseIdx]!;

      // Outside cells: in the shared house but not UR cells, and empty
      const outsideCells = house.filter(
        (c) => !cells.includes(c) && grid.get(c) === 0,
      );

      // We need (subsetSize - 1) outside cells where subsetSize = pseudoSize
      // (pseudo-cell counts as 1, so naked pair needs 1 outside, triple needs 2, etc.)
      // For practical purposes, look for naked pair (1 outside) and naked triple (2 outside)

      // Naked pair: pseudoSize <= 2, find 1 outside cell with candidates ⊆ pseudoMask
      if (pseudoSize <= 2) {
        for (const out of outsideCells) {
          const outMask = grid.candidatesOf(out);
          if ((outMask & ~pseudoMask) !== 0) continue; // outside has digits outside pseudo
          if (outMask === 0) continue;

          // pseudo-cell {c,d} + out (⊆ {c,d}) = naked pair
          const subsetCells = new Set([...roofCells, out]);
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (subsetCells.has(c) || cells.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of digitsOf(pseudoMask)) {
              if (grid.hasCandidate(c, d)) {
                eliminations.push({ cell: c, digit: d });
              }
            }
          }
          if (eliminations.length === 0) continue;

          const [x, y] = digitsOf(intersect) as [number, number];
          const extraDigits = digitsOf(pseudoMask).join(', ');
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [...cells, out, ...eliminations.map((e) => e.cell)],
              candidates: [...cells, out].flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type3：UR 对 {${x},${y}}，两底层格的额外候选 {${extraDigits}} 与 ${cellLabel(out)} 构成伪格 naked 对；消去共享房间中其他格的 {${extraDigits}}。`,
              en: `Unique Rectangle Type 3: UR pair {${x},${y}}; roof extras {${extraDigits}} plus ${cellLabel(out)} form a naked pair in the shared house; eliminate {${extraDigits}} from other cells.`,
            },
          };
        }
      }

      // Naked triple: pseudoSize <= 3, find 2 outside cells each with candidates ⊆ pseudoMask
      if (pseudoSize <= 3) {
        for (let i = 0; i < outsideCells.length; i++) {
          const out1 = outsideCells[i]!;
          const out1Mask = grid.candidatesOf(out1);
          if ((out1Mask & ~pseudoMask) !== 0 || out1Mask === 0) continue;

          for (let j = i + 1; j < outsideCells.length; j++) {
            const out2 = outsideCells[j]!;
            const out2Mask = grid.candidatesOf(out2);
            if ((out2Mask & ~pseudoMask) !== 0 || out2Mask === 0) continue;

            // Combined mask of pseudo + out1 + out2 must equal pseudoMask (covered)
            const combinedMask = pseudoMask | out1Mask | out2Mask;
            if (combinedMask !== pseudoMask) continue; // shouldn't happen given above checks

            // pseudo-cell + out1 + out2 = naked triple on pseudoMask
            const subsetCells = new Set([...roofCells, out1, out2]);
            const eliminations: { cell: number; digit: number }[] = [];
            for (const c of house) {
              if (subsetCells.has(c) || cells.includes(c)) continue;
              if (grid.get(c) !== 0) continue;
              for (const d of digitsOf(pseudoMask)) {
                if (grid.hasCandidate(c, d)) {
                  eliminations.push({ cell: c, digit: d });
                }
              }
            }
            if (eliminations.length === 0) continue;

            const [x, y] = digitsOf(intersect) as [number, number];
            const extraDigits = digitsOf(pseudoMask).join(', ');
            return {
              strategyId,
              placements: [],
              eliminations,
              highlights: {
                cells: [...cells, out1, out2, ...eliminations.map((e) => e.cell)],
                candidates: [...cells, out1, out2].flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                ),
                links: [],
              },
              explanation: {
                zh: `唯一矩形 Type3（三元组）：UR 对 {${x},${y}}，额外候选 {${extraDigits}} 与 ${cellLabel(out1)}、${cellLabel(out2)} 构成 naked 三元组；消去共享房间中其他格的相关候选数。`,
                en: `Unique Rectangle Type 3 (triple): UR pair {${x},${y}}; extras {${extraDigits}} plus ${cellLabel(out1)}, ${cellLabel(out2)} form a naked triple; eliminate those digits from other cells in the house.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/**
 * UR Type 5: Extra candidates in exactly two DIAGONAL corners with the SAME
 * single extra digit c. (Adjacent = Type 2; diagonal = Type 5.)
 *
 * Type 5 definition: roof cells are c11+c22 or c12+c21 (diagonal pairs).
 * Each roof has exactly ONE extra digit c (same digit in both).
 * Floor cells (the other two) have ONLY the UR pair.
 *
 * Elimination: c from cells seeing BOTH roof cells.
 * (Since roof cells are diagonal and cross two boxes, the intersection of their
 * peers is limited — targets must see both via row/col overlap.)
 */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    // cells in order: c11(r1,c1), c12(r1,c2), c21(r2,c1), c22(r2,c2)
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // UR pair: common to all four cells
    if (masks.some((m) => m === 0)) continue; // all 4 must be empty
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // All 4 cells must have the UR pair
    if (!masks.every((m) => (m & intersect) === intersect)) continue;

    // Try each diagonal pair as the roof
    // Diagonal 1: c11 (idx 0) and c22 (idx 3)
    // Diagonal 2: c12 (idx 1) and c21 (idx 2)
    for (const [roofIdx0, roofIdx1, floorIdx0, floorIdx1] of [
      [0, 3, 1, 2], // c11 and c22
      [1, 2, 0, 3], // c12 and c21
    ] as [number, number, number, number][]) {
      const roofCellA = cells[roofIdx0]!;
      const roofCellB = cells[roofIdx1]!;
      const floorCellA = cells[floorIdx0]!;
      const floorCellB = cells[floorIdx1]!;

      // Roof cells must be in different rows and different columns (diagonal check)
      if (ROW_OF[roofCellA] === ROW_OF[roofCellB]) continue;
      if (COL_OF[roofCellA] === COL_OF[roofCellB]) continue;

      // Floor cells must have EXACTLY the UR pair
      if (masks[floorIdx0] !== intersect || masks[floorIdx1] !== intersect) continue;

      // Each roof cell must have EXACTLY ONE extra digit beyond the UR pair
      const extraMaskA = masks[roofIdx0]! & ~intersect;
      const extraMaskB = masks[roofIdx1]! & ~intersect;
      if (popcount(extraMaskA) !== 1 || popcount(extraMaskB) !== 1) continue;

      // Both extra digits must be the same digit c
      if (extraMaskA !== extraMaskB) continue;

      const c = digitsOf(extraMaskA)[0]!;

      // Eliminate c from cells seeing BOTH roof cells
      const peersA = new Set(PEERS_OF[roofCellA]!);
      const eliminations: { cell: number; digit: number }[] = [];
      for (const p of PEERS_OF[roofCellB]!) {
        if (!peersA.has(p)) continue;
        if (cells.includes(p)) continue;
        if (grid.get(p) !== 0 || !grid.hasCandidate(p, c)) continue;
        eliminations.push({ cell: p, digit: c });
      }

      if (eliminations.length === 0) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...cells, ...eliminations.map((e) => e.cell)],
          candidates: cells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((d) => ({ cell, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type5：UR 对 {${x},${y}} 中，对角格 ${cellLabel(roofCellA)} 和 ${cellLabel(roofCellB)} 均有相同的额外候选 ${c}；至少其一为 ${c}，消去能同时看到两对角格的格中的 ${c}。`,
          en: `Unique Rectangle Type 5: UR pair {${x},${y}}; diagonal corners ${cellLabel(roofCellA)} and ${cellLabel(roofCellB)} both have extra candidate ${c}; one must be ${c}; eliminate ${c} from cells seeing both diagonal corners.`,
        },
      };
    }
  }
  return null;
}

/**
 * UR Type 6: Extra candidates in two DIAGONAL corners.
 * One UR digit `a` appears ONLY in the two rows AND two columns of the UR
 * (forms an X-Wing on the four UR cells).
 * Placing `a` in a diagonal corner would force `a` into its partner too
 * → deadly pattern. Eliminate `a` from both diagonal corners.
 */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    if (!masks.every((m) => m === 0 || (m & intersect) === intersect)) continue;

    // Find the two roof cells (diagonal extras)
    const roofCells = cells.filter((_, i) => masks[i] !== 0 && masks[i] !== intersect);
    if (roofCells.length !== 2) continue;

    // Roof cells must be diagonal (not in same row, not in same col)
    if (ROW_OF[roofCells[0]!] === ROW_OF[roofCells[1]!]) continue; // same row = not diagonal
    if (COL_OF[roofCells[0]!] === COL_OF[roofCells[1]!]) continue; // same col = not diagonal

    const [x, y] = digitsOf(intersect) as [number, number];
    const r1 = Math.min(ROW_OF[c11]!, ROW_OF[c21]!);
    const r2 = Math.max(ROW_OF[c11]!, ROW_OF[c21]!);
    const col1 = Math.min(COL_OF[c11]!, COL_OF[c12]!);
    const col2 = Math.max(COL_OF[c11]!, COL_OF[c12]!);

    // Check each UR digit for X-Wing confinement
    for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
      const aBit = maskOf(a);

      // Check if `a` forms an X-Wing on the UR cells:
      // In the two UR rows (r1, r2): a must appear ONLY in the two UR columns (col1, col2)
      // AND in the two UR cols (col1, col2): a must appear ONLY in the two UR rows (r1, r2)
      const row1Cands = ROWS[r1]!.filter(
        (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit) !== 0,
      );
      const row2Cands = ROWS[r2]!.filter(
        (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit) !== 0,
      );

      const row1OutsideUR = row1Cands.filter((c) => COL_OF[c] !== col1 && COL_OF[c] !== col2);
      const row2OutsideUR = row2Cands.filter((c) => COL_OF[c] !== col1 && COL_OF[c] !== col2);

      if (row1OutsideUR.length > 0 || row2OutsideUR.length > 0) continue;

      // a is confined to the UR rows/cols → X-Wing constraint holds
      // Placing `a` in a diagonal extra corner forces it into the other diagonal corner too → deadly
      // Eliminate `a` from both diagonal corners (roof cells)
      const eliminations = roofCells
        .filter((c) => grid.hasCandidate(c, a))
        .map((c) => ({ cell: c, digit: a }));

      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells,
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type6：UR 对 {${x},${y}} 中，${a} 仅出现在矩形的两行两列内（X翼形态）；将 ${a} 放入对角底层格会导致双解；消去两对角格的 ${a}。`,
          en: `Unique Rectangle Type 6: UR pair {${x},${y}}; digit ${a} is confined to the UR rows/columns (X-Wing pattern); placing ${a} in a diagonal corner forces a deadly pattern; eliminate ${a} from both diagonal corners.`,
        },
      };
    }
  }
  return null;
}

/**
 * Hidden Unique Rectangle (HUR):
 * One UR corner has no extra candidates (exactly the UR pair).
 * Look at the row and column through the DIAGONALLY OPPOSITE corner.
 * If one UR digit `a` appears nowhere outside the UR in both those houses,
 * eliminate the OTHER UR digit `b` from that diagonally opposite corner.
 *
 * Logic: Both houses through the opposite corner act as conjugate pairs on `a`,
 * forcing that corner to `a` → `b` is excluded from it.
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // Find UR pair: common to all non-zero masks
    const nonZeroMasks = masks.filter((m) => m !== 0);
    if (nonZeroMasks.length < 2) continue;
    let intersect = nonZeroMasks[0]!;
    for (const m of nonZeroMasks) intersect &= m;
    if (popcount(intersect) !== 2) continue;

    // All cells must have the UR pair
    if (!masks.every((m) => m === 0 || (m & intersect) === intersect)) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Find a corner with NO extra candidates (just the UR pair)
    for (let cornerIdx = 0; cornerIdx < 4; cornerIdx++) {
      if (masks[cornerIdx] !== intersect) continue; // must be exactly UR pair

      const pureCorner = cells[cornerIdx]!;
      // The diagonally opposite corner
      const oppIdx = [3, 2, 1, 0][cornerIdx]!; // c11↔c22, c12↔c21
      const oppCorner = cells[oppIdx]!;

      if (masks[oppIdx] === 0) continue; // opposite is already filled

      // Check each UR digit as the "confined" digit a
      for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
        const aBit = maskOf(a);

        // Check: in the row through oppCorner, `a` appears only inside the UR
        const oppRow = ROW_OF[oppCorner]!;
        const oppCol = COL_OF[oppCorner]!;

        const rowCands = ROWS[oppRow]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit) !== 0 && !cells.includes(c),
        );
        if (rowCands.length > 0) continue; // `a` appears outside UR in this row

        const colCands = COLS[oppCol]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & aBit) !== 0 && !cells.includes(c),
        );
        if (colCands.length > 0) continue; // `a` appears outside UR in this col

        // Both houses through oppCorner have `a` only inside the UR
        // → oppCorner must be `a` (conjugate pairs on `a` in both houses)
        // → `b` is eliminated from oppCorner

        if (!grid.hasCandidate(oppCorner, b)) continue;

        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: oppCorner, digit: b }],
          highlights: {
            cells,
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `隐性唯一矩形（HUR）：UR 对 {${x},${y}}，${a} 在 ${cellLabel(oppCorner)} 的行/列中只出现在矩形内；对角格 ${cellLabel(oppCorner)} 必须为 ${a}，故消去 ${b}。`,
            en: `Hidden Unique Rectangle: UR pair {${x},${y}}; digit ${a} appears only within the UR in the row and column through ${cellLabel(oppCorner)}; that corner must be ${a}; eliminate ${b} from it.`,
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
