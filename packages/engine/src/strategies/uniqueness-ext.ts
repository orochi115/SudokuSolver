/**
 * Unique Rectangle family extensions (Roadmap ② P0 + E3).
 *
 * Extends the existing UR Type 1/2/4 detector with three more UR types
 * (Type 3 / Type 5 / Type 6) and the Hidden Unique Rectangle detector.
 *
 * The shared predicate (two rows × two columns × two boxes, all four corners
 * able to hold the same UR pair {a,b}) is factored out so each type only
 * describes its distinct elimination rule. E3: the previous UR detectors
 * (Type 1/2/4) stay in `uniqueness.ts` for now (refactoring the legacy
 * module is out of scope for P0) — this file owns the new types and the
 * Hidden UR variant.
 *
 * All techniques rely on the puzzle having a UNIQUE solution.
 */

import {
  CELLS, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, HOUSES, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Yield every (r1, r2, c1, c2) tuple spanning exactly two boxes. */
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

interface URContext {
  cells: [number, number, number, number];
  masks: [number, number, number, number];
  intersect: number; // candidate mask that ALL four corners can hold (= the UR pair)
  urDigits: [number, number];
}

function* findURContexts(grid: Grid): Generator<URContext> {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0)) as [number, number, number, number];
    const intersect = (masks[0] & masks[1] & masks[2] & masks[3]) >>> 0;
    if (popcount(intersect) !== 2) continue;
    const urDigits = digitsOf(intersect) as [number, number];
    yield { cells, masks, intersect, urDigits };
  }
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Build a UR step result. Returns null if eliminations empty. */
function buildURStep(
  strategyId: string,
  context: URContext,
  eliminations: { cell: number; digit: number }[],
  extraCells: readonly number[],
  zh: string,
  en: string,
): Step | null {
  if (eliminations.length === 0) return null;
  const cellsArr = [...context.cells, ...extraCells];
  const seen = new Set<number>();
  const cells = cellsArr.filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells,
      candidates: cells.flatMap((c) => digitsOf(grid_cands(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: { zh, en },
  };

  function grid_cands(c: number): number {
    return context.masks[context.cells.indexOf(c) as 0 | 1 | 2 | 3] ?? 0;
  }
}

/** UR Type 3 — extra candidates form a locked subset with an outside cell.
 *
 * Roof cells are adjacent (share a line) and together hold only extra digits
 * (not the UR pair). If outside cells in the shared roof-line combine with
 * the roof to form a Naked Subset on the extra digits, eliminate the
 * subset's digits from other cells in that line outside the subset.
 */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const ctx of findURContexts(grid)) {
    const { cells, masks, intersect } = ctx;
    // Two roof cells must NOT carry the UR pair; they are the "extra" cells.
    const roofCells: number[] = [];
    const floorCells: number[] = [];
    for (let i = 0; i < 4; i++) {
      const cell = cells[i]!;
      const mask = masks[i]!;
      if ((mask & intersect) === intersect) floorCells.push(cell);
      else roofCells.push(cell);
    }
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    // Roof must share a line.
    const [r1, r2] = roofCells as [number, number];
    const sameRow = ROW_OF[r1] === ROW_OF[r2];
    const sameCol = COL_OF[r1] === COL_OF[r2];
    if (!sameRow && !sameCol) continue;

    // Roof candidates: digits in either roof cell but NOT the UR pair.
    const roofMask =
      (grid.candidatesOf(r1) & ~intersect) | (grid.candidatesOf(r2) & ~intersect);
    const roofDigits = digitsOf(roofMask);
    if (roofDigits.length < 2 || roofDigits.length > 4) continue;

    // The shared roof line. Outside-roof cells in this line that hold only
    // digits from roofMask complete the locked subset.
    const lineIdx = sameRow ? ROW_OF[r1]! : 9 + COL_OF[r1]!;
    const line = HOUSES[lineIdx]!;

    // Candidates outside roofCells on the line that fit within roofDigits.
    const outside: number[] = [];
    for (const c of line) {
      if (c === r1 || c === r2) continue;
      if (grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      // All non-zero digits of m must lie within roofMask.
      if ((m & ~roofMask) !== 0) continue;
      const nonZeroDigits = digitsOf(m);
      if (nonZeroDigits.length === 0) continue;
      outside.push(c);
    }
    if (outside.length === 0) continue;

    // Locked subset = roof cells + outside cells. The number of cells in the
    // subset must equal the number of roofDigits.
    const totalSubsetCells = 2 + outside.length;
    if (totalSubsetCells !== roofDigits.length) continue;

    // Eliminate roofDigits from other cells in the line.
    const eliminations: { cell: number; digit: number }[] = [];
    const subset = new Set<number>([r1, r2, ...outside]);
    for (const c of line) {
      if (subset.has(c)) continue;
      if (grid.get(c) !== 0) continue;
      for (const d of roofDigits) {
        if (!grid.hasCandidate(c, d)) continue;
        // Skip elimination if it would create a contradiction (the candidate
        // was the only one). We don't add such checks because the UR deadly
        // pattern argument is sufficient.
        eliminations.push({ cell: c, digit: d });
      }
    }
    if (eliminations.length === 0) continue;

    const [a, b] = ctx.urDigits;
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...cells, ...outside, ...eliminations.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type3：UR对 {${a},${b}} 中，底层格 ${floorCells.map(cellLabel).join('、')} 已确定；两个屋顶格 ${r1 === undefined ? '' : cellLabel(r1)}、${cellLabel(r2)} 与同线其它格组成锁定子集 {${roofDigits.join(',')}}；同线其余格消去这些数字。`,
        en: `Unique Rectangle Type 3: UR pair {${a},${b}}, floor cells ${floorCells.map(cellLabel).join(',')} fixed; roof cells ${cellLabel(r1)}, ${cellLabel(r2)} together with outside cells form a locked subset on {${roofDigits.join(',')}}; strip those digits from the rest of the line.`,
      },
    };
  }
  return null;
}

/** UR Type 5 — extra digit `c` appears in two diagonal corners or three corners.
 *
 * Eliminate `c` from cells that see ALL extra-candidate corners.
 */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const ctx of findURContexts(grid)) {
    const { cells, masks, intersect } = ctx;
    const roofCells: number[] = [];
    for (let i = 0; i < 4; i++) {
      const cell = cells[i]!;
      const mask = masks[i]!;
      if ((mask & intersect) === intersect) continue; // floor: UR pair only
      roofCells.push(cell);
    }
    if (roofCells.length !== 2 && roofCells.length !== 3) continue;

    // Verify extras are SAME digit across the roof cells (Type 5 spec).
    const extraMasks = roofCells.map((c) => grid.candidatesOf(c) & ~intersect);
    if (extraMasks.some((m) => popcount(m) !== 1)) continue;
    const firstExtra = extraMasks[0]!;
    if (extraMasks.some((m) => m !== firstExtra)) continue;

    const c = digitsOf(firstExtra)[0]!;
    const cBit = maskOf(c);
    const roofSet = new Set(roofCells);

    // Targets: cells holding c and seeing EVERY roof cell.
    const targets: number[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & cBit) === 0) continue;
      if (roofSet.has(cell)) continue;
      let seesAll = true;
      for (const rc of roofCells) {
        if (!PEERS_OF[cell]!.includes(rc)) { seesAll = false; break; }
      }
      if (seesAll) targets.push(cell);
    }

    if (targets.length === 0) continue;
    const eliminations = targets
      .filter((cell) => grid.hasCandidate(cell, c))
      .map((cell) => ({ cell, digit: c }));
    if (eliminations.length === 0) continue;

    const [x, y] = ctx.urDigits;
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...cells, ...eliminations.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type5：UR对 {${x},${y}} 中，${roofCells.length} 个额外候选格 ${roofCells.map(cellLabel).join('、')} 均含候选数 ${c}；必须有一格为 ${c}，故可见所有额外候选格的格消去 ${c}。`,
        en: `Unique Rectangle Type 5: UR pair {${x},${y}}; the ${roofCells.length} extra-candidate corners ${roofCells.map(cellLabel).join(',')} each hold digit ${c}; at least one holds ${c}, so cells seeing all of them drop ${c}.`,
      },
    };
  }
  return null;
}

/** UR Type 6 — diagonal extras; one UR digit is X-Wing-shaped on the rectangle.
 *
 * Extra candidates in two diagonal corners. If one UR digit `a` appears ONLY
 * inside the rectangle's two rows × two columns (an X-Wing), then placing `a`
 * in a diagonal extra-corner forces the deadly pattern. Eliminate `a` from
 * both diagonal extra-candidate corners.
 */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const ctx of findURContexts(grid)) {
    const { cells, masks, intersect, urDigits } = ctx;
    const roofCells: number[] = [];
    for (let i = 0; i < 4; i++) {
      const cell = cells[i]!;
      const mask = masks[i]!;
      if ((mask & intersect) === intersect) continue;
      roofCells.push(cell);
    }
    if (roofCells.length !== 2) continue;
    // Diagonal check
    if (PEERS_OF[roofCells[0]!]!.includes(roofCells[1]!)) continue;

    // For each UR digit a, check: a appears ONLY inside the rectangle's two
    // rows and two columns (i.e. X-Wing on a over the four UR cells).
    const [r1, r2] = [ROW_OF[cells[0]!]!, ROW_OF[cells[2]!]!];
    const [c1, c2] = [COL_OF[cells[0]!]!, COL_OF[cells[1]!]!];

    const inRect = (cell: number): boolean => {
      const r = ROW_OF[cell]!;
      const cc = COL_OF[cell]!;
      return (r === r1 || r === r2) && (cc === c1 || cc === c2);
    };

    for (const a of urDigits) {
      const aBit = maskOf(a);
      // Find ALL cells in the four UR rows/columns that hold a.
      let outsideRectWithA = false;
      for (let cell = 0; cell < CELLS; cell++) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & aBit) === 0) continue;
        if (inRect(cell)) continue;
        outsideRectWithA = true;
        break;
      }
      if (outsideRectWithA) continue;

      // a is X-Wing-shaped on the rectangle → eliminate a from both diagonal
      // roof corners.
      const elims: { cell: number; digit: number }[] = [];
      for (const rc of roofCells) {
        if (grid.hasCandidate(rc, a)) elims.push({ cell: rc, digit: a });
      }
      if (elims.length === 0) continue;

      const other = urDigits.find((d) => d !== a)!;
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
          zh: `唯一矩形 Type6：UR对 {${urDigits[0]},${urDigits[1]}} 中，数字 ${a} 在 ${r1 + 1},${r2 + 1} 行与 ${c1 + 1},${c2 + 1} 列所组成的矩形内只出现在 4 个角格（X-Wing 形状）；若对角屋顶格取 ${a} 则形成致死图案；故消去对角屋顶格 ${roofCells.map(cellLabel).join('、')} 的 ${a}（保 ${other}）。`,
          en: `Unique Rectangle Type 6: UR pair {${urDigits[0]},${urDigits[1]}}; digit ${a} appears only in the 2×2 rectangle (X-Wing shape on rows ${r1 + 1},${r2 + 1} and columns ${c1 + 1},${c2 + 1}); placing ${a} in either diagonal extra-corner would form the deadly pattern; eliminate ${a} from ${roofCells.map(cellLabel).join(',')} (keep ${other}).`,
        },
      };
    }
  }
  return null;
}

/** Hidden Unique Rectangle.
 *
 * Allow two or three corners to carry arbitrary extra clutter. Pick a UR
 * corner WITHOUT extra candidates as the start; look at the row and column
 * of the diagonally opposite corner. If one UR digit `a` appears nowhere
 * outside the UR in those two houses, then the diagonally opposite corner
 * is forced to `a` (otherwise the pattern dies). Eliminate the OTHER UR
 * digit `b` from the diagonally opposite corner.
 *
 * Per HoDoKu: HUR = the row AND column of the diagonally-opposite corner
 * act as conjugate pairs on `a` (a is absent elsewhere in both houses).
 */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const ctx of findURContexts(grid)) {
    const { cells, masks, intersect, urDigits } = ctx;

    // For each corner as "opposite", find another corner with NO extra
    // candidates (pure floor). Then check the row and column of the
    // diagonally opposite corner: if a is absent there outside the UR,
    // eliminate b there.
    for (let oppositeIdx = 0; oppositeIdx < 4; oppositeIdx++) {
      const opposite = cells[oppositeIdx]!;
      const oppositeMask = masks[oppositeIdx]!;
      if ((oppositeMask & intersect) !== intersect) continue; // not a floor
      if (popcount(oppositeMask) !== 2) continue; // floor must be exactly the UR pair

      const oppositeRow = ROW_OF[opposite]!;
      const oppositeCol = COL_OF[opposite]!;

      for (const a of urDigits) {
        const aBit = maskOf(a);
        const other = urDigits.find((d) => d !== a)!;

        // Check: a appears nowhere in opposite's row outside the UR AND
        // nowhere in opposite's column outside the UR.
        let rowViolation = false;
        for (let c = 0; c < 9; c++) {
          const cell = oppositeRow * 9 + c;
          if (cells.includes(cell)) continue;
          if (grid.get(cell) !== 0) continue;
          if ((grid.candidatesOf(cell) & aBit) !== 0) { rowViolation = true; break; }
        }
        if (rowViolation) continue;
        let colViolation = false;
        for (let r = 0; r < 9; r++) {
          const cell = r * 9 + oppositeCol;
          if (cells.includes(cell)) continue;
          if (grid.get(cell) !== 0) continue;
          if ((grid.candidatesOf(cell) & aBit) !== 0) { colViolation = true; break; }
        }
        if (colViolation) continue;

        // Eliminate b from the diagonally opposite corner.
        if (!grid.hasCandidate(opposite, other)) continue;
        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: opposite, digit: other }],
          highlights: {
            cells: [...cells],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `隐性唯一矩形（HUR）：UR对 {${urDigits[0]},${urDigits[1]}} 中，对角格 ${cellLabel(opposite)} 的行/列中除 UR 角格外再无 ${a}（被 ${a} 锁在该格），故对角格须为 ${a}；消去 ${other}（隐性唯一矩形）。`,
            en: `Hidden Unique Rectangle (HUR): UR pair {${urDigits[0]},${urDigits[1]}}; ${a} is absent from the row and column of ${cellLabel(opposite)} outside the UR (locked onto that corner); so the opposite corner must be ${a}; eliminate ${other} from ${cellLabel(opposite)}.`,
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
    return tryURType3(grid, this.id);
  },
};

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType5(grid, this.id);
  },
};

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType6(grid, this.id);
  },
};

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryHiddenUR(grid, this.id);
  },
};

// suppress unused warnings
void buildURStep;