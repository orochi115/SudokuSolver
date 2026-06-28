/**
 * Tridagon / Anti-Tridagon (Thor's Hammer) (P1)
 *
 * Four boxes forming a rectangle in two bands and two stacks.
 * In each box, select 3 cells (a transversal: one per row, one per column of the box).
 * If all 12 cells' union contains only 3 digits D={d1,d2,d3}, the pattern is impossible.
 * At least one guardian (extra candidate outside D) must be true.
 *
 * Type 1: exactly one cell has extra candidates → eliminate all D from that cell.
 * Multiple guardians of same digit g + common peer: eliminate g from that peer.
 */

import {
  BOXES, ROWS, COLS, BOX_OF, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/** Generate all k-combinations from an array. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

/**
 * Get all 3-cell transversals of a box:
 * A transversal = 3 cells in the box where each pair is in different rows and different columns.
 * (One cell per row of the box, one cell per column of the box.)
 */
function getBoxTransversals(boxIdx: number): number[][] {
  const box = BOXES[boxIdx]!;
  // Box has 9 cells in a 3×3 arrangement
  // Get relative rows and cols within box
  const minRow = Math.min(...box.map((c) => ROW_OF[c]!));
  const minCol = Math.min(...box.map((c) => COL_OF[c]!));

  // 3 rows × 3 cols within the box
  const rows: number[][] = [[], [], []];
  const cols: number[][] = [[], [], []];
  for (const c of box) {
    const r = ROW_OF[c]! - minRow;
    const co = COL_OF[c]! - minCol;
    rows[r]!.push(c);
    cols[co]!.push(c);
  }

  // A transversal picks one cell from each relative row and one from each relative col
  // (all 3 cells have distinct relative rows AND distinct relative cols)
  const transversals: number[][] = [];
  for (const r0 of rows[0]!) {
    for (const r1 of rows[1]!) {
      if (COL_OF[r0] === COL_OF[r1]) continue; // same col → not transversal
      for (const r2 of rows[2]!) {
        if (COL_OF[r2] === COL_OF[r0] || COL_OF[r2] === COL_OF[r1]) continue;
        transversals.push([r0, r1, r2]);
      }
    }
  }

  return transversals;
}

/**
 * Check if a set of 3 cells "jointly carry exactly D":
 * All candidates in the 3 cells are ⊆ D and the union = D.
 */
function cellsJointlyCarryD(grid: Grid, cells: number[], dMask: number): boolean {
  let unionMask = 0;
  for (const c of cells) {
    if (grid.get(c) !== 0) return false; // Must be empty
    const mask = grid.candidatesOf(c);
    if ((mask & ~dMask) !== 0) return false; // Has candidates outside D
    unionMask |= mask;
  }
  return unionMask === dMask; // Must jointly supply all 3 of D
}

/**
 * Check if 3 cells with candidates ⊆ D "jointly carry exactly D" but may have extras.
 * Returns: number of cells with extras.
 */
function countExtras(grid: Grid, cells: number[], dMask: number): number {
  let count = 0;
  for (const c of cells) {
    if (grid.get(c) !== 0) return -1;
    const mask = grid.candidatesOf(c);
    if ((mask & dMask) === 0) return -1; // No D candidate at all
    if ((mask & ~dMask) !== 0) count++;
  }
  return count;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Try all 4-box rectangles (2 bands × 2 stacks)
    const bandGroups = [
      [0, 1, 2], // band 1: boxes 0,1,2
      [3, 4, 5], // band 2: boxes 3,4,5
      [6, 7, 8], // band 3: boxes 6,7,8
    ];
    const stackGroups = [
      [0, 3, 6], // stack 1: boxes 0,3,6
      [1, 4, 7], // stack 2: boxes 1,4,7
      [2, 5, 8], // stack 3: boxes 2,5,8
    ];

    for (let b1i = 0; b1i < 3; b1i++) {
      for (let b2i = b1i + 1; b2i < 3; b2i++) {
        // Two bands
        for (let s1i = 0; s1i < 3; s1i++) {
          for (let s2i = s1i + 1; s2i < 3; s2i++) {
            // Two stacks
            const box11 = bandGroups[b1i]![s1i]!;
            const box12 = bandGroups[b1i]![s2i]!;
            const box21 = bandGroups[b2i]![s1i]!;
            const box22 = bandGroups[b2i]![s2i]!;

            const result = checkTridagonInBoxes(grid, box11, box12, box21, box22);
            if (result) return result;
          }
        }
      }
    }

    return null;
  },
};

function checkTridagonInBoxes(
  grid: Grid,
  box11: number,
  box12: number,
  box21: number,
  box22: number,
): Step | null {
  // For each 3-digit set D
  const boxes = [box11, box12, box21, box22];
  const allTransversals = boxes.map((b) => getBoxTransversals(b));

  // Try all 3-digit combinations
  for (const digitCombo of combinations([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)) {
    const dMask = digitCombo.reduce((acc, d) => acc | maskOf(d), 0);

    // For each box, find transversals that "jointly carry exactly D" (or nearly so)
    const validTransversalsPerBox = allTransversals.map((transversals, _boxIdx) => {
      return transversals.filter((trans) => {
        // Check if union of candidates in these cells has D-candidates
        // and at most one cell has extras
        const extras = countExtras(grid, trans, dMask);
        if (extras === -1) return false; // Some cell has no D candidate or is solved
        // Accept transversals where cells jointly carry D (possibly with extras)
        let unionD = 0;
        let hasExtraCount = 0;
        for (const c of trans) {
          if (grid.get(c) !== 0) return false;
          const mask = grid.candidatesOf(c);
          unionD |= (mask & dMask);
          if ((mask & ~dMask) !== 0) hasExtraCount++;
        }
        return unionD === dMask; // Must jointly supply all 3 D
      });
    });

    // Need at least one transversal per box
    if (validTransversalsPerBox.some((t) => t.length === 0)) continue;

    // Try each combination of one transversal per box
    for (const t11 of validTransversalsPerBox[0]!) {
      for (const t12 of validTransversalsPerBox[1]!) {
        for (const t21 of validTransversalsPerBox[2]!) {
          for (const t22 of validTransversalsPerBox[3]!) {
            const result = evaluateTridagon(
              grid,
              [t11, t12, t21, t22],
              dMask,
              digitCombo,
              [box11, box12, box21, box22],
            );
            if (result) return result;
          }
        }
      }
    }
  }

  return null;
}

function evaluateTridagon(
  grid: Grid,
  transversals: number[][],
  dMask: number,
  digits: number[],
  _boxes: number[],
): Step | null {
  // All 12 pattern cells
  const patternCells = transversals.flat();

  // Count cells with extra candidates (guardians)
  const extraCells: number[] = [];
  const pureD: number[] = [];

  for (const c of patternCells) {
    const mask = grid.candidatesOf(c);
    if ((mask & ~dMask) !== 0) {
      extraCells.push(c);
    } else {
      pureD.push(c);
    }
  }

  // Need at least 1 guardian
  if (extraCells.length === 0) return null;

  // Type 1: exactly one cell with extras → eliminate all D from that cell
  if (extraCells.length === 1) {
    const targetCell = extraCells[0]!;
    const elims = digits
      .filter((d) => grid.hasCandidate(targetCell, d))
      .map((d) => ({ cell: targetCell, digit: d }));

    if (elims.length > 0) {
      return {
        strategyId: 'tridagon',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: patternCells,
          candidates: patternCells.flatMap((c) =>
            digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
          ),
          links: [],
        },
        explanation: {
          zh: `三值死环（Type 1）：四宫中 12 格的候选集仅含 {${digits.join(',')}}，仅 ${cellLabel(targetCell)} 有额外候选；消去其中的 {${digits.join(',')}}。`,
          en: `Tridagon (Type 1): 12 cells in 4 boxes have candidates only {${digits.join(',')}}; only ${cellLabel(targetCell)} has guardians; eliminate {${digits.join(',')}} from it.`,
        },
      };
    }
  }

  // Type 2 (multiple guardians of same digit, with common peer)
  const guardiansByDigit = new Map<number, number[]>();
  for (const c of extraCells) {
    const extraMask = grid.candidatesOf(c) & ~dMask;
    for (const d of digitsOf(extraMask)) {
      if (!guardiansByDigit.has(d)) guardiansByDigit.set(d, []);
      guardiansByDigit.get(d)!.push(c);
    }
  }

  for (const [g, guardianCells] of guardiansByDigit) {
    if (guardianCells.length < 2) continue;
    const gBit = maskOf(g);
    const dgMask = dMask | gBit; // D ∪ {g}

    // Type 2 is only valid when ALL 12 pattern cells have candidates ⊆ D ∪ {g}.
    // This ensures no other extra digit could "break" the tridagon, so at least
    // one guardian with digit g MUST be true.
    const allCellsSubsetOfDg = patternCells.every((c) => {
      if (grid.get(c) !== 0) return false;
      return (grid.candidatesOf(c) & ~dgMask) === 0;
    });
    if (!allCellsSubsetOfDg) continue;

    // Find common peers of all guardian cells that have g
    const peers0 = new Set(PEERS_OF[guardianCells[0]!]!);
    let commonPeers = [...peers0];
    for (let i = 1; i < guardianCells.length; i++) {
      commonPeers = commonPeers.filter((c) => PEERS_OF[guardianCells[i]!]!.includes(c));
    }

    const elims: { cell: number; digit: number }[] = [];
    for (const peer of commonPeers) {
      if (patternCells.includes(peer)) continue;
      if (grid.get(peer) !== 0 || !(grid.candidatesOf(peer) & gBit)) continue;
      elims.push({ cell: peer, digit: g });
    }

    if (elims.length > 0) {
      return {
        strategyId: 'tridagon',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...patternCells, ...elims.map((e) => e.cell)],
          candidates: patternCells.flatMap((c) =>
            digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
          ),
          links: [],
        },
        explanation: {
          zh: `三值死环（多守护者同数）：守护者 {${guardianCells.map(cellLabel).join(',')}} 均含 ${g}，且有公共可见格；消去公共可见格中的 ${g}。`,
          en: `Tridagon (multiple guardians, same digit): guardians {${guardianCells.map(cellLabel).join(',')}} all have digit ${g} with common visible cells; eliminate ${g} from those cells.`,
        },
      };
    }
  }

  return null;
}
