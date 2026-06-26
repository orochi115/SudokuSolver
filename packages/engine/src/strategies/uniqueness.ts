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

// ============================================================
// UR Type 3 — extra candidates form a locked subset
// ============================================================

/**
 * UR Type 3: Two floor cells have extra candidates that, combined with outside
 * cells in a shared house, form a naked subset (pair, triple, or quad).
 * Eliminate the subset digits from other cells in that house.
 */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two roof cells have exactly UR pair; two floor cells have extras
    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);

    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    // Collect extra digits from floor cells (beyond the UR pair)
    const extraMaskFloor = (masks[cells.indexOf(floorCells[0]!)]! | masks[cells.indexOf(floorCells[1]!)]!) & ~intersect;
    if (popcount(extraMaskFloor) < 1) continue;

    const extraDigits = digitsOf(extraMaskFloor);

    // Check each shared house
    for (const houseIdx of getCommonHouses(floorCells[0]!, floorCells[1]!)) {
      const house = HOUSES[houseIdx]!;
      // Find outside cells in this house that share extra digits
      const outsideCells = house.filter((c) => {
        if (cells.includes(c)) return false;
        if (grid.get(c) !== 0) return false;
        const m = grid.candidatesOf(c);
        return (m & extraMaskFloor) !== 0;
      });

      // Pseudo-cell = floor cells as one unit holding extraMaskFloor
      // Try subset sizes 2..4
      for (const subsetSize of [2, 3, 4] as const) {
        const numFloorInSubset = 1; // floor cells contribute 1 "slot"
        const numOutsideNeeded = subsetSize - numFloorInSubset;
        if (numOutsideNeeded < 1 || numOutsideNeeded > outsideCells.length) continue;

        // Try combinations of outside cells
        const combos = combinations(outsideCells, numOutsideNeeded);
        for (const combo of combos) {
          let totalMask = extraMaskFloor;
          for (const c of combo) totalMask |= grid.candidatesOf(c);

          if (popcount(totalMask) === subsetSize) {
            // Found a naked subset involving the pseudo-cell
            const eliminations: { cell: number; digit: number }[] = [];
            for (const c of house) {
              if (cells.includes(c) || combo.includes(c)) continue;
              if (grid.get(c) !== 0) continue;
              const cm = grid.candidatesOf(c);
              for (const d of digitsOf(cm & totalMask)) {
                eliminations.push({ cell: c, digit: d });
              }
            }
            if (eliminations.length === 0) continue;

            const [x, y] = digitsOf(intersect) as [number, number];
            const subsetDigits = digitsOf(totalMask);
            return {
              strategyId,
              placements: [],
              eliminations,
              highlights: {
                cells: [...cells, ...combo, ...eliminations.map((e) => e.cell)],
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `唯一矩形 Type3：UR对 {${x},${y}} 的底层格多余候选 ${extraDigits.join(',')} 与外部格形成 ${subsetSize} 元裸子集，消去该单元中其他格的这些数字。`,
                en: `Unique Rectangle Type 3: floor cells' extra candidates ${extraDigits.join(',')} with outside cells form a naked subset of size ${subsetSize}; eliminate those digits from other cells in the shared house.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  function go(start: number, chosen: T[]): void {
    if (chosen.length === k) { result.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      go(i + 1, chosen);
      chosen.pop();
    }
  }
  go(0, []);
  return result;
}

// ============================================================
// UR Type 5 — extra digit in two diagonal corners
// ============================================================

/**
 * UR Type 5: Two diagonal corners have the same extra single digit c.
 * c must be in one of those corners. Eliminate c from cells seeing both
 * diagonal extra corners.
 */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Determine corners with extras
    const pureCells = cells.filter((_, i) => masks[i] === intersect);
    const extraCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    const resolvedCells = cells.filter((_, i) => masks[i] === 0);

    // Type 5: exactly 2 extra cells, diagonally arranged
    if (extraCells.length !== 2) continue;
    if (resolvedCells.length > 0) continue;

    // Check the extra cells are diagonal (not sharing a row or col)
    const r0 = ROW_OF[extraCells[0]!];
    const c0 = COL_OF[extraCells[0]!];
    const r1 = ROW_OF[extraCells[1]!];
    const c1 = COL_OF[extraCells[1]!];

    // Diagonal: opposite corners, not same row or column
    if (r0 === r1 || c0 === c1) continue;

    // Each extra cell must have UR pair + exactly one extra digit
    const extras = extraCells.map((c) => {
      const mask = grid.candidatesOf(c);
      const extraMask = mask & ~intersect;
      return { cell: c, extraMask, count: popcount(extraMask) };
    });

    // Type 5a: same extra digit in both diagonals
    if (extras[0]!.count === 1 && extras[1]!.count === 1 && extras[0]!.extraMask === extras[1]!.extraMask) {
      const z = digitsOf(extras[0]!.extraMask)[0]!;
      const [x, y] = digitsOf(intersect) as [number, number];

      // Eliminate z from cells seeing both diagonal corners
      const peersA = new Set(PEERS_OF[extraCells[0]!]!);
      const elims: { cell: number; digit: number }[] = [];
      for (const c of PEERS_OF[extraCells[1]!]!) {
        if (!peersA.has(c)) continue;
        if (cells.includes(c)) continue;
        if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
      }
      if (elims.length > 0) {
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
            zh: `唯一矩形 Type5：对角双额外格均含额外候选 ${z}（UR对 {${x},${y}}），${z} 必居其一；消去公共可见格中的 ${z}。`,
            en: `Unique Rectangle Type 5: both diagonal extra cells share extra digit ${z} (UR pair {${x},${y}}); ${z} must be in one; eliminate ${z} from cells seeing both.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================
// UR Type 6 — X-Wing on UR digit through diagonal extras
// ============================================================

/**
 * UR Type 6: Two diagonal corners have extra candidates. One UR digit `a`
 * forms an X-Wing on the four UR cells (appears only in the two rows and
 * two columns of the rectangle). Eliminate `a` from both diagonal corners.
 */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    // Two diagonal corners with extras beyond UR pair
    const extraCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    if (extraCells.length !== 2) continue;

    const r0 = ROW_OF[extraCells[0]!]!;
    const c0col = COL_OF[extraCells[0]!]!;
    const r1 = ROW_OF[extraCells[1]!]!;
    const c1col = COL_OF[extraCells[1]!]!;
    if (r0 === r1 || c0col === c1col) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Check if one UR digit forms an X-Wing on the rectangle
    for (const candidate of [x, y]) {
      const bit = maskOf(candidate);
      // Check that candidate appears only in rectangle cells in these 2 rows and 2 cols
      const rows = [r0, r1];
      const cols = [c0col, c1col];
      let xwing = true;

      for (const r of rows) {
        let count = 0;
        for (let c = 0; c < 9; c++) {
          const cell = r * 9 + c;
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) count++;
        }
        // Must appear exactly 2 times in this row (both rectangle cells)
        const inRect = cells.filter((cell) => ROW_OF[cell]! === r && (grid.candidatesOf(cell) & bit)).length;
        if (inRect !== 2 || count !== 2) { xwing = false; break; }
      }

      if (!xwing) {
        for (const col of cols) {
          let count = 0;
          for (let r = 0; r < 9; r++) {
            const cell = r * 9 + col!;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) count++;
          }
          const inRect = cells.filter((cell) => COL_OF[cell]! === col && (grid.candidatesOf(cell) & bit)).length;
          if (inRect !== 2 || count !== 2) { xwing = false; break; }
        }
      }

      if (!xwing) continue;

      // Eliminate candidate from both diagonal extra corners
      const eliminations: { cell: number; digit: number }[] = [];
      for (const ec of extraCells) {
        if (grid.hasCandidate(ec, candidate)) eliminations.push({ cell: ec, digit: candidate });
      }
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
          zh: `唯一矩形 Type6：UR对 {${x},${y}} 中 ${candidate} 在矩形上构成X翼（仅出现在矩形行/列中），对角额外格必须填入另一UR数字，消去 ${candidate}。`,
          en: `Unique Rectangle Type 6: ${candidate} forms an X-Wing on the rectangle cells (only in those rows/cols); diagonal corners must hold the other UR digit; eliminate ${candidate} from diagonal corners.`,
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
 * Hidden Unique Rectangle: Pick a UR corner without extra candidates.
 * If one UR digit `a` appears nowhere outside the UR in the row and column
 * of the diagonally opposite corner, eliminate the other UR digit `b` from
 * the diagonally opposite corner.
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Find the cell without extra candidates (the "pure" UR cell)
    for (let pureIdx = 0; pureIdx < 4; pureIdx++) {
      if (masks[pureIdx] !== intersect && masks[pureIdx] !== 0) continue;
      if (grid.get(cells[pureIdx]!) !== 0) continue;

      const pureCell = cells[pureIdx]!;
      // Diagonal opposite
      const diagIdx = (pureIdx + 2) % 4; // 0↔2, 1↔3
      const diagCell = cells[diagIdx]!;
      const diagMask = masks[diagIdx]!;

      // Check row and column of the opposite cell
      const oppRow = ROW_OF[diagCell]!;
      const oppCol = COL_OF[diagCell]!;

      // Check each UR digit: is it confined to UR in the opposite cell's row AND column?
      for (const candidate of [x, y]) {
        const bit = maskOf(candidate);
        const other = candidate === x ? y : x;

        // Find non-opposite UR cells in opposite cell's row and column
        const rowOtherUR = cells.find((c) => ROW_OF[c] === oppRow && c !== diagCell);
        const colOtherUR = cells.find((c) => COL_OF[c] === oppCol && c !== diagCell);

        if (rowOtherUR === undefined || colOtherUR === undefined) continue;

        const rowOtherHasCand = rowOtherUR !== undefined && grid.hasCandidate(rowOtherUR, candidate);
        const colOtherHasCand = colOtherUR !== undefined && grid.hasCandidate(colOtherUR, candidate);

        // Check row confinement: candidate appears ONLY in UR cells in opposite cell's row
        let rowConfined = true;
        for (const c of ROWS[oppRow]!) {
          if (c === diagCell || c === rowOtherUR) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) { rowConfined = false; break; }
        }
        if (!rowConfined) continue;

        // Check column confinement
        let colConfined = true;
        for (const c of COLS[oppCol]!) {
          if (c === diagCell || c === colOtherUR) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) { colConfined = false; break; }
        }
        if (!colConfined) continue;

        // Opposite cell must have the candidate digit
        if (!grid.hasCandidate(diagCell, candidate)) continue;

        // Pattern is invalid if BOTH other UR cells have the candidate
        // (in that case `a` can escape to different cells in row and column)
        if (rowOtherHasCand && colOtherHasCand) continue;

        // candidate is confined to rectangle in both houses → eliminate OTHER digit from diagCell
        if (grid.hasCandidate(diagCell, other)) {
          return {
            strategyId,
            placements: [],
            eliminations: [{ cell: diagCell, digit: other }],
            highlights: {
              cells,
              candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `隐性唯一矩形：UR对 {${x},${y}} 中 ${candidate} 在 R${oppRow + 1}C${oppCol + 1} 的行/列中仅出现在矩形内，消去对角格 ${cellLabel(diagCell)} 的 ${other}。`,
              en: `Hidden Unique Rectangle: ${candidate} is confined to the rectangle in the row and column of R${oppRow + 1}C${oppCol + 1}; eliminate ${other} from the opposite cell ${cellLabel(diagCell)}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ============================================================
// Exports for UR Type 3, Type 5, Type 6, and Hidden UR
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
