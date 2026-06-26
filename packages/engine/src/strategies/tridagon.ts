/**
 * Tridagon (Thor's Hammer) — P1 exotic strategy
 *
 * The Tridagon is a pattern where four boxes in a 2×2 arrangement each contain
 * exactly the same set of 3 candidates {A,B,C} spread across 3 cells — with
 * a specific "parity" constraint. If three boxes have "rising" parity and one
 * has "falling" (or vice versa), the configuration creates a deadly pattern
 * that would lead to multiple solutions. The extra candidates in those cells
 * (the "guardians") prevent the deadly pattern.
 *
 * Key rules:
 * 1. Find four boxes arranged in a 2×2 block of boxes (e.g., boxes 1,2,4,5 or
 *    boxes 1,3,7,9 etc.).
 * 2. In each box, find 3 cells that together have exactly 3 candidates {A,B,C}
 *    spanning all 3 rows and all 3 columns within the box.
 * 3. Check parity: "rising" vs "falling" pattern.
 * 4. If 3 boxes rising + 1 falling (or vice versa), it's a tridagon.
 * 5. Find "guardian" cells: cells in the pattern that have extra candidates
 *    beyond {A,B,C}. Those extra candidates must be true to prevent the deadly
 *    pattern.
 * 6. If exactly one guardian extra candidate: that cell's UR triple can be
 *    eliminated (the extra candidate must be true).
 * 7. If multiple guardians with same digit G seeing each other: G is locked.
 *
 * Simplified implementation:
 * For each set of 4 boxes in a 2×2 arrangement, find triples and check parity.
 * If tridagon found, eliminate the UR triple digits from cells that have guardians.
 */

import {
  CELLS, BOXES, ROWS, COLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// Box indices in 2×2 arrangements (using 0-indexed boxes 0..8)
// Boxes are arranged as:
//   0 1 2
//   3 4 5
//   6 7 8
// Valid 2×2 box groups:
const BOX_QUADS: readonly [number, number, number, number][] = [
  [0, 1, 3, 4], [1, 2, 4, 5],
  [3, 4, 6, 7], [4, 5, 7, 8],
  [0, 2, 6, 8], // non-adjacent (diagonal)
  [0, 1, 6, 7], [1, 2, 7, 8], // different rows
  [0, 3, 1, 4], // same as [0,1,3,4]
];

// Actually use all valid 2×2 box quads
const VALID_BOX_QUADS: readonly [number, number, number, number][] = [
  [0, 1, 3, 4], [1, 2, 4, 5],
  [3, 4, 6, 7], [4, 5, 7, 8],
];

/** Get the 9 cells of a box (0-indexed box number). */
function boxCells(boxIdx: number): readonly number[] {
  return BOXES[boxIdx]!;
}

/** Get row within box (0, 1, or 2). */
function rowInBox(cell: number): number {
  return Math.floor((ROW_OF[cell]! % 3));
}

/** Get col within box (0, 1, or 2). */
function colInBox(cell: number): number {
  return Math.floor((COL_OF[cell]! % 3));
}

/**
 * A "tridagon triple" in a box: 3 cells that together have exactly 3 candidates
 * (the triple), and the 3 cells span all 3 rows AND all 3 columns within the box.
 * (Each row and each column within the box has exactly one cell of the triple.)
 */
interface BoxTriple {
  boxIdx: number;
  cells: [number, number, number]; // sorted by row
  pattern: number[]; // [colOfRow0, colOfRow1, colOfRow2] — which col each row's cell is in
  tripleMask: number;
}

function findBoxTriples(grid: Grid, boxIdx: number, tripleMask: number): BoxTriple[] {
  const cells = boxCells(boxIdx);
  const emptyCells = cells.filter((c) => grid.get(c) === 0);
  const result: BoxTriple[] = [];

  // Find 3 cells in different rows and different columns (all 3) that together have the triple
  for (let i = 0; i < emptyCells.length - 2; i++) {
    for (let j = i + 1; j < emptyCells.length - 1; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        const trio = [emptyCells[i]!, emptyCells[j]!, emptyCells[k]!];

        // Must span all 3 rows and all 3 columns within the box
        const rows = new Set(trio.map((c) => ROW_OF[c]! % 3));
        const cols = new Set(trio.map((c) => COL_OF[c]! % 3));
        if (rows.size !== 3 || cols.size !== 3) continue;

        // Each cell must have candidates that are a subset of tripleMask
        // AND together they must cover the entire tripleMask
        let combined = 0;
        let valid = true;
        for (const c of trio) {
          const mask = grid.candidatesOf(c);
          const inTriple = mask & tripleMask;
          if (inTriple === 0) { valid = false; break; }
          combined |= inTriple;
        }
        if (!valid || combined !== tripleMask) continue;

        // Sort by row
        trio.sort((a, b) => ROW_OF[a]! - ROW_OF[b]!);
        const pattern = trio.map((c) => COL_OF[c]! % 3);

        result.push({
          boxIdx,
          cells: trio as [number, number, number],
          pattern,
          tripleMask,
        });
      }
    }
  }
  return result;
}

/**
 * Check parity of a triple pattern.
 * A triple pattern is [c0, c1, c2] where ci is the column (0,1,2) of row i.
 * "Rising" patterns (per Tridagon theory):
 *   [0,1,2], [1,2,0], [2,0,1] — cycling 0→1→2→0
 * "Falling" patterns:
 *   [0,2,1], [2,1,0], [1,0,2] — cycling 0→2→1→0
 */
function getParity(pattern: number[]): 'rising' | 'falling' {
  const [c0, c1, c2] = pattern as [number, number, number];
  // Rising: next col = (prev col + 1) mod 3
  if (c1 === (c0 + 1) % 3 && c2 === (c0 + 2) % 3) return 'rising';
  return 'falling';
}

function tryTridagon(grid: Grid): Step | null {
  // Try each valid box quad
  for (const boxQuad of VALID_BOX_QUADS) {
    const [b0, b1, b2, b3] = boxQuad;

    // Try each possible triple mask (3 digits from 1..9)
    for (let d1 = 1; d1 <= 7; d1++) {
      for (let d2 = d1 + 1; d2 <= 8; d2++) {
        for (let d3 = d2 + 1; d3 <= 9; d3++) {
          const tripleMask = maskOf(d1) | maskOf(d2) | maskOf(d3);

          // Find triples in each box
          const triples0 = findBoxTriples(grid, b0, tripleMask);
          if (triples0.length === 0) continue;
          const triples1 = findBoxTriples(grid, b1, tripleMask);
          if (triples1.length === 0) continue;
          const triples2 = findBoxTriples(grid, b2, tripleMask);
          if (triples2.length === 0) continue;
          const triples3 = findBoxTriples(grid, b3, tripleMask);
          if (triples3.length === 0) continue;

          // Try each combination of triples
          for (const t0 of triples0) {
            for (const t1 of triples1) {
              for (const t2 of triples2) {
                for (const t3 of triples3) {
                  // Check parity: must have 3 of one parity and 1 of the other
                  const parities = [t0, t1, t2, t3].map((t) => getParity(t.pattern));
                  const risingCount = parities.filter((p) => p === 'rising').length;
                  if (risingCount !== 1 && risingCount !== 3) continue;

                  // This is a tridagon! Find guardians.
                  const allTripleCells = [...t0.cells, ...t1.cells, ...t2.cells, ...t3.cells];

                  // Guardian cells: cells in the pattern that have extra candidates beyond tripleMask
                  const guardianCells = allTripleCells.filter((c) => {
                    const extraMask = grid.candidatesOf(c) & ~tripleMask;
                    return extraMask !== 0;
                  });

                  if (guardianCells.length === 0) continue; // no guardians → unsolvable without extra info

                  // Find guardian digits (the extra candidates)
                  const guardianDigits: { cell: number; digit: number }[] = [];
                  for (const c of guardianCells) {
                    for (const d of digitsOf(grid.candidatesOf(c) & ~tripleMask)) {
                      guardianDigits.push({ cell: c, digit: d });
                    }
                  }

                  // Elimination 1: Cells with guardians can have the triple digits eliminated
                  // (the guardian must be true → triple digits in that cell can go)
                  const elims: { cell: number; digit: number }[] = [];

                  // If exactly one guardian, eliminate triple digits from that cell
                  if (guardianCells.length === 1) {
                    const gCell = guardianCells[0]!;
                    for (const d of digitsOf(tripleMask)) {
                      if (grid.hasCandidate(gCell, d)) elims.push({ cell: gCell, digit: d });
                    }
                  }

                  // If multiple guardians of same digit that see each other → pointing pair
                  if (guardianCells.length > 1) {
                    // Group guardians by digit
                    const byDigit = new Map<number, number[]>();
                    for (const { cell, digit } of guardianDigits) {
                      if (!byDigit.has(digit)) byDigit.set(digit, []);
                      byDigit.get(digit)!.push(cell);
                    }
                    for (const [gd, gcells] of byDigit) {
                      if (gcells.length < 2) continue;
                      // Check if all guardian cells with this digit see each other
                      let allSee = true;
                      for (let i = 0; i < gcells.length; i++) {
                        for (let j = i + 1; j < gcells.length; j++) {
                          if (!PEERS_OF[gcells[i]!]!.includes(gcells[j]!)) { allSee = false; break; }
                        }
                        if (!allSee) break;
                      }
                      if (!allSee) continue;

                      // Guardian cells of digit gd see each other → pointing pair
                      // Eliminate gd from cells seeing all guardian cells
                      const bit = maskOf(gd);
                      for (let c = 0; c < CELLS; c++) {
                        if (grid.get(c) !== 0) continue;
                        if (!(grid.candidatesOf(c) & bit)) continue;
                        if (gcells.includes(c)) continue;
                        const peers = new Set(PEERS_OF[c]!);
                        if (gcells.every((gc) => peers.has(gc))) {
                          elims.push({ cell: c, digit: gd });
                        }
                      }
                    }
                  }

                  if (elims.length === 0) continue;

                  // Deduplicate
                  const seen = new Set<number>();
                  const uniqueElims = elims.filter((e) => {
                    const k = e.cell * 10 + e.digit;
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                  });
                  if (uniqueElims.length === 0) continue;

                  return {
                    strategyId: 'tridagon',
                    placements: [],
                    eliminations: uniqueElims,
                    highlights: {
                      cells: [...new Set([...allTripleCells, ...uniqueElims.map((e) => e.cell)])],
                      candidates: [
                        ...allTripleCells.flatMap((c) => digitsOf(grid.candidatesOf(c) & tripleMask).map((d) => ({ cell: c, digit: d }))),
                        ...guardianDigits,
                        ...uniqueElims,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `三重龙（Thor's Hammer）：四个箱（box${b0 + 1},${b1 + 1},${b2 + 1},${b3 + 1}）各有三格含三重数字 {${d1},${d2},${d3}}，其中三箱同奇偶性（三升一降或反之）构成致命模式；守护格（含额外候选数）阻止双解，消去守护格的三重候选或守护数字的指向。`,
                      en: `Tridagon (Thor's Hammer): four boxes (${[b0, b1, b2, b3].map((b) => `box${b + 1}`).join(',')}) each have 3 cells with triple {${d1},${d2},${d3}}, 3 same-parity + 1 opposite creates deadly pattern; guardian cells with extra candidates prevent double solution; eliminate triple digits from guardians.`,
                    },
                  };
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

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三重龙', en: 'Tridagon (Thor\'s Hammer)' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryTridagon(grid);
  },
};
