/**
 * Extended Uniqueness Techniques — UR Type 3, 5, 6 and Hidden UR
 *
 * These build on the existing UR detector (uniqueness.ts).
 * All assume the puzzle has a unique solution (deadly-pattern reasoning).
 *
 * UR Type 3:
 *   Two roof cells share extra candidates forming a pseudo-cell.
 *   If that pseudo-cell + outside cells in a shared house form a naked subset,
 *   eliminate the subset digits from all other cells in that house.
 *
 * UR Type 5:
 *   Extra single digit c in TWO DIAGONAL corners (or three corners).
 *   At least one diagonal corner must hold c → eliminate c from cells seeing ALL extra corners.
 *
 * UR Type 6:
 *   Extra candidates in two DIAGONAL corners. One UR digit 'a' forms an X-Wing
 *   on the UR rows/cols restricted to the four UR cells → eliminate 'a' from both
 *   diagonal extra corners.
 *
 * Hidden Unique Rectangle (HUR):
 *   Pick a UR corner without extra candidates (a "plain" corner).
 *   Look at the two houses (row + column) through the diagonally opposite corner.
 *   If one UR digit 'a' appears ONLY inside the UR in BOTH those houses,
 *   then eliminate the OTHER UR digit 'b' from the diagonally opposite corner.
 *
 * E3: These types share the allRectangles() generator with uniqueness.ts.
 * Rather than duplicating it, we re-implement it here (same logic).
 */

import {
  HOUSES, ROWS, COLS, BOXES,
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

/** Common houses shared by two cells. Returns house indices (0-8 rows, 9-17 cols, 18-26 boxes). */
function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

// ============================================================
// UR Type 3
// ============================================================

/**
 * UR Type 3: Two roof cells have extra candidates; treat them as a pseudo-cell.
 * If the pseudo-cell + some outside cells in a shared house form a naked subset,
 * eliminate those subset digits from all other cells in the house.
 */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // Need at least one empty cell
    if (masks.every((m) => m === 0)) continue;

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Find roof cells (have extra candidates beyond the UR pair) and floor cells (exactly UR pair)
    const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    const floorCells = cells.filter((_, i) => masks[i] === intersect);

    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    // Both roof cells must have the UR pair as a subset
    if (!roofCells.every((c) => (grid.candidatesOf(c) & intersect) === intersect)) continue;

    // The pseudo-cell contains the UNION of extra candidates (outside the UR pair)
    const extra0 = grid.candidatesOf(roofCells[0]!) & ~intersect;
    const extra1 = grid.candidatesOf(roofCells[1]!) & ~intersect;
    const pseudoMask = extra0 | extra1;

    if (pseudoMask === 0) continue;

    // The pseudo-cell acts as a single "cell" with these candidates
    // Find a shared house of the two roof cells
    for (const houseIdx of getCommonHouses(roofCells[0]!, roofCells[1]!)) {
      const house = HOUSES[houseIdx]!;

      // Find all cells in the house that are empty, not the roof cells, and not the floor cells
      const outsideCells = house.filter(
        (c) => grid.get(c) === 0 && !cells.includes(c),
      );

      // Look for naked subsets: pseudo-cell + subset of outside cells
      // The naked subset size k: pseudoMask contributes 1 "virtual cell",
      // we need k-1 more cells so that together they cover exactly k digits.
      const subsetSize = popcount(pseudoMask);
      if (subsetSize < 2 || subsetSize > 4) continue; // only pair/triple/quad

      // Try all combinations of (subsetSize-1) outside cells
      for (const combo of combineFromArray(outsideCells, subsetSize - 1)) {
        // Union of candidates: pseudo-cell union + combo cells
        let unionMask = pseudoMask;
        for (const c of combo) unionMask |= grid.candidatesOf(c);

        if (popcount(unionMask) !== subsetSize) continue;

        // Found a naked subset: pseudo-cell + combo cells have exactly subsetSize digits in common
        // Eliminate subsetDigits from all other cells in the house (outside the UR cells AND combo)
        const subsetCellSet = new Set([...cells, ...combo]);
        const eliminations: { cell: number; digit: number }[] = [];
        for (const c of house) {
          if (subsetCellSet.has(c)) continue;
          if (grid.get(c) !== 0) continue;
          for (const d of digitsOf(unionMask)) {
            if (grid.hasCandidate(c, d)) eliminations.push({ cell: c, digit: d });
          }
        }

        if (eliminations.length === 0) continue;

        const [x, y] = digitsOf(intersect) as [number, number];
        const houseLabel = houseIdx < 9 ? `行 ${houseIdx + 1}` : houseIdx < 18 ? `列 ${houseIdx - 8}` : `宫 ${houseIdx - 17}`;
        const houseDesc = houseIdx < 9 ? `row ${houseIdx + 1}` : houseIdx < 18 ? `column ${houseIdx - 8}` : `box ${houseIdx - 17}`;
        const extraDigits = digitsOf(unionMask).join(',');

        return {
          strategyId,
          placements: [],
          eliminations,
          highlights: {
            cells: [...cells, ...combo, ...eliminations.map((e) => e.cell)],
            candidates: [
              ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...eliminations,
            ],
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type3：UR对 {${x},${y}}，两个顶层格的额外候选数（${extraDigits}）视为伪单元格；在${houseLabel}中与其他 ${combo.length} 格构成 ${subsetSize} 数裸数组，消去该${houseLabel}其余格的 ${extraDigits}。`,
            en: `Unique Rectangle Type 3: UR pair {${x},${y}}; extra candidates {${extraDigits}} of the two roof cells form a pseudo-cell; naked subset of size ${subsetSize} in ${houseDesc} — eliminate {${extraDigits}} from other cells in that house.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================
// UR Type 5
// ============================================================

/**
 * UR Type 5: Extra single digit c in TWO DIAGONAL (or three) corners.
 * At least one of those corners must hold c. Eliminate c from cells that see ALL extra corners.
 */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    if (masks.every((m) => m === 0)) continue;

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Find cells with extra candidates and cells with exactly UR pair
    const extraCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    // All extra cells must contain the UR pair as subset
    if (!extraCells.every((c) => (grid.candidatesOf(c) & intersect) === intersect)) continue;

    // Each extra cell must have exactly ONE extra digit (UR pair + one more)
    const extraDigitsPerCell = extraCells.map((c) => {
      const extraMask = grid.candidatesOf(c) & ~intersect;
      return popcount(extraMask) === 1 ? digitsOf(extraMask)[0] : null;
    });
    if (extraDigitsPerCell.some((d) => d === null)) continue;

    // All extra cells must have the SAME extra digit c
    const c = extraDigitsPerCell[0]!;
    if (!extraDigitsPerCell.every((d) => d === c)) continue;

    // Check: extra cells must be diagonal (not adjacent = not same row/col)
    // Type 5: two diagonal or three corners
    if (extraCells.length < 2 || extraCells.length > 3) continue;
    if (extraCells.length === 2) {
      // Must be diagonal (different rows AND different cols)
      const [e0, e1] = extraCells as [number, number];
      if (ROW_OF[e0] === ROW_OF[e1] || COL_OF[e0] === COL_OF[e1]) continue; // adjacent, not diagonal
    }

    // Eliminate c from cells seeing ALL extra corners
    const cBit = maskOf(c);
    const eliminations: { cell: number; digit: number }[] = [];

    // Find cells that see all extra corners
    // A cell sees a corner if it's a peer or equals that corner's house
    const peerSets = extraCells.map((e) => new Set(PEERS_OF[e]!));

    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & cBit)) continue;
      if (extraCells.includes(cell)) continue;
      if (!extraCells.every((e) => cell !== e && PEERS_OF[cell]!.includes(e))) continue;
      eliminations.push({ cell, digit: c });
    }

    if (eliminations.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    const cornerDesc = extraCells.map(cellLabel).join(', ');

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...cells, ...eliminations.map((e) => e.cell)],
        candidates: cells.flatMap((ce) => digitsOf(grid.candidatesOf(ce)).map((d) => ({ cell: ce, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type5：UR对 {${x},${y}}，对角格 ${cornerDesc} 各有额外候选数 ${c}；其中至少一个为 ${c}，可见所有对角格的格中消去 ${c}。`,
        en: `Unique Rectangle Type 5: UR pair {${x},${y}}; diagonal corners ${cornerDesc} each carry extra digit ${c}; at least one must hold ${c} — eliminate ${c} from cells seeing all extra corners.`,
      },
    };
  }
  return null;
}

// ============================================================
// UR Type 6
// ============================================================

/**
 * UR Type 6: Extra candidates in TWO DIAGONAL corners. One UR digit 'a' appears only
 * in the UR cells within the UR rows and columns (forming an X-Wing on 'a').
 * Eliminate 'a' from BOTH diagonal extra corners.
 */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    if (masks.every((m) => m === 0)) continue;

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Find exactly 2 extra cells (the rest must be exactly UR pair)
    const extraCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    const floorCells = cells.filter((_, i) => masks[i] === intersect);

    if (extraCells.length !== 2 || floorCells.length !== 2) continue;

    // Extra cells must be DIAGONAL (different row AND column)
    const [e0, e1] = extraCells as [number, number];
    if (ROW_OF[e0] === ROW_OF[e1] || COL_OF[e0] === COL_OF[e1]) continue;

    // All cells must have the UR pair as a subset
    if (!extraCells.every((c) => (grid.candidatesOf(c) & intersect) === intersect)) continue;

    const [a, b] = digitsOf(intersect) as [number, number];

    // Check each UR digit: does it form an X-Wing in the UR rows and cols?
    for (const [locked, toElim] of [[a, b], [b, a]] as [number, number][]) {
      const lockedBit = maskOf(locked);

      // 'locked' must appear only in the UR cells within the UR rows
      const r0 = ROW_OF[c11]!;
      const r1 = ROW_OF[c21]!;
      const col0 = COL_OF[c11]!;
      const col1 = COL_OF[c12]!;

      // Check row r0: locked must only appear in UR cells (c11 and c12)
      const row0Others = ROWS[r0]!.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit));
      if (row0Others.length !== 0) continue;

      // Check row r1: locked must only appear in UR cells (c21 and c22)
      const row1Others = ROWS[r1]!.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit));
      if (row1Others.length !== 0) continue;

      // Also check columns for X-Wing
      const col0Others = COLS[col0]!.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit));
      const col1Others = COLS[col1]!.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit));
      // Both checks optional: the X-Wing on rows is sufficient

      // 'locked' is confined to the UR cells in its rows → X-Wing pattern
      // Eliminate 'toElim' from the extra (diagonal) corners
      const elimBit = maskOf(toElim);
      const eliminations = extraCells
        .filter((c) => (grid.candidatesOf(c) & elimBit) !== 0)
        .map((c) => ({ cell: c, digit: toElim }));

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
          zh: `唯一矩形 Type6：UR对 {${a},${b}} 中，${locked} 在矩形的行中形成 X 翼，被锁定在矩形内；消去对角格中的 ${toElim}（否则形成致死图案）。`,
          en: `Unique Rectangle Type 6: UR pair {${a},${b}}; digit ${locked} forms an X-Wing confined to the UR cells in those rows, so ${toElim} can be eliminated from the diagonal extra corners (to avoid the deadly pattern).`,
        },
      };
    }
  }
  return null;
}

// ============================================================
// Hidden Unique Rectangle (HUR)
// ============================================================

/**
 * Hidden Unique Rectangle:
 * Allow 2-3 corners to carry arbitrary extra candidates.
 * Pick a UR corner WITHOUT extra candidates (just the UR pair, or even one cell
 * with no extras = "plain corner").
 * Look at the row and column through the diagonally opposite corner.
 * If one UR digit 'a' appears NOWHERE outside the UR in BOTH those houses →
 * Eliminate the OTHER UR digit 'b' from the diagonally opposite corner.
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    if (masks.every((m) => m === 0)) continue;

    // Find the UR pair: common 2-digit mask across all non-empty corners
    const nonZeroMasks = masks.filter((m) => m !== 0);
    if (nonZeroMasks.length < 2) continue;
    let intersect = nonZeroMasks[0]!;
    for (const m of nonZeroMasks) intersect &= m;
    if (popcount(intersect) !== 2) continue;

    // For each "plain corner" (exactly UR pair, no extras) as the anchor,
    // the diagonally opposite corner is the target.
    // Diagonal pairs: (c11,c22) and (c12,c21)
    const diagonalPairs: [number, number][] = [
      [c11, c22],
      [c12, c21],
    ];

    for (const [anchor, opposite] of diagonalPairs) {
      // Anchor must be empty and have exactly the UR pair (no extras)
      if (grid.get(anchor) !== 0) continue;
      const anchorMask = grid.candidatesOf(anchor);
      if (anchorMask !== intersect) continue; // anchor must have EXACTLY the UR pair

      // Opposite must be empty and contain the UR pair (may have extras)
      if (grid.get(opposite) !== 0) continue;
      const oppMask = grid.candidatesOf(opposite);
      if ((oppMask & intersect) !== intersect) continue;

      const [a, b] = digitsOf(intersect) as [number, number];

      // Check each UR digit: is it confined to the UR cells in the row AND column of 'opposite'?
      for (const [confined, toElim] of [[a, b], [b, a]] as [number, number][]) {
        const confinedBit = maskOf(confined);
        const oppRow = ROW_OF[opposite]!;
        const oppCol = COL_OF[opposite]!;

        // In the row of 'opposite': confined should appear only in UR cells of that row
        const rowUrCells = cells.filter((c) => ROW_OF[c] === oppRow);
        const rowNonUrWithConfined = ROWS[oppRow]!.filter(
          (c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & confinedBit),
        );
        if (rowNonUrWithConfined.length !== 0) continue;

        // In the column of 'opposite': confined should appear only in UR cells of that col
        const colUrCells = cells.filter((c) => COL_OF[c] === oppCol);
        const colNonUrWithConfined = COLS[oppCol]!.filter(
          (c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & confinedBit),
        );
        if (colNonUrWithConfined.length !== 0) continue;

        // Confined to UR in both the row and col of 'opposite' → eliminate toElim from opposite
        const elimBit = maskOf(toElim);
        if (!(oppMask & elimBit)) continue;

        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: opposite, digit: toElim }],
          highlights: {
            cells,
            candidates: cells.flatMap((c) =>
              grid.get(c) === 0 ? digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })) : [],
            ),
            links: [],
          },
          explanation: {
            zh: `隐性唯一矩形（HUR）：UR对 {${a},${b}}，${confined} 在对角格 ${cellLabel(opposite)} 的行与列中均被限制在矩形内；消去对角格中的 ${toElim} 以避免致死图案。`,
            en: `Hidden Unique Rectangle: UR pair {${a},${b}}; digit ${confined} is confined to UR cells in both the row and column of ${cellLabel(opposite)}; eliminate ${toElim} from that corner to avoid the deadly pattern.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================
// Helper: combinations
// ============================================================

function* combineFromArray<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) { yield []; return; }
  if (arr.length < size) return;
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

// ============================================================
// Exported strategies
// ============================================================

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
