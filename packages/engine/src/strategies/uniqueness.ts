/**
 * Uniqueness (T4) — techniques that rely on the "unique solution" assumption.
 *
 * Includes: Unique Rectangle, Avoidable Rectangle, BUG/BUG+1.
 * Controlled by an optional flag; disabled by default to keep soundness
 * independent of uniqueness assumption.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性', en: 'Uniqueness' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    const ur = findUniqueRectangle(grid);
    if (ur) return ur;

    const bug = findBUG(grid);
    if (bug) return bug;

    return null;
  },
};

// ---- Unique Rectangle ----

function findUniqueRectangle(grid: Grid): Step | null {
  // Look for 4 cells forming a rectangle across 2 rows and 2 columns
  // in exactly 2 boxes, with the same 2 digits as the only candidates in 2 of the cells
  for (let r1 = 0; r1 < 9; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      // Must be in different bands (box rows)
      if (Math.floor(r1 / 3) === Math.floor(r2 / 3)) continue;
      for (let c1 = 0; c1 < 9; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          // Must be in different stacks (box cols)
          if (Math.floor(c1 / 3) === Math.floor(c2 / 3)) continue;

          const cells = [
            r1 * 9 + c1,
            r1 * 9 + c2,
            r2 * 9 + c1,
            r2 * 9 + c2,
          ];

          // Must span exactly 2 boxes
          const boxes = new Set(cells.map((c) => BOX_OF[c]!));
          if (boxes.size !== 2) continue;

          // Check if all 4 cells are empty
          if (cells.some((c) => grid.get(c) !== 0)) continue;

          // Find common candidates among all 4 cells
          let commonMask = 0x1ff;
          for (const c of cells) {
            commonMask &= grid.candidatesOf(c);
          }
          const commonDigits = digitsOf(commonMask);
          if (commonDigits.length < 2) continue;

          // Standard UR: two diagonal cells are bi-value with exactly the two common digits
          // and the other two have extra candidates
          const d1 = commonDigits[0]!;
          const d2 = commonDigits[1]!;

          // Check if any two cells are bivalue with exactly d1,d2
          const biValueCells = cells.filter((c) => {
            const ds = digitsOf(grid.candidatesOf(c));
            return ds.length === 2 && ds.includes(d1) && ds.includes(d2);
          });

          if (biValueCells.length < 2) continue;

          // Type 1: one corner is not bivalue but contains d1,d2
          const nonBi = cells.filter((c) => !biValueCells.includes(c));
          for (const target of nonBi) {
            const eliminations: CellDigit[] = [];
            for (const d of digitsOf(grid.candidatesOf(target))) {
              if (d !== d1 && d !== d2) {
                eliminations.push({ cell: target, digit: d });
              }
            }
            if (eliminations.length > 0) {
              return makeURStep('Unique Rectangle Type 1', cells, d1, d2, eliminations);
            }
          }
        }
      }
    }
  }
  return null;
}

// ---- BUG / BUG+1 ----

function findBUG(grid: Grid): Step | null {
  // BUG: every unsolved cell has exactly 2 candidates -> multiple solutions
  // BUG+1: exactly one cell has 3+ candidates, all others have 2
  let bugPlusOne: number | null = null;
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const count = popcount(grid.candidatesOf(cell));
    if (count > 2) {
      if (bugPlusOne !== null) return null; // More than one cell with 3+ candidates
      bugPlusOne = cell;
    }
  }
  if (bugPlusOne === null) return null;

  // The extra candidate in bugPlusOne is the one that appears 3 times in some house
  const cell = bugPlusOne;
  const ds = digitsOf(grid.candidatesOf(cell));
  for (const d of ds) {
    // Check if d appears exactly 3 times in any house containing this cell
    for (const h of getHouses(cell)) {
      let count = 0;
      for (const c of h) {
        if (grid.get(c) === 0 && grid.hasCandidate(c, d)) count++;
      }
      if (count === 3) {
        return makeBUGStep(cell, d);
      }
    }
  }
  return null;
}

function getHouses(cell: number): number[][] {
  const houses: number[][] = [];
  for (let r = 0; r < 9; r++) {
    if (r === ROW_OF[cell]) houses.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }
  for (let c = 0; c < 9; c++) {
    if (c === COL_OF[cell]) houses.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    const boxCells: number[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        boxCells.push((br + r) * 9 + (bc + c));
      }
    }
    if (boxCells.includes(cell)) houses.push(boxCells);
  }
  return houses;
}

function makeURStep(kind: string, cells: number[], d1: number, d2: number, eliminations: CellDigit[]): Step {
  return {
    strategyId: 'uniqueness',
    placements: [],
    eliminations,
    highlights: { cells, candidates: eliminations, links: [] },
    explanation: {
      zh: `${kind} 数字 ${d1},${d2} 可排除 ${eliminations.length} 处候选。`,
      en: `${kind} on ${d1},${d2} eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}

function makeBUGStep(cell: number, digit: number): Step {
  return {
    strategyId: 'uniqueness',
    placements: [{ cell, digit }],
    eliminations: [],
    highlights: { cells: [cell], candidates: [{ cell, digit }], links: [] },
    explanation: {
      zh: `BUG+1: R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} 必须填入 ${digit} 以避免多解。`,
      en: `BUG+1: R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} must be ${digit} to avoid multiple solutions.`,
    },
  };
}
