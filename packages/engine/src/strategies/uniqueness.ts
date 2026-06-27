/**
 * Uniqueness Techniques (T4, optional) — 唯一性技巧
 *
 * These techniques assume the puzzle has a UNIQUE solution. They look for
 * "deadly patterns" that would allow multiple solutions, and eliminate
 * candidates that would create such patterns.
 *
 * Patterns implemented:
 *
 * Unique Rectangle (UR) Types 1-5:
 *   Four cells forming a rectangle in two rows, two columns, spanning exactly
 *   two boxes. If two digits appear as candidates in all four corners, this
 *   would create a deadly pattern → eliminate based on extra candidates.
 *
 * BUG+1 (Bivalue Universal Grave + 1):
 *   If all but one cell would be bivalue, the remaining cell's extra digit
 *   must be placed to avoid a deadly pattern.
 *
 * Note: Avoidable Rectangle is skipped (requires knowledge of givens vs deduced).
 * Uniqueness tactics assume the puzzle has a unique solution. Enable/disable
 * them by including or omitting this strategy in the list passed to solve();
 * it is registered in STRATEGIES by default, since standard competition
 * puzzles always have a unique solution.
 */

import {
  CELLS, ROWS, COLS, BOXES,
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
          // Cells: (r1,c1), (r1,c2), (r2,c1), (r2,c2)
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          // Must span exactly 2 boxes (not 4)
          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

/** UR Type 1: Three corners have exactly digits {X,Y}, one corner has extra candidates.
 * Eliminate X and Y from the floor corner (the one with extra candidates). */
function tryURType1(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];

    // Collect candidate masks
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    // Find the common 2-digit mask across all corners
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Check exactly 3 corners have exactly the UR pair
    const exactMatch = cells.filter((c, i) => masks[i] === intersect);
    const floorCells = cells.filter((c, i) => masks[i] !== intersect && masks[i] !== 0);

    if (exactMatch.length !== 3 || floorCells.length !== 1) continue;

    const floor = floorCells[0]!;
    const floorMask = grid.candidatesOf(floor);
    if ((floorMask & intersect) === 0) continue; // floor doesn't even have the UR pair

    // Type 1: floor has extra candidates. Eliminate UR pair from floor.
    const urDigits = digitsOf(intersect);
    const elims = urDigits
      .filter((d) => grid.hasCandidate(floor, d))
      .map((d) => ({ cell: floor, digit: d }));

    if (elims.length === 0) continue;

    const [x, y] = urDigits as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: {
        cells,
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type1：四个角格中三格仅含 {${x},${y}}，若第四格（R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1}）也只有 {${x},${y}} 则产生双解；消去该格的 ${urDigits.join(',')}。`,
        en: `Unique Rectangle Type 1: three corners contain only {${x},${y}}; if the floor R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} also has only {${x},${y}}, there are two solutions; eliminate ${urDigits.join(',')} from the floor.`,
      },
    };
  }
  return null;
}

/** UR Type 2: Two floor cells (same row or col) each have exactly one extra
 * candidate beyond the UR pair, and that extra candidate is the SAME digit Z.
 * Eliminate Z from cells seeing both floor cells. */
function tryURType2(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two cells have exactly the UR pair, two cells have UR pair + 1 extra digit
    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);

    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    // Each floor cell must have exactly UR pair + 1 extra digit
    const extras = floorCells.map((c) => {
      const mask = grid.candidatesOf(c);
      const extraMask = mask & ~intersect;
      return { cell: c, extraMask, count: popcount(extraMask) };
    });

    if (extras.some((e) => e.count !== 1)) continue;

    // Both extra digits must be the same
    if (extras[0]!.extraMask !== extras[1]!.extraMask) continue;

    const z = digitsOf(extras[0]!.extraMask)[0]!;

    // Eliminate z from cells seeing both floor cells
    const peersF1 = new Set(PEERS_OF[floorCells[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of PEERS_OF[floorCells[1]!]!) {
      if (!peersF1.has(c)) continue;
      if (c === floorCells[0] || c === floorCells[1]) continue;
      if (!grid.hasCandidate(c, z)) continue;
      elims.push({ cell: c, digit: z });
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
        zh: `唯一矩形 Type2：两个底层格均含额外候选数 ${z}（UR对 {${x},${y}}）；必须填入 ${z} 以避免双解；消去能看到两底层格的格中的 ${z}。`,
        en: `Unique Rectangle Type 2: both floor cells have extra candidate ${z} (UR pair {${x},${y}}); ${z} must go in one floor cell to avoid dual solutions; eliminate ${z} from cells seeing both floor cells.`,
      },
    };
  }
  return null;
}

/** UR Type 4: Two floor cells share the UR pair + maybe more candidates, but
 * in the row/col/box containing the floor cells, one of the UR digits X can
 * ONLY appear in the floor cells. Then X is locked there → Y can be eliminated
 * from both floor cells. */
function tryURType4(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two roof cells have exactly UR pair
    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });

    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Check each UR digit: is it confined to floor cells in some house?
    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);

      // Check if floor cells share a house where locked is only in floor cells
      for (const houseIdx of getCommonHouses(floorCells[0]!, floorCells[1]!)) {
        const house = HOUSES[houseIdx]!;
        const lockedInHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);

        // locked must appear ONLY in the floor cells of this house
        const nonFloorWithLocked = lockedInHouse.filter((c) => !floorCells.includes(c));
        if (nonFloorWithLocked.length !== 0) continue;

        // Locked is confined to floor → Y can be eliminated from floor cells
        const elimBit = maskOf(elim);
        const elims = floorCells
          .filter((c) => grid.hasCandidate(c, elim))
          .map((c) => ({ cell: c, digit: elim }));

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
            zh: `唯一矩形 Type4：UR对 {${x},${y}} 中，${locked} 在底层格共享宫/行/列中只出现在底层格；底层格必须为 ${locked}，故消去底层格的 ${elim}。`,
            en: `Unique Rectangle Type 4: UR pair {${x},${y}}; ${locked} is confined to floor cells in their shared house, so floor cells must be ${locked}; eliminate ${elim} from floor cells.`,
          },
        };
      }
    }
  }
  return null;
}

import { HOUSES } from '../grid.js';

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

/**
 * BUG+1: If all but one empty cell has exactly 2 candidates, and one cell has
 * 3 candidates, placing the digit that appears 3 times across houses (the BUG
 * digit) in the triple-candidate cell resolves the BUG.
 *
 * More precisely: in a BUG position, if we count the number of times each
 * candidate appears in each house, one digit appears an ODD number of times
 * in more than one house — that's the BUG+1 digit and it must go in the
 * special cell.
 */
function tryBUGPlus1(grid: Grid, strategyId: string): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) emptyCells.push(c);
  }

  // Find cells with ≠ 2 candidates
  const nonBivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);

  // BUG+1: exactly one cell has more than 2 candidates (typically 3)
  if (nonBivalue.length !== 1) return null;

  const specialCell = nonBivalue[0]!;
  const specialMask = grid.candidatesOf(specialCell);
  if (popcount(specialMask) !== 3) return null; // Must be exactly 3 for BUG+1

  // Verify all other empty cells are bivalue
  if (emptyCells.some((c) => c !== specialCell && popcount(grid.candidatesOf(c)) !== 2)) return null;

  // Find the BUG digit: the digit that appears an odd number of times across
  // all houses when we include the special cell
  // In a true BUG+1, exactly one digit in the special cell appears an odd
  // number of times in some house. That digit must be placed in the special cell.
  const bugDigits: number[] = [];

  for (const d of digitsOf(specialMask)) {
    const bit = maskOf(d);
    let isOddInAnyHouse = false;

    for (const houseIdx of [ROW_OF[specialCell]!, 9 + COL_OF[specialCell]!, 18 + BOX_OF[specialCell]!]) {
      const house = HOUSES[houseIdx]!;
      const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
      if (count % 2 === 1) {
        isOddInAnyHouse = true;
        break;
      }
    }

    if (isOddInAnyHouse) bugDigits.push(d);
  }

  if (bugDigits.length !== 1) return null;

  const bugDigit = bugDigits[0]!;

  return {
    strategyId,
    placements: [{ cell: specialCell, digit: bugDigit }],
    eliminations: [],
    highlights: {
      cells: [specialCell],
      candidates: digitsOf(specialMask).map((d) => ({ cell: specialCell, digit: d })),
      links: [],
    },
    explanation: {
      zh: `BUG+1：全局仅 R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} 有三个候选数，其中 ${bugDigit} 在某宫/行/列中出现奇数次（BUG数）；必须填入 ${bugDigit} 以保证唯一解。`,
      en: `BUG+1: only R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} has 3 candidates; digit ${bugDigit} appears an odd number of times in a house (BUG digit); must place ${bugDigit} to maintain unique solution.`,
    },
  };
}

export const bugPlusOne: Strategy = {
  id: 'bug-plus-one',
  name: { zh: 'BUG+1', en: 'BUG+1' },
  difficulty: 910,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBUGPlus1(grid, 'bug-plus-one');
  },
};

export const uniqueRectangleType1: Strategy = {
  id: 'unique-rectangle-type-1',
  name: { zh: '唯一矩形 Type 1', en: 'Unique Rectangle Type 1' },
  difficulty: 920,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType1(grid, 'unique-rectangle-type-1');
  },
};

export const uniqueRectangleType2: Strategy = {
  id: 'unique-rectangle-type-2',
  name: { zh: '唯一矩形 Type 2', en: 'Unique Rectangle Type 2' },
  difficulty: 930,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType2(grid, 'unique-rectangle-type-2');
  },
};

export const uniqueRectangleType4: Strategy = {
  id: 'unique-rectangle-type-4',
  name: { zh: '唯一矩形 Type 4', en: 'Unique Rectangle Type 4' },
  difficulty: 950,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType4(grid, 'unique-rectangle-type-4');
  },
};

// ===========================================================================
// P1 uniqueness extensions — Hidden UR, UR Type 3/5/6, Extended UR,
// Unique Loop, BUG-lite / BUG+n, Avoidable Rectangle 1–4.
//
// All UR/EUR/loop variants rely on the deadly-pattern argument and need NO
// given-vs-solved distinction. Avoidable Rectangle DOES need that distinction
// (see avoidable-rectangle.md); the Grid foundation tracks no givens, so the AR
// detectors are registered but conservatively inactive (return null) to stay
// sound. See docs/notes/p1.md.
// ===========================================================================

/** Cells of a candidate digit d confined to the 4 UR cells within house H. */
function confinedToUrInHouse(grid: Grid, d: number, houseIdx: number, urSet: Set<number>): boolean {
  const bit = maskOf(d);
  for (const c of HOUSES[houseIdx]!) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (!urSet.has(c)) return false;
  }
  return true;
}

/** Hidden Unique Rectangle (HUR): pure start corner + diagonal opposite whose
 *  row & column confine one UR digit to the UR cells → eliminate the other UR
 *  digit from the opposite corner. */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    if (masks.some((m) => m === 0)) continue;
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    const [a, b] = digitsOf(intersect) as [number, number];
    const urSet = new Set(cells);

    // Two diagonals: (c11,c22) and (c12,c21). For each, treat one pure end as
    // the "start" and the other as the "opposite".
    const diagonals: Array<[number, number]> = [
      [c11, c22],
      [c12, c21],
      [c22, c11],
      [c21, c12],
    ];
    for (const [start, opp] of diagonals) {
      const startMask = grid.candidatesOf(start);
      if (startMask !== intersect) continue; // start must be a pure floor corner
      const dRow = ROW_OF[opp]!;
      const dCol = 9 + COL_OF[opp]!;
      // try eliminating each UR digit: if the OTHER digit is confined to UR in
      // both of opp's row & col, eliminate the confined one's partner from opp.
      for (const [confined, elim] of [
        [a, b],
        [b, a],
      ] as [number, number][]) {
        if (confinedToUrInHouse(grid, confined, dRow, urSet) && confinedToUrInHouse(grid, confined, dCol, urSet)) {
          if (grid.hasCandidate(opp, elim)) {
            return {
              strategyId,
              placements: [],
              eliminations: [{ cell: opp, digit: elim }],
              highlights: {
                cells: [...cells, opp],
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [
                  { from: { cell: start, digit: confined }, to: { cell: opp, digit: confined }, type: 'strong' },
                ],
              },
              explanation: {
                zh: `隐性唯一矩形：UR对 {${a},${b}}，起始纯角 R${ROW_OF[start]! + 1}C${COL_OF[start]! + 1} 对角 R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} 的行列均把 ${confined} 锁在UR内；故该对角格不能为 ${elim}，消去 ${elim}。`,
                en: `Hidden Unique Rectangle: UR pair {${a},${b}}; pure corner R${ROW_OF[start]! + 1}C${COL_OF[start]! + 1}, diagonal R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} has ${confined} confined to the UR in its row & column; eliminate ${elim} from it.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/** UR Type 3: the roof-extras-as-naked-subset reduction has a subtle soundness
 *  condition (the roof contributes "at least one" extra, not "all" extras, so a
 *  naive naked-pair over the roof pseudo-cell is unsound). Pending a precise
 *  implementation of the locked-subset variant, this detector is conservatively
 *  inactive (sound no-op). See docs/notes/p1.md. */
function tryURType3(_grid: Grid, _strategyId: string): Step | null {
  return null;
}

/** UR Type 5: single extra digit c on two DIAGONAL corners → eliminate c from
 *  cells seeing both. */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    if (masks.some((m) => m === 0)) continue;
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two diagonals; check each as the pair carrying one shared extra digit.
    const diagonals: Array<[number, number, number, number]> = [
      [c11, c22, c12, c21],
      [c12, c21, c11, c22],
    ];
    for (const [d1c, d2c, f1, f2] of diagonals) {
      // The two non-diagonal corners must be pure floor
      if (grid.candidatesOf(f1) !== intersect || grid.candidatesOf(f2) !== intersect) continue;
      const e1 = grid.candidatesOf(d1c) & ~intersect;
      const e2 = grid.candidatesOf(d2c) & ~intersect;
      if (popcount(e1) !== 1 || e1 !== e2) continue;
      const c = digitsOf(e1)[0]!;
      const peers1 = new Set(PEERS_OF[d1c]!);
      const elims: { cell: number; digit: number }[] = [];
      for (const cc of PEERS_OF[d2c]!) {
        if (cc === d1c || cc === d2c) continue;
        if (peers1.has(cc) && grid.hasCandidate(cc, c)) elims.push({ cell: cc, digit: c });
      }
      if (elims.length === 0) continue;
      const [a, b] = digitsOf(intersect) as [number, number];
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...cells, ...elims.map((e) => e.cell)],
          candidates: cells.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((d) => ({ cell: cc, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type5：UR对 {${a},${b}} 的对角两角各含额外候选 ${c}；其一必为 ${c}，消去同时看到两角的格的 ${c}。`,
          en: `Unique Rectangle Type 5: UR pair {${a},${b}} with extra ${c} on two diagonal corners; one must be ${c}; eliminate ${c} from cells seeing both.`,
        },
      };
    }
  }
  return null;
}

/** UR Type 6: extras on two diagonal corners; one UR digit forms an X-Wing on
 *  the 4 UR cells → eliminate that UR digit from both diagonal extra corners. */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    if (masks.some((m) => m === 0)) continue;
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    const [a, b] = digitsOf(intersect) as [number, number];
    const urSet = new Set(cells);

    const diagonals: Array<[number, number, number, number]> = [
      [c11, c22, c12, c21],
      [c12, c21, c11, c22],
    ];
    for (const [d1c, d2c, f1, f2] of diagonals) {
      if (grid.candidatesOf(f1) !== intersect || grid.candidatesOf(f2) !== intersect) continue;
      if ((grid.candidatesOf(d1c) & ~intersect) === 0) continue;
      if ((grid.candidatesOf(d2c) & ~intersect) === 0) continue;
      // one UR digit forms X-Wing (confined to UR across the two UR rows & cols)
      for (const x of [a, b]) {
        const r1 = ROW_OF[c11]!, r2 = ROW_OF[c21]!;
        const col1 = 9 + COL_OF[c11]!, col2 = 9 + COL_OF[c12]!;
        if (
          confinedToUrInHouse(grid, x, r1, urSet) &&
          confinedToUrInHouse(grid, x, r2, urSet) &&
          confinedToUrInHouse(grid, x, col1, urSet) &&
          confinedToUrInHouse(grid, x, col2, urSet)
        ) {
          const elims: { cell: number; digit: number }[] = [];
          if (grid.hasCandidate(d1c, x)) elims.push({ cell: d1c, digit: x });
          if (grid.hasCandidate(d2c, x)) elims.push({ cell: d2c, digit: x });
          if (elims.length === 0) continue;
          return {
            strategyId,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((d) => ({ cell: cc, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type6：UR对 {${a},${b}}；${x} 在UR四格构成X-Wing，对角额外角填 ${x} 会致双解；消去两对角额外角的 ${x}。`,
              en: `Unique Rectangle Type 6: UR pair {${a},${b}}; ${x} forms an X-Wing on the UR cells; placing ${x} in a diagonal extra corner forces the deadly swap; eliminate ${x} from both diagonal extra corners.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/** Extended Unique Rectangle (2×3): six cells in 3 rows ∩ 3 cols ∩ 3 boxes with
 *  union of candidates exactly 3 digits {a,b,c}. Type 1: one cell has an extra
 *  → eliminate {a,b,c} from it. Type 2: two roof cells each carry one shared
 *  extra d → eliminate d from cells seeing both roof cells. */
function tryExtendedUR(grid: Grid, strategyId: string): Step | null {
  // Orientation A: 2 rows × 3 cols (rows in same box-row → 3 boxes via 3 cols).
  for (let br = 0; br < 3; br++) {
    for (const [r1, r2] of pairs2([br * 3, br * 3 + 1, br * 3 + 2])) {
      for (const cols of combinations3([0, 1, 2, 3, 4, 6, 7, 8].length ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [])) {
        if (new Set(cols.map((c) => Math.floor(c / 3))).size !== 3) continue;
        const six = cols.flatMap((c) => [r1 * 9 + c, r2 * 9 + c]);
        const step = tryEURCells(grid, six, strategyId, 'row');
        if (step) return step;
      }
    }
  }
  // Orientation B: 3 rows × 2 cols (cols in same box-col → 3 boxes).
  for (let bc = 0; bc < 3; bc++) {
    for (const [c1, c2] of pairs2([bc * 3, bc * 3 + 1, bc * 3 + 2])) {
      for (const rows of combinations3([0, 1, 2, 3, 4, 5, 6, 7, 8])) {
        if (new Set(rows.map((r) => Math.floor(r / 3))).size !== 3) continue;
        const six = rows.flatMap((r) => [r * 9 + c1, r * 9 + c2]);
        const step = tryEURCells(grid, six, strategyId, 'col');
        if (step) return step;
      }
    }
  }
  return null;
}

function tryEURCells(
  grid: Grid,
  six: number[],
  strategyId: string,
  orient: 'row' | 'col',
): Step | null {
  if (six.some((c) => grid.get(c) !== 0)) return null;
  let unionMask = 0;
  for (const c of six) unionMask |= grid.candidatesOf(c);
  if (popcount(unionMask) < 3) return null;
  // find any 3-digit subset {a,b,c} of unionMask that EXACTLY covers all six cells
  const unionDigits = digitsOf(unionMask);
  for (const trip of combinationsK(unionDigits, 3)) {
    const tripMask = trip.reduce((m, d) => m | maskOf(d), 0);
    // every cell's candidates ⊆ tripMask
    if (!six.every((c) => (grid.candidatesOf(c) & ~tripMask) === 0)) continue;
    // Type 1: exactly one cell has extras beyond tripMask... but we required none
    // beyond tripMask. Type 1 = one cell's mask ≠ tripMask union... i.e. one cell
    // has a candidate outside {a,b,c}? That can't be (we required ⊆ tripMask).
    // So Type 1 (extra beyond deadly) means a cell whose mask includes a digit
    // OUTSIDE trip — handled by re-checking with the ORIGINAL union.
    void tripMask;
  }
  // Type 1 recompute: choose deadly digits = the 3 most-common; a cell with an
  // extra digit (not in the deadly triple) → eliminate the deadly triple from it.
  for (const trip of combinationsK(unionDigits, 3)) {
    const tripMask = trip.reduce((m, d) => m | maskOf(d), 0);
    // all six cells must be ABLE to hold only trip (candidates ⊆ trip ∪ extras)
    // and at least the deadly core must be {a,b,c}. A cell has "extra" if it has
    // a candidate outside trip.
    const extras = six.filter((c) => (grid.candidatesOf(c) & ~tripMask) !== 0);
    // Deadly core: cells without extras must collectively cover trip. Require
    // the non-extra cells alone already span trip (so triple is "locked").
    const coreCells = six.filter((c) => (grid.candidatesOf(c) & ~tripMask) === 0);
    let coreUnion = 0;
    for (const c of coreCells) coreUnion |= grid.candidatesOf(c);
    if (popcount(coreUnion) !== 3 || coreUnion !== tripMask) continue;
    if (extras.length === 1) {
      // Type 1: eliminate trip from the extra cell
      const e = extras[0]!;
      const elims = trip.filter((d) => grid.hasCandidate(e, d)).map((d) => ({ cell: e, digit: d }));
      if (elims.length === 0) continue;
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...six, e],
          candidates: six.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `扩展唯一矩形（2×3）：六格三数 {${trip.join(',')}} 致死图案，单格带额外候选；消去该格的 ${trip.join(',')}。`,
          en: `Extended UR (2×3): six cells / three digits {${trip.join(',')}} deadly; one cell carries an extra candidate; eliminate ${trip.join(',')} from it.`,
        },
      };
    }
    if (extras.length === 2) {
      // Type 2: both extra cells carry the SAME single extra digit d
      const e1m = grid.candidatesOf(extras[0]!) & ~tripMask;
      const e2m = grid.candidatesOf(extras[1]!) & ~tripMask;
      if (e1m === e2m && popcount(e1m) === 1) {
        const d = digitsOf(e1m)[0]!;
        const peers1 = new Set(PEERS_OF[extras[0]!]!);
        const elims: { cell: number; digit: number }[] = [];
        for (const cc of PEERS_OF[extras[1]!]!) {
          if (cc === extras[0] || cc === extras[1]) continue;
          if (peers1.has(cc) && grid.hasCandidate(cc, d)) elims.push({ cell: cc, digit: d });
        }
        if (elims.length === 0) continue;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...six, ...elims.map((e) => e.cell)],
            candidates: six.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))),
            links: [],
          },
          explanation: {
            zh: `扩展唯一矩形 Type2：六格三数致死图案，双翼格各带额外候选 ${d}；其一必为 ${d}，消去同时看到两翼的格的 ${d}。`,
            en: `Extended UR Type 2: six/three deadly pattern; both roof cells carry extra ${d}; eliminate ${d} from cells seeing both roofs.`,
          },
        };
      }
    }
    void orient;
  }
  return null;
}

/** Unique Loop (Type 1): an even bivalue cycle on {a,b} (≥6 cells) where exactly
 *  one cell carries an extra candidate → eliminate {a,b} from that cell. */
function tryUniqueLoop(grid: Grid, strategyId: string): Step | null {
  for (let a = 1; a <= 9; a++) {
    for (let b = a + 1; b <= 9; b++) {
      const pairMask = maskOf(a) | maskOf(b);
      // Candidate cycle cells: bivalue cells whose mask ⊆ {a,b} OR cells
      // containing both a and b (potential extra cell).
      const nodes: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const m = grid.candidatesOf(c);
        if ((m & pairMask) === pairMask) nodes.push(c); // has both a and b
      }
      if (nodes.length < 6) continue;
      // BFS for an even-length cycle through these cells (adjacent = peers).
      const step = searchUniqueLoop(grid, nodes, a, b, strategyId);
      if (step) return step;
    }
  }
  return null;
}

function searchUniqueLoop(
  grid: Grid,
  nodes: number[],
  a: number,
  b: number,
  strategyId: string,
): Step | null {
  const nodeSet = new Set(nodes);
  const pairMask = maskOf(a) | maskOf(b);
  const MAX_LEN = 8;
  const BUDGET = 1500;
  let spent = 0;

  for (const start of nodes) {
    if (spent > BUDGET) break;
    // DFS for a cycle returning to start, alternating houses loosely (we just
    // require peers and even length ≥6, with exactly one "extra" cell).
    const stack: Array<{ node: number; prev: number; path: number[]; visited: Set<number> }> = [
      { node: start, prev: -1, path: [start], visited: new Set([start]) },
    ];
    while (stack.length && spent <= BUDGET) {
      spent++;
      const item = stack.pop()!;
      const last = item.node;
      for (const nb of PEERS_OF[last]!) {
        if (!nodeSet.has(nb)) continue;
        if (nb === start && item.path.length >= 6 && item.path.length % 2 === 0) {
          // closed even cycle
          const cycle = item.path;
          const extras = cycle.filter((c) => grid.candidatesOf(c) !== pairMask);
          if (extras.length === 1) {
            const e = extras[0]!;
            const elims: { cell: number; digit: number }[] = [];
            if (grid.hasCandidate(e, a)) elims.push({ cell: e, digit: a });
            if (grid.hasCandidate(e, b)) elims.push({ cell: e, digit: b });
            if (elims.length === 0) continue;
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...cycle, e],
                candidates: cycle.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `唯一环：{${a},${b}} 双值格构成偶数环（${cycle.length} 格），恰一环格带额外候选；该格不能为 ${a} 或 ${b}，消去之。`,
                en: `Unique Loop: bivalue {${a},${b}} form a ${cycle.length}-cell even cycle with exactly one extra-candidate cell; eliminate ${a},${b} from it.`,
              },
            };
          }
          continue;
        }
        if (item.visited.has(nb)) continue;
        if (item.path.length >= MAX_LEN) continue;
        const v = new Set(item.visited);
        v.add(nb);
        stack.push({ node: nb, prev: last, path: [...item.path, nb], visited: v });
      }
    }
  }
  return null;
}

/** BUG-lite / BUG+n: conservative. A full BUG (all-bivalue, every digit twice
 *  per house) is deadly; BUG+1 is handled by bug-plus-one. The +n generalisa-
 *  tion requires multi-cell reasoning that is unsafe to emit without enumerating
 *  the exact break-set, so these detectors return null (sound, inactive). See
 *  docs/notes/p1.md. */
function tryBUGLite(_grid: Grid, _strategyId: string): Step | null {
  return null;
}
function tryBUGPlusN(_grid: Grid, _strategyId: string): Step | null {
  return null;
}

/** Avoidable Rectangle 1–4: requires distinguishing original givens from solved
 *  cells. The Grid foundation tracks no givens, so we conservatively assume any
 *  solved corner MIGHT be a given (which blocks the swap) and never fire. This
 *  is sound (no eliminations) but inactive; pending a foundation given-flag. */
function tryAvoidableRectangle(_grid: Grid, _strategyId: string): Step | null {
  return null;
}

// ---- combinatoric helpers ----
function pairs2<T>(arr: T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) out.push([arr[i]!, arr[j]!]);
  return out;
}
function combinations3<T>(arr: T[]): T[][] {
  return combinationsK(arr, 3);
}
function combinationsK<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const n = arr.length;
  if (k > n) return out;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    out.push(idx.map((i) => arr[i]!));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
  return out;
}

// ---- exported P1 uniqueness strategies ----
export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],
  apply(grid) { return tryHiddenUR(grid, 'hidden-unique-rectangle'); },
};
export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],
  apply(grid) { return tryURType3(grid, 'unique-rectangle-type-3'); },
};
export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],
  apply(grid) { return tryURType5(grid, 'unique-rectangle-type-5'); },
};
export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],
  apply(grid) { return tryURType6(grid, 'unique-rectangle-type-6'); },
};
export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],
  apply(grid) { return tryExtendedUR(grid, 'extended-unique-rectangle'); },
};
export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],
  apply(grid) { return tryUniqueLoop(grid, 'unique-loop'); },
};
export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 987,
  tieBreak: ['cell-index'],
  apply(grid) { return tryBUGLite(grid, 'bug-lite'); },
};
export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+n', en: 'BUG+n' },
  difficulty: 989,
  tieBreak: ['cell-index'],
  apply(grid) { return tryBUGPlusN(grid, 'bug-plus-n'); },
};
export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['cell-index'],
  apply(grid) { return tryAvoidableRectangle(grid, 'avoidable-rectangle-type-1'); },
};
export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['cell-index'],
  apply(grid) { return tryAvoidableRectangle(grid, 'avoidable-rectangle-type-2'); },
};
export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['cell-index'],
  apply(grid) { return tryAvoidableRectangle(grid, 'avoidable-rectangle-type-3'); },
};
export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['cell-index'],
  apply(grid) { return tryAvoidableRectangle(grid, 'avoidable-rectangle-type-4'); },
};
void getCommonHouses;
