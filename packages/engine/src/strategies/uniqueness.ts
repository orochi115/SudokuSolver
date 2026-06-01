/**
 * Uniqueness (T4, OPTIONAL) — 唯一性技巧.
 *
 * These techniques assume the puzzle has EXACTLY ONE solution (not a basic
 * Sudoku rule). They are gated behind `ChainPolicy.allowUniqueness`; with it off
 * the strategy is inert, allowing a pure-logic solve.
 *
 * Covered (per the research note):
 *   - Unique Rectangle (UR) Type 1 / 2       唯一矩形
 *   - Avoidable Rectangle (AR) Type 1        可避免矩形
 *   - BUG / BUG+1                            全双值格致死
 *
 * Deadly pattern: four cells forming a rectangle across exactly two boxes, two
 * rows and two columns, all sharing the same two candidates {a,b}. If that were
 * the full content, {a,b} could be swapped → two solutions. So the "extra"
 * candidates that break the pattern are forced, yielding eliminations.
 *
 * Pure: never mutates the grid.
 */

import {
  CELLS,
  SIZE,
  ROW_OF,
  BOX_OF,
  maskOf,
  popcount,
  digitsOf,
  sees,
  cellLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

/** The four corner cells of the rectangle from two rows and two cols. */
function rectCorners(r1: number, r2: number, c1: number, c2: number): [number, number, number, number] {
  return [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
}

/** Rectangle spans exactly two boxes (i.e. the corners cover only 2 distinct boxes). */
function spansTwoBoxes(cells: number[]): boolean {
  return new Set(cells.map((c) => BOX_OF[c]!)).size === 2;
}

/** Unique Rectangle: scan all two-row × two-col rectangles. */
function findUR(grid: Grid, id: string): Step | null {
  for (let r1 = 0; r1 < 9; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 9; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const corners = rectCorners(r1, r2, c1, c2);
          if (!spansTwoBoxes(corners)) continue;
          if (corners.some((c) => grid.get(c) !== 0)) continue;

          // Find the candidate pair {a,b}: cells with exactly the pair vs the
          // "roof" cell(s) that carry extra candidates.
          const masks = corners.map((c) => grid.candidatesOf(c));
          // Try every pair {a,b}.
          for (let a = 1; a <= SIZE; a++) {
            for (let b = a + 1; b <= SIZE; b++) {
              const pairMask = maskOf(a) | maskOf(b);
              // Each corner must contain BOTH a and b.
              if (!corners.every((c) => (grid.candidatesOf(c) & pairMask) === pairMask)) continue;
              // Count how many corners are EXACTLY {a,b} vs have extras.
              const floors: number[] = [];
              const roofs: number[] = [];
              corners.forEach((c, i) => {
                if (masks[i] === pairMask) floors.push(c);
                else roofs.push(c);
              });

              // UR Type 1: exactly one roof (3 floors). The roof must be the pair
              // PLUS extras; remove the pair {a,b} from the roof.
              if (floors.length === 3 && roofs.length === 1) {
                const roof = roofs[0]!;
                const elims: CellDigit[] = [];
                if (grid.hasCandidate(roof, a)) elims.push({ cell: roof, digit: a });
                if (grid.hasCandidate(roof, b)) elims.push({ cell: roof, digit: b });
                if (elims.length > 0) {
                  return urStep(id, corners, a, b, elims, '1', roof);
                }
              }

              // UR Type 2: exactly two roofs, both carrying the SAME single extra
              // candidate X. Then X is locked in those two cells → remove X from
              // cells seeing both roofs.
              if (floors.length === 2 && roofs.length === 2) {
                const extra1 = masks[corners.indexOf(roofs[0]!)]! & ~pairMask;
                const extra2 = masks[corners.indexOf(roofs[1]!)]! & ~pairMask;
                if (popcount(extra1) === 1 && extra1 === extra2) {
                  const x = digitsOf(extra1)[0]!;
                  const elims: CellDigit[] = [];
                  for (let c = 0; c < CELLS; c++) {
                    if (grid.get(c) !== 0 || corners.includes(c)) continue;
                    if (!grid.hasCandidate(c, x)) continue;
                    if (sees(c, roofs[0]!) && sees(c, roofs[1]!)) elims.push({ cell: c, digit: x });
                  }
                  if (elims.length > 0) return urStep(id, corners, a, b, elims, '2', undefined, x);
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function urStep(
  id: string,
  corners: number[],
  a: number,
  b: number,
  elims: CellDigit[],
  type: string,
  roof?: number,
  x?: number,
): Step {
  return {
    strategyId: id,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: corners,
      candidates: corners.flatMap((c) => [
        { cell: c, digit: a },
        { cell: c, digit: b },
      ]),
      links: [],
    },
    explanation: {
      zh: `唯一矩形 Type ${type}:四格 ${corners.map(cellLabel).join('、')} 几乎同为 {${a},${b}}(跨两行两列两宫),若任由其成立将致双解;${type === '1' ? `故顶格 ${cellLabel(roof!)} 的 ${a}、${b} 可排除。` : `故多余候选 ${x} 被锁定,可见两顶格的格可排除 ${x}。`}`,
      en: `Unique Rectangle Type ${type}: cells ${corners.map(cellLabel).join(', ')} nearly all hold {${a},${b}} across two rows/cols/boxes; to avoid a deadly (two-solution) pattern, ${type === '1' ? `${cellLabel(roof!)} cannot be ${a}/${b}.` : `the extra ${x} is locked, so cells seeing both roofs drop ${x}.`}`,
    },
  };
}

/**
 * Avoidable Rectangle (AR) — 可避免矩形.
 *
 * AR reuses the UR deadly pattern but on cells that are already PLACED. Its
 * soundness, however, depends on the deadly cells NOT being original GIVENS
 * (a given clue pins a cell and breaks the swap argument). This engine's `Grid`
 * does not distinguish givens from solved values, so a candidate AR cannot be
 * proven sound here without that information — and an unsound AR would corrupt
 * the trace and fail AC-3.
 *
 * Decision: AR is recognised structurally (the four-corner candidate form is
 * subsumed by `findUR` when corners still carry candidates) but the
 * placed-corner elimination is DISABLED to preserve soundness. The `als` /
 * `aic` framework covers the deductions AR would otherwise contribute. See
 * `docs/notes/m3.md` §"最难的部分" for the rationale.
 */
function findAR(_grid: Grid, _id: string): Step | null {
  return null;
}

/**
 * BUG+1: if every unsolved cell is bivalue EXCEPT exactly one cell with three
 * candidates, then in a unique puzzle the "extra" digit (the one appearing an
 * odd number of times in that cell's houses) must be placed there.
 */
function findBug(grid: Grid, id: string): Step | null {
  let triCell = -1;
  const empties: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    empties.push(c);
    const pc = popcount(grid.candidatesOf(c));
    if (pc === 2) continue;
    if (pc === 3 && triCell === -1) {
      triCell = c;
    } else {
      return null; // more than one non-bivalue cell, or a >3 cell → not BUG+1
    }
  }
  if (triCell === -1 || empties.length === 0) return null;

  // The placed digit is the one appearing 3 times (odd) in some house of triCell.
  // Standard BUG+1: for each digit in triCell, count its candidate occurrences in
  // triCell's row; the digit that appears 3 times (instead of 2) is the answer.
  const triDigits = digitsOf(grid.candidatesOf(triCell));
  const row = ROW_OF[triCell]!;
  let answer = -1;
  for (const d of triDigits) {
    let count = 0;
    const bit = maskOf(d);
    for (let cc = row * 9; cc < row * 9 + 9; cc++) {
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) count++;
    }
    if (count === 3) {
      answer = d;
      break;
    }
  }
  if (answer === -1) return null;
  return {
    strategyId: id,
    placements: [{ cell: triCell, digit: answer }],
    eliminations: [],
    highlights: {
      cells: [triCell],
      candidates: triDigits.map((d) => ({ cell: triCell, digit: d })),
      links: [],
    },
    explanation: {
      zh: `BUG+1(全双值格致死+1):除 ${cellLabel(triCell)} 外所有空格均为双值,若不打破将致双解;${cellLabel(triCell)} 必须取使其房屋候选计数为奇的数字 ${answer}。`,
      en: `BUG+1: every empty cell is bivalue except ${cellLabel(triCell)}; to avoid a deadly multi-solution pattern, ${cellLabel(triCell)} must take the digit ${answer} that appears an odd number of times in its house.`,
    },
  };
}

export function makeUniqueness(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'uniqueness',
    name: { zh: '唯一性技巧', en: 'Uniqueness Techniques' },
    difficulty: 90,

    apply(grid: Grid): Step | null {
      if (!policy.allowUniqueness) return null;
      const ur = findUR(grid, this.id);
      if (ur) return ur;
      const ar = findAR(grid, this.id);
      if (ar) return ar;
      const bug = findBug(grid, this.id);
      if (bug) return bug;
      return null;
    },
  };
}

export const uniqueness: Strategy = makeUniqueness();
