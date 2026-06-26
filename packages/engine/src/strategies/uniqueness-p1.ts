/**
 * Uniqueness Strategies (P1) — 唯一性策略（P1层）
 *
 * Extended Unique Rectangles, Avoidable Rectangles, Unique Loops,
 * BUG-Lite, BUG+N variants.
 *
 * Extended Unique Rectangle (EUR / 2×3):
 *   Six cells in 2 columns and 3 rows (or 2 rows and 3 cols), spanning exactly
 *   3 boxes, with exactly 3 candidate digits forming a deadly pattern.
 *   Type 1: One cell has extra candidates — eliminate the 3 UR digits from it.
 *   Type 2: Two roof cells with same extra candidate → eliminate from house.
 *
 * Avoidable Rectangle (AR):
 *   Same geometry as UR (2×2 in 2 boxes) but using SOLVED (non-given) cells.
 *   If 3 of the 4 cells are already solved with the same two digits {X,Y} and
 *   the 4th is unsolved, the 4th cannot be X or Y (that would create a deadly
 *   pattern with non-given solved cells).
 *   Type 1: one unsolved corner → eliminate UR digits from it.
 *   Type 2/3/4: extensions analogous to UR types.
 *
 * Unique Loop:
 *   A closed chain of bivalue cells of even length. Each cell in the loop has
 *   exactly 2 candidates. Going around the loop, candidates alternate. For the
 *   loop to be valid (unique solution), cells outside that see both "phases"
 *   of a candidate can have that candidate eliminated.
 *   (A unique loop with only 2 different values throughout is a UR.)
 *
 * BUG-Lite:
 *   A near-BUG state where exactly one cell has 3 candidates and all other
 *   unsolved cells have exactly 2. The cell with 3 candidates must have one
 *   specific digit that prevents the BUG. That digit is the only valid choice.
 *   (Simplified: if all unsolved cells are bivalue except one trivalue cell,
 *    and all digits appear exactly twice in each house except one extra occurrence
 *    of one digit in the trivalue cell, place that digit.)
 *
 * BUG+N:
 *   Extension of BUG+1 to N extra candidates. If exactly N cells have extra
 *   candidates beyond bivalue and all extra candidates are the same digit D,
 *   then D must appear in all N cells → eliminate D from cells seeing all N.
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

// ─────────────────────────────────────────────────────────────────────────────
// Extended Unique Rectangle (EUR)
// ─────────────────────────────────────────────────────────────────────────────

/** Generate all 2×3 rectangles: 2 columns, 3 rows, spanning exactly 3 boxes. */
function* allExtendedRectangles(): Generator<{ rows: [number, number, number]; cols: [number, number] }> {
  for (let c1 = 0; c1 < 8; c1++) {
    for (let c2 = c1 + 1; c2 < 9; c2++) {
      for (let r1 = 0; r1 < 7; r1++) {
        for (let r2 = r1 + 1; r2 < 8; r2++) {
          for (let r3 = r2 + 1; r3 < 9; r3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2,
              r2 * 9 + c1, r2 * 9 + c2,
              r3 * 9 + c1, r3 * 9 + c2,
            ];
            const boxes = new Set(cells.map((c) => BOX_OF[c]!));
            if (boxes.size !== 3) continue;
            yield { rows: [r1, r2, r3], cols: [c1, c2] };
          }
        }
      }
    }
  }
  // Also try 2 rows × 3 columns
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 7; c1++) {
        for (let c2 = c1 + 1; c2 < 8; c2++) {
          for (let c3 = c2 + 1; c3 < 9; c3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
              r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
            ];
            const boxes = new Set(cells.map((c) => BOX_OF[c]!));
            if (boxes.size !== 3) continue;
            yield { rows: [r1, r2, -1] as [number, number, number], cols: [c1, c3] };
            // We use a different approach below for horizontal case
          }
        }
      }
    }
  }
}

function tryExtendedUR(grid: Grid): Step | null {
  // Try vertical (2 cols × 3 rows) and horizontal (3 cols × 2 rows)

  // Vertical: 2 columns, 3 rows
  for (let c1 = 0; c1 < 8; c1++) {
    for (let c2 = c1 + 1; c2 < 9; c2++) {
      for (let r1 = 0; r1 < 7; r1++) {
        for (let r2 = r1 + 1; r2 < 8; r2++) {
          for (let r3 = r2 + 1; r3 < 9; r3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2,
              r2 * 9 + c1, r2 * 9 + c2,
              r3 * 9 + c1, r3 * 9 + c2,
            ];
            const boxes = new Set(cells.map((c) => BOX_OF[c]!));
            if (boxes.size !== 3) continue;

            const result = checkEURPattern(grid, cells);
            if (result) return result;
          }
        }
      }
    }
  }

  // Horizontal: 3 columns, 2 rows
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 7; c1++) {
        for (let c2 = c1 + 1; c2 < 8; c2++) {
          for (let c3 = c2 + 1; c3 < 9; c3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
              r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
            ];
            const boxes = new Set(cells.map((c) => BOX_OF[c]!));
            if (boxes.size !== 3) continue;

            const result = checkEURPattern(grid, cells);
            if (result) return result;
          }
        }
      }
    }
  }

  return null;
}

function checkEURPattern(grid: Grid, cells: number[]): Step | null {
  // All cells must be empty
  if (cells.some((c) => grid.get(c) !== 0)) return null;

  // Find candidates for each cell
  const masks = cells.map((c) => grid.candidatesOf(c));
  if (masks.some((m) => m === 0)) return null;

  // Find common 3 digits across all cells
  let commonMask = masks[0]!;
  for (const m of masks) commonMask &= m;
  if (popcount(commonMask) !== 3) return null;

  // All cells must have at least all 3 common digits
  if (masks.some((m) => (m & commonMask) !== commonMask)) return null;

  // EUR Type 1: exactly one cell has extra candidates
  const floorCells = cells.filter((c) => grid.candidatesOf(c) === commonMask);
  const roofCells = cells.filter((c) => grid.candidatesOf(c) !== commonMask);

  if (floorCells.length === 5 && roofCells.length === 1) {
    const roof = roofCells[0]!;
    const urDigits = digitsOf(commonMask);
    const elims = urDigits.filter((d) => grid.hasCandidate(roof, d)).map((d) => ({ cell: roof, digit: d }));
    if (elims.length === 0) return null;

    return {
      strategyId: 'extended-unique-rectangle',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `扩展唯一矩形 Type1：6格（2×3）共含三候选数 {${urDigits.join(',')}}，仅格 ${cellLabel(roof)} 有额外候选数；消去该格的 ${urDigits.join(',')}。`,
        en: `Extended Unique Rectangle Type 1: 6 cells (2×3) with triple {${urDigits.join(',')}}; only cell ${cellLabel(roof)} has extra candidates; eliminate ${urDigits.join(',')} from it.`,
      },
    };
  }

  // EUR Type 2: two roof cells in same house with same extra candidate
  if (roofCells.length === 2) {
    const r0 = roofCells[0]!;
    const r1 = roofCells[1]!;
    const extra0 = grid.candidatesOf(r0) & ~commonMask;
    const extra1 = grid.candidatesOf(r1) & ~commonMask;
    const sharedExtra = extra0 & extra1;
    if (popcount(sharedExtra) === 1) {
      // Both roof cells have same extra digit — it must appear in one of them
      const extraDigit = digitsOf(sharedExtra)[0]!;
      // Find shared house between r0 and r1
      const sharedHouses = HOUSES.filter((h) => h.includes(r0) && h.includes(r1));
      for (const house of sharedHouses) {
        const bit = maskOf(extraDigit);
        const elims: { cell: number; digit: number }[] = [];
        for (const c of house) {
          if (c === r0 || c === r1) continue;
          if (grid.get(c) === 0 && grid.hasCandidate(c, extraDigit)) {
            elims.push({ cell: c, digit: extraDigit });
          }
        }
        if (elims.length === 0) continue;
        const urDigits = digitsOf(commonMask);
        return {
          strategyId: 'extended-unique-rectangle',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...new Set([...cells, ...elims.map((e) => e.cell)])],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `扩展唯一矩形 Type2：两个顶格共享额外候选数 ${extraDigit}，必有一个为 ${extraDigit}；消去共享房间中其他格的 ${extraDigit}。`,
            en: `Extended Unique Rectangle Type 2: two roof cells share extra candidate ${extraDigit}; one must be ${extraDigit}; eliminate ${extraDigit} from other cells in their shared house.`,
          },
        };
      }
    }
  }

  return null;
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryExtendedUR(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Avoidable Rectangles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Avoidable Rectangle Types 1–4.
 *
 * We need to distinguish between "given" cells and "solved-during-solve" cells.
 * In our Grid model, we track which cells were initially given vs. solved.
 * However, the standard Grid in this codebase may not track this distinction.
 *
 * Assumption: We use the initial puzzle string to determine "given" cells.
 * For this implementation, we need the Grid to expose which cells are "original givens".
 *
 * Implementation approach:
 * We search for rectangles where:
 *   - Exactly 3 cells are solved (grid.get(c) !== 0)
 *   - 1 cell is unsolved
 *   - The 3 solved cells form the deadly pattern with 2 digits
 *   - The unsolved cell contains at least one of those 2 digits
 *
 * Since we can't distinguish given from solved-by-strategy, we use a heuristic:
 * A cell is "potentially avoidable" if it was solved during solving (not a given).
 * Without tracking givens, we must rely on the grid being partially solved.
 *
 * For AR Type 1: Three solved corners with the same 2-digit set {X,Y} →
 *   eliminate X and Y from the unsolved 4th corner.
 *
 * For AR Type 2: Two solved corners in same row (or column) with same digit X,
 *   other two corners unsolved with X as candidate. The resolved corners "force"
 *   X to appear in one of the unsolved ones → naked pair in shared house.
 *
 * Note: Since we can't track givens vs deduced, we implement a conservative version:
 * The pattern works when 3 corners are solved (filled) and 1 is unsolved.
 * We assume the puzzle was properly constructed and the solved cells are not all givens.
 */

function* allRectanglesAR(): Generator<[number, number, number, number]> {
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

function tryARType1(grid: Grid): Step | null {
  // Avoidable Rectangle requires knowing which cells are "givens" (original clues)
  // vs "deduced during solving". Without this information, we cannot safely apply AR.
  // Our Grid model does not expose this distinction, so AR is disabled.
  // A correct implementation would need grid.isGiven(cell) or similar.
  return null;
}

// AR Types 2–4 are disabled: same reason as Type 1 (requires given-cell tracking).
function tryARType2(_grid: Grid): Step | null { return null; }
function tryARType3(_grid: Grid): Step | null { return null; }
function tryARType4(_grid: Grid): Step | null { return null; }

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['cell-index'],
  apply: (grid) => tryARType1(grid),
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['cell-index'],
  apply: (grid) => tryARType2(grid),
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['cell-index'],
  apply: (grid) => tryARType3(grid),
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['cell-index'],
  apply: (grid) => tryARType4(grid),
};

// ─────────────────────────────────────────────────────────────────────────────
// Unique Loop
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unique Loop:
 * A closed chain of bivalue cells of even length.
 * Each cell in the loop has exactly 2 candidates.
 * Candidates alternate around the loop.
 *
 * If all cells in the loop have the same two digits (like a UR), it's a UR.
 * For a "true" unique loop, the digits change along the path.
 *
 * The key property: if the loop forms a deadly pattern, any cell outside
 * that sees both "phases" of a candidate at the same position can be eliminated.
 *
 * Simplified implementation:
 * Find closed chains of bivalue cells of even length (4, 6, 8, ...).
 * For each loop of even length, the pattern creates two alternating solutions.
 * Cells outside the loop that see cells of both phases (same digit, odd and even
 * positions) can have that digit eliminated.
 *
 * More precisely: going around the loop, at each position cells alternate
 * between "color A" and "color B". For any digit d:
 *   - d appears at positions colored A (all from one phase)
 *   - Cells outside seeing d at both A-positions and B-positions → eliminate d
 */
function tryUniqueLoop(grid: Grid): Step | null {
  // Find all bivalue cells
  const bivals: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivals.push(c);
  }

  // Build adjacency: bivalue cells sharing a digit that are peers
  const adj = new Map<number, Set<number>>();
  for (const c of bivals) adj.set(c, new Set());
  for (let i = 0; i < bivals.length; i++) {
    const a = bivals[i]!;
    const ma = grid.candidatesOf(a);
    for (let j = i + 1; j < bivals.length; j++) {
      const b = bivals[j]!;
      const mb = grid.candidatesOf(b);
      // Share at least one digit and are peers
      if ((ma & mb) !== 0 && PEERS_OF[a]!.includes(b)) {
        adj.get(a)!.add(b);
        adj.get(b)!.add(a);
      }
    }
  }

  const MAX_LOOP = 10;

  for (const startCell of bivals) {
    const path: number[] = [startCell];
    const visited = new Set<number>([startCell]);
    const activeDigit: number[] = [digitsOf(grid.candidatesOf(startCell))[0]!]; // start with first digit

    function dfs(): Step | null {
      const curr = path[path.length - 1]!;
      const currActive = activeDigit[activeDigit.length - 1]!;
      const currMask = grid.candidatesOf(curr);
      const currOther = digitsOf(currMask).find((d) => d !== currActive)!;
      // hopDigit is the digit that was "on" at curr and must be "off" at next
      const hopDigit = currOther;

      // Check for loop closure
      if (path.length >= 4 && path.length % 2 === 0) {
        // Check if curr's hopDigit is the startCell's active digit (can close the loop)
        const startActive = activeDigit[0]!;
        if (hopDigit === startActive && adj.get(curr)!.has(startCell)) {
          // Found a valid even-length bivalue loop!
          const loopCells = [...path];
          const loopLen = loopCells.length;

          // Assign colors: even positions = color 0, odd positions = color 1
          // At each position, the "active" digit is the one from activeDigit[]
          // Color 0 cells: path[0], path[2], ...  Active digit = activeDigit[0], activeDigit[2], ...
          // Color 1 cells: path[1], path[3], ...  Active digit = activeDigit[1], activeDigit[3], ...

          // For each digit d, find cells that have d at color-0 positions and at color-1 positions
          const allDigits = new Set<number>();
          for (const c of loopCells) for (const d of digitsOf(grid.candidatesOf(c))) allDigits.add(d);

          const elims: { cell: number; digit: number }[] = [];
          for (const d of allDigits) {
            const bit = maskOf(d);
            const c0cells = loopCells.filter((c, i) => (grid.candidatesOf(c) & bit) && i % 2 === 0);
            const c1cells = loopCells.filter((c, i) => (grid.candidatesOf(c) & bit) && i % 2 === 1);
            if (c0cells.length === 0 || c1cells.length === 0) continue;

            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & bit)) continue;
              if (loopCells.includes(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              const sees0 = c0cells.some((x) => peers.has(x));
              const sees1 = c1cells.some((x) => peers.has(x));
              if (sees0 && sees1) elims.push({ cell: c, digit: d });
            }
          }

          if (elims.length > 0) {
            // Deduplicate
            const seen = new Set<number>();
            const uniqueElims = elims.filter((e) => {
              const key = e.cell * 10 + e.digit;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            if (uniqueElims.length === 0) { /* continue */ } else {
              return {
                strategyId: 'unique-loop',
                placements: [],
                eliminations: uniqueElims,
                highlights: {
                  cells: [...new Set([...loopCells, ...uniqueElims.map((e) => e.cell)])],
                  candidates: [
                    ...loopCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...uniqueElims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `唯一环：${loopLen}格偶数长双值环（${loopCells.map(cellLabel).join('→')}），环上候选数交替出现；消去能同时看到同一数字两相位的格中的该数字。`,
                  en: `Unique Loop: ${loopLen}-cell even bivalue chain forms a deadly loop; eliminate digits from cells seeing both phases of the same digit in the loop.`,
                },
              };
            }
          }
        }
      }

      if (path.length >= MAX_LOOP) return null;

      // Extend: next cell must share hopDigit and be a peer
      for (const next of adj.get(curr)!) {
        if (visited.has(next)) continue;
        const nextMask = grid.candidatesOf(next);
        if (!(nextMask & maskOf(hopDigit))) continue;
        const nextActive = hopDigit; // hopDigit is now "active" (coming in) at next cell
        visited.add(next);
        path.push(next);
        activeDigit.push(nextActive);
        const result = dfs();
        path.pop();
        activeDigit.pop();
        visited.delete(next);
        if (result) return result;
      }
      return null;
    }

    const result = dfs();
    if (result) return result;
  }
  return null;
}

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryUniqueLoop(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BUG-Lite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BUG-Lite:
 * Near-BUG state where almost all unsolved cells are bivalue, and:
 * - Every digit appears exactly twice in each house among unsolved cells, EXCEPT
 *   one digit appears exactly 3 times total across all its occurrences.
 * - The extra occurrence of that digit is the BUG-Lite trigger.
 *
 * Simplified: if exactly one unsolved cell has 3 candidates (all others bivalue),
 * and removing any one of the 3 candidates would create a BUG, then whichever
 * digit appears an odd number of times in each house must be the solution for
 * the trivalue cell.
 */
function tryBugLite(grid: Grid): Step | null {
  // Count unsolved cells
  const unsolvedCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) unsolvedCells.push(c);
  }

  // All but one must be bivalue
  const triOrMore = unsolvedCells.filter((c) => popcount(grid.candidatesOf(c)) >= 3);
  if (triOrMore.length !== 1) return null;

  const pivotCell = triOrMore[0]!;
  const bivalue = unsolvedCells.filter((c) => popcount(grid.candidatesOf(c)) === 2);

  // For BUG-Lite, check if placing each candidate of pivotCell would produce a BUG
  // A BUG exists when every unsolved cell is bivalue and every digit appears
  // exactly twice in each house (among unsolved cells).
  // We check which digit D in pivotCell, when placed, would make all remaining
  // cells bivalue (which they already are except pivotCell) AND make all digit
  // counts exactly 2 per house. But we can't place—instead check which digit
  // appears an odd number of times in pivotCell's houses.

  const pivotMask = grid.candidatesOf(pivotCell);
  const pivotDigits = digitsOf(pivotMask);

  // For each digit d in pivotCell, count how many times d appears in each house
  // that pivotCell belongs to (excluding pivotCell itself).
  // The digit that appears an ODD number of times in some house is the one to place.
  for (const d of pivotDigits) {
    const bit = maskOf(d);
    let isOdd = false;
    for (const house of HOUSES) {
      if (!house.includes(pivotCell)) continue;
      const count = house.filter((c) => c !== pivotCell && grid.get(c) === 0 && grid.hasCandidate(c, d)).length;
      if (count % 2 === 1) { isOdd = true; break; }
    }
    if (isOdd) {
      // D appears odd times in some house → placing D is the only non-BUG choice
      return {
        strategyId: 'bug-lite',
        placements: [{ cell: pivotCell, digit: d }],
        eliminations: [],
        highlights: {
          cells: [pivotCell],
          candidates: pivotDigits.map((dd) => ({ cell: pivotCell, digit: dd })),
          links: [],
        },
        explanation: {
          zh: `BUG-Lite：除 ${cellLabel(pivotCell)} 外所有未填格均为双值格，若 ${cellLabel(pivotCell)} 不填 ${d} 则构成双解（BUG）；必须将 ${d} 填入 ${cellLabel(pivotCell)}。`,
          en: `BUG-Lite: all unsolved cells except ${cellLabel(pivotCell)} are bivalue; if ${d} is not placed in ${cellLabel(pivotCell)}, a deadly BUG pattern would arise; must place ${d}.`,
        },
      };
    }
  }
  return null;
}

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 912,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBugLite(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BUG+N
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BUG+N (N > 1):
 * Extension of BUG+1 where N cells have extra candidates.
 * If all N extra candidates are the same digit D, then D must appear in
 * at least one of the N cells → eliminate D from cells seeing all N cells.
 *
 * BUG+1 is already implemented (bug-plus-one in uniqueness.ts).
 * BUG+N with N >= 2 is a generalization.
 */
function tryBugPlusN(grid: Grid): Step | null {
  const unsolvedCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) unsolvedCells.push(c);
  }

  // Find "extra" cells: cells with 3+ candidates
  const extraCells = unsolvedCells.filter((c) => popcount(grid.candidatesOf(c)) >= 3);
  if (extraCells.length < 2 || extraCells.length > 4) return null; // N=2..4

  // Check if all non-extra cells are bivalue
  if (unsolvedCells.some((c) => !extraCells.includes(c) && popcount(grid.candidatesOf(c)) !== 2)) return null;

  // Find what would make each "extra" cell a bivalue: the extra digit for each
  // In a BUG, each cell would be bivalue. The extra candidate in each of the N
  // cells breaks the BUG. If all extra candidates are the same digit D:
  //   → D must appear in at least one of the N extra cells (to avoid BUG)
  //   → Eliminate D from cells outside seeing all N extra cells

  // For each extra cell, find its "extra" digit(s) beyond bivalue status
  // In a true BUG+N, each extra cell has exactly 1 extra candidate (trivalue).
  if (extraCells.some((c) => popcount(grid.candidatesOf(c)) !== 3)) return null;

  // Each extra cell has exactly 3 candidates. Which 1 is "extra" (the BUG-breaking one)?
  // The extra digit should be the same across all N cells for BUG+N.
  // Find common extra digit: the digit that appears an odd number of times in some house
  // and is the extra candidate in all extra cells.

  // Collect all digits across extra cells
  let commonMask = 0xffff;
  for (const c of extraCells) commonMask &= grid.candidatesOf(c);

  if (commonMask === 0) return null;
  const sharedDigits = digitsOf(commonMask);

  for (const D of sharedDigits) {
    const bit = maskOf(D);
    // Check if D appears an odd number of times in each house that contains any extra cell
    let allOdd = true;
    for (const house of HOUSES) {
      const extraInHouse = extraCells.filter((c) => house.includes(c));
      if (extraInHouse.length === 0) continue;
      const count = house.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, D)).length;
      if (count % 2 !== 1) { allOdd = false; break; }
    }
    if (!allOdd) continue;

    // D must be in at least one extra cell → eliminate from cells seeing ALL extra cells
    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (!(grid.candidatesOf(c) & bit)) continue;
      if (extraCells.includes(c)) continue;
      const peers = new Set(PEERS_OF[c]!);
      if (extraCells.every((ec) => peers.has(ec))) {
        elims.push({ cell: c, digit: D });
      }
    }
    if (elims.length === 0) continue;

    return {
      strategyId: 'bug-plus-n',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...new Set([...extraCells, ...elims.map((e) => e.cell)])],
        candidates: [
          ...extraCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          ...elims,
        ],
        links: [],
      },
      explanation: {
        zh: `BUG+${extraCells.length}：${extraCells.length} 个三值格均含额外候选数 ${D}，必有至少一格为 ${D}；消去能看到全部 ${extraCells.length} 个三值格的格中的 ${D}。`,
        en: `BUG+${extraCells.length}: ${extraCells.length} trivalue cells all have extra digit ${D}; at least one must be ${D}; eliminate ${D} from cells seeing all ${extraCells.length} trivalue cells.`,
      },
    };
  }
  return null;
}

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 913,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBugPlusN(grid);
  },
};
