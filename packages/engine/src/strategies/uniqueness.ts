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
import type { Step, CellDigit } from '../trace.js';
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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = size - 1;
    while (i >= 0 && idx[i]! === n - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const urDigits = digitsOf(intersect);
    const [x, y] = urDigits as [number, number];

    const roofIndices = cells.map((c, i) => i).filter(i => {
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });
    if (roofIndices.length !== 2) continue;

    const r1Idx = roofIndices[0]!;
    const r2Idx = roofIndices[1]!;
    const r1 = cells[r1Idx]!;
    const r2 = cells[r2Idx]!;

    if (ROW_OF[r1]! !== ROW_OF[r2]! && COL_OF[r1]! !== COL_OF[r2]!) continue;

    const extrasMask = (masks[r1Idx]! | masks[r2Idx]!) & ~intersect;
    const extras = digitsOf(extrasMask);
    if (extras.length === 0 || extras.length > 4) continue;

    const commonHouses = getCommonHouses(r1, r2);

    for (const houseIdx of commonHouses) {
      const house = HOUSES[houseIdx]!;
      const otherCells = house.filter(c => c !== r1 && c !== r2 && grid.get(c) === 0);

      const S = extras.length;
      for (const otherCombo of combineIndices(otherCells.length, S - 1)) {
        const chosenOther = otherCombo.map(i => otherCells[i]!);

        const allInside = chosenOther.every(c => {
          const m = grid.candidatesOf(c);
          return (m & ~extrasMask) === 0;
        });

        if (!allInside) continue;

        const elims: CellDigit[] = [];
        for (const cell of otherCells) {
          if (chosenOther.includes(cell)) continue;
          for (const d of extras) {
            if (grid.hasCandidate(cell, d)) {
              elims.push({ cell, digit: d });
            }
          }
        }

        if (elims.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells, ...chosenOther],
            candidates: [
              ...cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
              ...chosenOther.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
            ],
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type 3：格 ${cellLabel(r1)} 和 ${cellLabel(r2)} 的额外候选数 {${extras.join(',')}} 与同一单元内的其他格构成显性数组；可在该单元其他格中消去 {${extras.join(',')}}。`,
            en: `Unique Rectangle Type 3: extra candidates {${extras.join(',')}} in ${cellLabel(r1)} and ${cellLabel(r2)} form a naked subset with other cells in their shared house; eliminate {${extras.join(',')}} from other cells.`,
          },
        };
      }
    }
  }
  return null;
}

function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    const extraIndices = cells.map((_, i) => i).filter(i => {
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });
    if (extraIndices.length !== 2 && extraIndices.length !== 3) continue;

    if (extraIndices.length === 2) {
      const diagonal = (extraIndices[0] === 0 && extraIndices[1] === 3) || (extraIndices[0] === 1 && extraIndices[1] === 2);
      if (!diagonal) continue;
    }

    const extrasMasks = extraIndices.map(i => masks[i]! & ~intersect);
    const firstExtra = extrasMasks[0]!;
    if (popcount(firstExtra) !== 1) continue;
    if (extrasMasks.some(m => m !== firstExtra)) continue;

    const z = digitsOf(firstExtra)[0]!;
    const extraCells = extraIndices.map(i => cells[i]!);

    const elims: CellDigit[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
      if (extraCells.includes(c)) continue;

      const seesAll = extraCells.every(ec => PEERS_OF[c]!.includes(ec));
      if (seesAll) {
        elims.push({ cell: c, digit: z });
      }
    }

    if (elims.length === 0) continue;

    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...elims.map(e => e.cell)],
        candidates: cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type 5：对角或三格含有相同的额外候选数 ${z}（UR对 {${x},${y}}）；必须填入 ${z} 以避免双解；从所有能看到这些格子的格中消去 ${z}。`,
        en: `Unique Rectangle Type 5: diagonal or three corners have extra candidate ${z} (UR pair {${x},${y}}); ${z} must go in one corner to avoid dual solutions; eliminate ${z} from cells seeing all these corners.`,
      },
    };
  }
  return null;
}

function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    const extraIndices = cells.map((_, i) => i).filter(i => {
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });
    if (extraIndices.length !== 2) continue;

    const diagonal = (extraIndices[0] === 0 && extraIndices[1] === 3) || (extraIndices[0] === 1 && extraIndices[1] === 2);
    if (!diagonal) continue;

    const extraCells = extraIndices.map(i => cells[i]!);

    for (const d of [x, y]) {
      const bit = maskOf(d);

      const rowsConfined = [ROW_OF[c11]!, ROW_OF[c21]!].every(r => {
        const rowCells = ROWS[r]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        return rowCells.every(c => cells.includes(c));
      });

      const colsConfined = [COL_OF[c11]!, COL_OF[c12]!].every(c => {
        const colCells = COLS[c]!.filter(cell => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        return colCells.every(cell => cells.includes(cell));
      });

      if (rowsConfined && colsConfined) {
        const elims: CellDigit[] = [];
        for (const ec of extraCells) {
          if (grid.hasCandidate(ec, d)) {
            elims.push({ cell: ec, digit: d });
          }
        }

        if (elims.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells],
            candidates: cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(digit => ({ cell: c, digit }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type 6：UR对 {${x},${y}} 中，${d} 在其所在的行列中构成 X翼；消去两个含有额外候选数的对角格中的 ${d}。`,
            en: `Unique Rectangle Type 6: UR pair {${x},${y}}; digit ${d} forms an X-Wing on the UR rows and columns, so eliminate ${d} from the diagonal corners with extra candidates.`,
          },
        };
      }
    }
  }
  return null;
}

function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    for (let sIdx = 0; sIdx < 4; sIdx++) {
      if (masks[sIdx] !== intersect) continue;

      const start = cells[sIdx]!;
      const oppIdx = 3 - sIdx;
      const opp = cells[oppIdx]!;

      if ((masks[oppIdx]! & intersect) !== intersect || masks[oppIdx] === intersect) continue;

      const r_opp = ROW_OF[opp]!;
      const c_opp = COL_OF[opp]!;

      for (const d of [x, y]) {
        const otherD = d === x ? y : x;
        const bit = maskOf(d);

        const rowOk = ROWS[r_opp]!.every(c => {
          if (c === opp || c === cells[sIdx === 0 || sIdx === 1 ? sIdx + 2 : sIdx - 2]!) return true;
          return grid.get(c) !== 0 || (grid.candidatesOf(c) & bit) === 0;
        });

        const colOk = COLS[c_opp]!.every(c => {
          if (c === opp || c === cells[sIdx === 0 || sIdx === 2 ? sIdx + 1 : sIdx - 1]!) return true;
          return grid.get(c) !== 0 || (grid.candidatesOf(c) & bit) === 0;
        });

        if (rowOk && colOk) {
          if (grid.hasCandidate(opp, otherD)) {
            return {
              strategyId,
              placements: [],
              eliminations: [{ cell: opp, digit: otherD }],
              highlights: {
                cells: [...cells],
                candidates: cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(digit => ({ cell: c, digit }))),
                links: [],
              },
              explanation: {
                zh: `隐性唯一矩形：UR对 {${x},${y}} 中，${d} 在对角格所在的行列中均只能出现在该对角格及同边格；为避免双解，对角格 R${r_opp+1}C${c_opp+1} 必须不能为 ${otherD}，消去之。`,
                en: `Hidden Unique Rectangle: UR pair {${x},${y}}; digit ${d} is confined to UR cells in both the row and column of the opposite corner, so R${r_opp+1}C${c_opp+1} cannot be ${otherD}; eliminate ${otherD}.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryHiddenUR(grid, 'hidden-unique-rectangle');
  },
};

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
