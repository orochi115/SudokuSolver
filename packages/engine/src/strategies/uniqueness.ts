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

function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0 && (masks[i]! & intersect) === intersect);

    if (floorCells.length !== 2 || roofCells.length !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    const commonHouses = getCommonHouses(roofCells[0]!, roofCells[1]!);

    for (const hIdx of commonHouses) {
      const house = HOUSES[hIdx]!;
      const r1Extra = grid.candidatesOf(roofCells[0]!) & ~intersect;
      const r2Extra = grid.candidatesOf(roofCells[1]!) & ~intersect;
      const E = r1Extra | r2Extra;
      if (popcount(E) === 0) continue;

      const otherHouseCells = house.filter((c) => grid.get(c) === 0 && !cells.includes(c));

      for (let K = 2; K <= 4; K++) {
        const extraCount = popcount(E);
        if (extraCount > K) continue;

        const candidatesForSubset = otherHouseCells.filter((c) => true);

        for (const subset of combineIndices(candidatesForSubset.length, K - 1)) {
          const chosenCells = subset.map((i) => candidatesForSubset[i]!);
          let unionMask = E;
          for (const c of chosenCells) unionMask |= grid.candidatesOf(c);

          if (popcount(unionMask) === K) {
            const elims: { cell: number; digit: number }[] = [];
            const subsetCellsSet = new Set([...chosenCells, ...roofCells]);

            for (const c of house) {
              if (grid.get(c) !== 0 || subsetCellsSet.has(c)) continue;
              const cellMask = grid.candidatesOf(c);
              const toElim = cellMask & unionMask;
              for (const d of digitsOf(toElim)) {
                elims.push({ cell: c, digit: d });
              }
            }

            if (elims.length > 0) {
              const subsetDigits = digitsOf(unionMask);
              return {
                strategyId,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...cells, ...chosenCells, ...elims.map((e) => e.cell)],
                  candidates: [
                    ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...chosenCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `唯一矩形 Type3：顶层格 R${ROW_OF[roofCells[0]!]! + 1}C${COL_OF[roofCells[0]!]! + 1} 和 R${ROW_OF[roofCells[1]!]! + 1}C${COL_OF[roofCells[1]!]! + 1} 的额外候选数 {${digitsOf(E).join(',')}} 与格 {${chosenCells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}} 构成显数组合 {${subsetDigits.join(',')}}；消去该区域内其他格中的 ${subsetDigits.join(',')}。`,
                  en: `Unique Rectangle Type 3: extra candidates {${digitsOf(E).join(',')}} in roof cells R${ROW_OF[roofCells[0]!]! + 1}C${COL_OF[roofCells[0]!]! + 1} and R${ROW_OF[roofCells[1]!]! + 1}C${COL_OF[roofCells[1]!]! + 1} form a locked subset {${subsetDigits.join(',')}} with cells {${chosenCells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}}; eliminate ${subsetDigits.join(',')} from other cells in the house.`,
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

function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    for (let d = 1; d <= 9; d++) {
      if (d === x || d === y) continue;

      const cornersWithD = cells.filter((c) => grid.hasCandidate(c, d));
      if (cornersWithD.length === 0) continue;

      let match = false;
      if (cornersWithD.length === 2) {
        const isDiagonal = (cornersWithD.includes(c11) && cornersWithD.includes(c22)) ||
                           (cornersWithD.includes(c12) && cornersWithD.includes(c21));
        if (isDiagonal) match = true;
      } else if (cornersWithD.length === 3) {
        match = true;
      }

      if (!match) continue;

      // Strict mask check for Type 5: corners with D must be exactly (intersect | dBit), others exactly intersect
      let validType5 = true;
      const dBit = maskOf(d);
      for (const c of cells) {
        const mask = grid.candidatesOf(c);
        if (cornersWithD.includes(c)) {
          if (mask !== (intersect | dBit)) {
            validType5 = false;
            break;
          }
        } else {
          if (mask !== intersect) {
            validType5 = false;
            break;
          }
        }
      }
      if (!validType5) continue;

      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0 || !grid.hasCandidate(c, d) || cells.includes(c)) continue;
        const seesAll = cornersWithD.every((corner) => {
          return ROW_OF[c] === ROW_OF[corner] || COL_OF[c] === COL_OF[corner] || BOX_OF[c] === BOX_OF[corner];
        });
        if (seesAll) {
          elims.push({ cell: c, digit: d });
        }
      }

      if (elims.length > 0) {
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells, ...elims.map((e) => e.cell)],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((candDigit) => ({ cell: c, digit: candDigit }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type5：唯一矩形中 ${cornersWithD.length} 个格子含有额外候选数 ${d}（对 {${x},${y}}）；其中必有一格为 ${d}；消去所有能看到这几个格子的格中的 ${d}。`,
            en: `Unique Rectangle Type 5: ${cornersWithD.length} corners in the UR contain extra candidate ${d} (UR pair {${x},${y}}); ${d} must go in one of these corners; eliminate ${d} from cells seeing all these corners.`,
          },
        };
      }
    }
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

    const pairs = [
      { roof: [c11, c22], floor: [c12, c21] },
      { roof: [c12, c21], floor: [c11, c22] },
    ];

    for (const { roof, floor } of pairs) {
      const floorMasks = floor.map((c) => grid.candidatesOf(c));
      if (floorMasks.some((m) => m !== intersect)) continue;

      const roofMasks = roof.map((c) => grid.candidatesOf(c));
      if (roofMasks.some((m) => (m & intersect) !== intersect || m === intersect)) continue;

      const r1 = ROW_OF[c11]!;
      const r2 = ROW_OF[c22]!;
      const c1 = COL_OF[c11]!;
      const c2 = COL_OF[c22]!;

      for (const d_ur of [x, y]) {
        const bit = maskOf(d_ur);

        const rowConfinement = HOUSES[r1]!.every((c) => c === c11 || c === c12 || grid.get(c) !== 0 || !grid.hasCandidate(c, d_ur)) &&
                               HOUSES[r2]!.every((c) => c === c21 || c === c22 || grid.get(c) !== 0 || !grid.hasCandidate(c, d_ur));

        const colConfinement = HOUSES[9 + c1]!.every((c) => c === c11 || c === c21 || grid.get(c) !== 0 || !grid.hasCandidate(c, d_ur)) &&
                               HOUSES[9 + c2]!.every((c) => c === c12 || c === c22 || grid.get(c) !== 0 || !grid.hasCandidate(c, d_ur));

        if (rowConfinement && colConfinement) {
          const elims: { cell: number; digit: number }[] = [];
          for (const c of roof) {
            if (grid.hasCandidate(c, d_ur)) {
              elims.push({ cell: c, digit: d_ur });
            }
          }

          if (elims.length > 0) {
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...cells],
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((candDigit) => ({ cell: c, digit: candDigit }))),
                links: [],
              },
              explanation: {
                zh: `唯一矩形 Type6：对角顶点含有额外候选数；候选数 ${d_ur} 在这些行列中形成 X翼（UR对 {${x},${y}}）；消去对角顶层格中的 ${d_ur}。`,
                en: `Unique Rectangle Type 6: diagonal corners contain extra candidates; candidate ${d_ur} forms an X-Wing in these rows/columns (UR pair {${x},${y}}); eliminate ${d_ur} from diagonal roof cells.`,
              },
            };
          }
        }
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

    const corners = [
      { start: c11, opp: c22, rowPartner: c21, colPartner: c12 },
      { start: c22, opp: c11, rowPartner: c12, colPartner: c21 },
      { start: c12, opp: c21, rowPartner: c22, colPartner: c11 },
      { start: c21, opp: c12, rowPartner: c11, colPartner: c22 },
    ];

    for (const { start, opp, rowPartner, colPartner } of corners) {
      if (grid.candidatesOf(start) !== intersect) continue;

      const r_opp = ROW_OF[opp]!;
      const c_opp = COL_OF[opp]!;

      for (const [a, b] of [[x, y], [y, x]] as [number, number][]) {
        if (!grid.hasCandidate(opp, b)) continue;

        const rowConfined = HOUSES[r_opp]!.every((c) => {
          return c === opp || c === rowPartner || grid.get(c) !== 0 || !grid.hasCandidate(c, a);
        });

        const colConfined = HOUSES[9 + c_opp]!.every((c) => {
          return c === opp || c === colPartner || grid.get(c) !== 0 || !grid.hasCandidate(c, a);
        });

        if (rowConfined && colConfined) {
          return {
            strategyId,
            placements: [],
            eliminations: [{ cell: opp, digit: b }],
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((candDigit) => ({ cell: c, digit: candDigit }))),
              links: [],
            },
            explanation: {
              zh: `隐性唯一矩形：角格 R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} 的对角格仅含 {${x},${y}}，且 ${a} 在其所在的行列中被局限在矩形内（UR对 {${x},${y}}）；消去该角格中的 ${b}。`,
              en: `Hidden Unique Rectangle: diagonal corner to R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} contains only {${x},${y}}, and ${a} is confined to the UR in its row/column (UR pair {${x},${y}}); eliminate ${b} from the corner.`,
            },
          };
        }
      }
    }
  }
  return null;
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
