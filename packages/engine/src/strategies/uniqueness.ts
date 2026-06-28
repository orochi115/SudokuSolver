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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function seesAll(cell: number, cells: readonly number[]): boolean {
  return cells.every((other) => PEERS_OF[cell]!.includes(other));
}

function isDiagonalPair(a: number, b: number): boolean {
  return ROW_OF[a] !== ROW_OF[b] && COL_OF[a] !== COL_OF[b];
}

function urPairFromMasks(masks: readonly number[]): number | null {
  const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
  return popcount(intersect) === 2 ? intersect : null;
}

function urHighlights(cells: readonly number[], grid: Grid, eliminations: { cell: number; digit: number }[] = []) {
  return {
    cells: [...new Set([...cells, ...eliminations.map((e) => e.cell)])],
    candidates: [
      ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      ...eliminations,
    ],
    links: [],
  };
}

function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = [...rect];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const pair = urPairFromMasks(masks);
    if (pair === null) continue;
    const floorCells = cells.filter((_, i) => masks[i] === pair);
    const roofCells = cells.filter((_, i) => masks[i] !== pair && (masks[i]! & pair) === pair);
    if (floorCells.length !== 2 || roofCells.length !== 2 || isDiagonalPair(roofCells[0]!, roofCells[1]!)) continue;
    const extraUnion = roofCells.reduce((m, c) => m | (grid.candidatesOf(c) & ~pair), 0);
    if (popcount(extraUnion) < 2 || popcount(extraUnion) > 4) continue;

    for (const houseIdx of getCommonHouses(roofCells[0]!, roofCells[1]!)) {
      const outside = HOUSES[houseIdx]!.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & extraUnion) !== 0);
      const maxOutside = Math.min(3, outside.length);
      for (let count = 1; count <= maxOutside; count++) {
        for (const combo of chooseCells(outside, count)) {
          if (combo.some((c) => (grid.candidatesOf(c) & ~extraUnion) !== 0)) continue;
          const union = combo.reduce((m, c) => m | grid.candidatesOf(c), extraUnion);
          if (popcount(union) !== count + 1) continue;
          const lockedDigits = digitsOf(union);
          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of HOUSES[houseIdx]!) {
            if (cells.includes(cell) || combo.includes(cell) || grid.get(cell) !== 0) continue;
            for (const digit of lockedDigits) if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
          }
          if (eliminations.length === 0) continue;
          const [x, y] = digitsOf(pair) as [number, number];
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: urHighlights([...cells, ...combo], grid, eliminations),
            explanation: {
              zh: `唯一矩形 Type3：UR 对 {${x},${y}} 的两个屋顶格作为额外候选伪格，与 ${combo.map(cellLabel).join('/')} 在同一单元形成锁定数组；消去其它格中的 ${lockedDigits.join(',')}。`,
              en: `Unique Rectangle Type 3: the two roof cells for UR pair {${x},${y}} act as a pseudo-cell and form a locked set with ${combo.map(cellLabel).join('/')}; eliminate ${lockedDigits.join(',')} from the other cells in the house.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function* chooseCells(cells: readonly number[], size: number): Generator<number[]> {
  if (cells.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => cells[i]!);
    let i = size - 1;
    while (i >= 0 && idx[i]! === cells.length - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = [...rect];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const pair = urPairFromMasks(masks);
    if (pair === null) continue;
    const extraCells = cells.filter((_, i) => masks[i] !== pair && (masks[i]! & pair) === pair);
    if (!(extraCells.length === 2 && isDiagonalPair(extraCells[0]!, extraCells[1]!)) && extraCells.length !== 3) continue;
    const extraMasks = extraCells.map((c) => grid.candidatesOf(c) & ~pair);
    if (extraMasks.some((m) => popcount(m) !== 1)) continue;
    const extra = extraMasks[0]!;
    if (extraMasks.some((m) => m !== extra)) continue;
    const digit = digitsOf(extra)[0]!;
    const eliminations: { cell: number; digit: number }[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (cells.includes(cell) || grid.get(cell) !== 0 || !grid.hasCandidate(cell, digit)) continue;
      if (seesAll(cell, extraCells)) eliminations.push({ cell, digit });
    }
    if (eliminations.length === 0) continue;
    const [x, y] = digitsOf(pair) as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: urHighlights(cells, grid, eliminations),
      explanation: {
        zh: `唯一矩形 Type5：UR 对 {${x},${y}} 的对角/三角额外格都含同一额外候选 ${digit}；其中至少一个必须为 ${digit}，故消去同时看见这些格的 ${digit}。`,
        en: `Unique Rectangle Type 5: the diagonal/three extra corners of UR pair {${x},${y}} all contain extra candidate ${digit}; one must be ${digit}, so cells seeing all of them can drop ${digit}.`,
      },
    };
  }
  return null;
}

function urDigitConfinedToRectangle(grid: Grid, rectCells: readonly number[], digit: number): boolean {
  const rows = [...new Set(rectCells.map((c) => ROW_OF[c]!))];
  const cols = [...new Set(rectCells.map((c) => COL_OF[c]!))];
  for (const row of rows) {
    const cells = ROWS[row]!.filter((c) => grid.hasCandidate(c, digit));
    if (cells.some((c) => !rectCells.includes(c))) return false;
  }
  for (const col of cols) {
    const cells = COLS[col]!.filter((c) => grid.hasCandidate(c, digit));
    if (cells.some((c) => !rectCells.includes(c))) return false;
  }
  return true;
}

function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = [...rect];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const pair = urPairFromMasks(masks);
    if (pair === null) continue;
    const floorCells = cells.filter((_, i) => masks[i] === pair);
    const roofCells = cells.filter((_, i) => masks[i] !== pair && (masks[i]! & pair) === pair);
    if (floorCells.length !== 2 || roofCells.length !== 2 || !isDiagonalPair(roofCells[0]!, roofCells[1]!)) continue;
    const [x, y] = digitsOf(pair) as [number, number];
    for (const digit of [x, y]) {
      if (!urDigitConfinedToRectangle(grid, cells, digit)) continue;
      const eliminations = roofCells.filter((cell) => grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
      if (eliminations.length === 0) continue;
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: urHighlights(cells, grid, eliminations),
        explanation: {
          zh: `唯一矩形 Type6：UR 对 {${x},${y}} 中的 ${digit} 在矩形两行两列内形成 X-Wing；对角屋顶格不能取 ${digit}，否则形成致死图案。`,
          en: `Unique Rectangle Type 6: digit ${digit} of UR pair {${x},${y}} forms an X-Wing inside the rectangle rows and columns; remove it from the diagonal roof cells to avoid the deadly pattern.`,
        },
      };
    }
  }
  return null;
}

function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = [...rect];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const pair = urPairFromMasks(masks);
    if (pair === null) continue;
    const [x, y] = digitsOf(pair) as [number, number];
    for (let i = 0; i < cells.length; i++) {
      const start = cells[i]!;
      if (grid.candidatesOf(start) !== pair) continue;
      const opposite = cells.find((c) => ROW_OF[c] !== ROW_OF[start] && COL_OF[c] !== COL_OF[start]);
      if (opposite === undefined || grid.candidatesOf(opposite) === pair) continue;
      for (const [locked, eliminated] of [[x, y], [y, x]] as [number, number][]) {
        const rowOutside = ROWS[ROW_OF[opposite]!]!.some((c) => !cells.includes(c) && grid.hasCandidate(c, locked));
        const colOutside = COLS[COL_OF[opposite]!]!.some((c) => !cells.includes(c) && grid.hasCandidate(c, locked));
        if (rowOutside || colOutside || !grid.hasCandidate(opposite, eliminated)) continue;
        const eliminations = [{ cell: opposite, digit: eliminated }];
        return {
          strategyId,
          placements: [],
          eliminations,
          highlights: urHighlights(cells, grid, eliminations),
          explanation: {
            zh: `隐性唯一矩形：从 ${cellLabel(start)} 的裸 UR 对 {${x},${y}} 看对角格 ${cellLabel(opposite)}，${locked} 在其行列中不出矩形；因此该对角格不能取 ${eliminated}。`,
            en: `Hidden Unique Rectangle: from naked UR corner ${cellLabel(start)} on {${x},${y}}, digit ${locked} is confined to the rectangle in the opposite corner's row and column, so ${cellLabel(opposite)} cannot be ${eliminated}.`,
          },
        };
      }
    }
  }
  return null;
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

export const uniqueRectangleType4: Strategy = {
  id: 'unique-rectangle-type-4',
  name: { zh: '唯一矩形 Type 4', en: 'Unique Rectangle Type 4' },
  difficulty: 950,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType4(grid, 'unique-rectangle-type-4');
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

type SymmetryType = 'diag' | 'anti-diag' | 'rotate180';

function partner(cell: number, type: SymmetryType): number {
  const r = ROW_OF[cell]!;
  const c = COL_OF[cell]!;
  if (type === 'diag') return c * 9 + r;
  if (type === 'anti-diag') return (8 - c) * 9 + (8 - r);
  return (8 - r) * 9 + (8 - c);
}

function fixedCells(type: SymmetryType): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (partner(cell, type) === cell) out.push(cell);
  }
  return out;
}

function deriveGurthPermutation(grid: Grid, type: SymmetryType): number[] | null {
  const perm = new Array<number>(10).fill(0); // 1-indexed
  const used = new Array<boolean>(10).fill(false);

  for (let cell = 0; cell < CELLS; cell++) {
    const p = partner(cell, type);
    const v1 = grid.get(cell);
    const v2 = grid.get(p);
    if (v1 === 0 || v2 === 0) continue; // only paired givens/deductions constrain π
    if (perm[v1] === 0) {
      if (used[v2]) return null; // inconsistent mapping
      perm[v1] = v2;
      used[v2] = true;
    } else if (perm[v1] !== v2) {
      return null;
    }
  }

  // Require a complete bijection on digits 1..9
  for (let d = 1; d <= 9; d++) {
    if (perm[d] === 0) return null;
  }
  return perm;
}

function tryGurth(grid: Grid, strategyId: string): Step | null {
  for (const type of ['diag', 'anti-diag', 'rotate180'] as SymmetryType[]) {
    const perm = deriveGurthPermutation(grid, type);
    if (!perm) continue;

    const selfMappedDigits = digitsOf(
      (() => {
        let mask = 0;
        for (let d = 1; d <= 9; d++) if (perm[d] === d) mask |= 1 << (d - 1);
        return mask;
      })(),
    );

    const eliminations: { cell: number; digit: number }[] = [];
    for (const cell of fixedCells(type)) {
      if (grid.get(cell) !== 0) continue;
      const candidates = digitsOf(grid.candidatesOf(cell));
      for (const d of candidates) {
        if (!selfMappedDigits.includes(d)) eliminations.push({ cell, digit: d });
      }
    }

    if (eliminations.length === 0) continue;

    const typeZh = type === 'diag' ? '主对角线' : type === 'anti-diag' ? '反对角线' : '180°旋转';
    const typeEn = type === 'diag' ? 'main diagonal' : type === 'anti-diag' ? 'anti-diagonal' : '180° rotation';
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: fixedCells(type),
        candidates: fixedCells(type).flatMap((c) =>
          digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
        ),
        links: [],
      },
      explanation: {
        zh: `葛斯定理（对称摆放）：当前盘面在${typeZh}下对称，固定格只能取自映射到自身的数字 {${selfMappedDigits.join(',')}}；消去其它候选。`,
        en: `Gurth's Symmetrical Placement: the board is symmetric under ${typeEn}; fixed cells may only use self-mapped digits {${selfMappedDigits.join(',')}}.`,
      },
    };
  }
  return null;
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理（对称摆放）', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryGurth(grid, 'gurth');
  },
};
