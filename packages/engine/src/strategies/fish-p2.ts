/**
 * P2 Fish Strategies — Franken Fish & Mutant Fish
 *
 * Franken Fish:
 *   Base houses can include a mix of rows/cols AND one or more boxes.
 *   Cover houses can be rows, cols, OR boxes.
 *   This allows "bent" fish patterns that span box boundaries in unusual ways.
 *   Endo Fins: fin cells that are in a base house (internal to the pattern).
 *   Cannibalism: when a base cell is also a cover target (normally excluded,
 *     but allowed when the cell is an endo fin — "cannibalistic" elimination).
 *
 * Mutant Fish:
 *   Both base AND cover houses can be ANY mix of rows, cols, and boxes.
 *   The most general form of fish.
 *   Size 2 = Frankened/Mutated X-Wing; size 3 = swordfish variant; etc.
 *
 * Siamese Fish:
 *   Two different fish patterns for the same digit that share some cells.
 *   Presented as a single step with combined eliminations.
 *   Handled implicitly: we report the first fish found; Siamese is a UI concept.
 *
 * Algorithm:
 *   For each digit d, base size N, and cover size N:
 *     1. Enumerate all N-subsets of "houses" (for Franken: rows/cols + boxes for base)
 *     2. Union all d-candidates in the base houses
 *     3. Check if they fit in exactly N cover houses
 *     4. If excess cells exist (fins), verify they're all in one box
 *     5. Eliminate d from cover cells not in any base house, within fin box
 */

import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Generate all k-combinations from array of indices. */
function* combK(arr: number[], k: number): Generator<number[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combK(rest, k - 1)) yield [first!, ...combo];
  yield* combK(rest, k);
}

/**
 * General fish search over custom house sets.
 * baseHouseIndices: indices into HOUSES[] for base house candidates
 * coverHouseIndices: indices into HOUSES[] for cover house candidates
 */
function tryGeneralFish(
  grid: Grid,
  d: number,
  baseHouseIndices: number[],
  coverHouseIndices: number[],
  size: number,
  strategyId: string,
  allowEndoFins: boolean,
): Step | null {
  const bit = maskOf(d);

  // For each base house, find cells with digit d
  const baseCandsByHouse: number[][] = baseHouseIndices.map((hi) =>
    HOUSES[hi]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0),
  );

  // Only consider base houses with at least 1 candidate
  const eligibleBase = baseHouseIndices.map((_, i) => i).filter((i) => baseCandsByHouse[i]!.length >= 1);

  for (const baseCombo of combK(eligibleBase, size)) {
    // Collect all d-candidates from selected base houses
    const allBaseCells: number[] = [];
    const baseHouseSet = new Set(baseCombo.map((i) => baseHouseIndices[i]!));
    for (const i of baseCombo) {
      for (const c of baseCandsByHouse[i]!) {
        if (!allBaseCells.includes(c)) allBaseCells.push(c);
      }
    }

    if (allBaseCells.length > size * 3) continue; // too many cells to form a fish

    // Find which cover houses contain which base cells
    const coverHousesContaining = coverHouseIndices.map((hi) => ({
      hi,
      cells: allBaseCells.filter((c) => HOUSES[hi]!.includes(c)),
    }));

    // Need to find exactly `size` cover houses that together cover all base cells (or all but fin)
    for (const coverCombo of combK(
      coverHouseIndices.map((_, i) => i).filter((i) => coverHousesContaining[i]!.cells.length > 0),
      size,
    )) {
      const selectedCovers = coverCombo.map((i) => ({
        hi: coverHouseIndices[i]!,
        cells: coverHousesContaining[i]!.cells,
      }));

      const coveredSet = new Set<number>();
      for (const { cells } of selectedCovers) for (const c of cells) coveredSet.add(c);

      // Fin cells: base cells NOT covered by the cover houses
      const finCells = allBaseCells.filter((c) => !coveredSet.has(c));

      // Standard finned fish: fins must all be in one box
      if (finCells.length === 0 && !allowEndoFins) continue; // plain fish (not our job here)
      if (finCells.length === 0) continue; // no fins → not a franken/mutant fish (skip plain fish)

      const finBoxes = new Set(finCells.map((c) => BOX_OF[c]!));
      if (finBoxes.size !== 1) continue;
      const finBoxIdx = [...finBoxes][0]!;

      // Eliminations: cover cells not in any base house, within fin box
      const elims: { cell: number; digit: number }[] = [];
      for (const { hi, cells } of selectedCovers) {
        for (const c of HOUSES[hi]!) {
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & bit)) continue;
          if (baseHouseSet.has(hi)) continue; // cell in a base house — skip (unless endo fin handling)
          if (allBaseCells.includes(c)) continue; // base candidate
          if (BOX_OF[c]! !== finBoxIdx) continue; // must be in fin box
          elims.push({ cell: c, digit: d });
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

      const baseLabelParts = baseCombo.map((i) => {
        const hi = baseHouseIndices[i]!;
        if (hi < 9) return `R${hi + 1}`;
        if (hi < 18) return `C${hi - 9 + 1}`;
        return `B${hi - 18 + 1}`;
      });
      const coverLabelParts = coverCombo.map((i) => {
        const hi = coverHouseIndices[i]!;
        if (hi < 9) return `R${hi + 1}`;
        if (hi < 18) return `C${hi - 9 + 1}`;
        return `B${hi - 18 + 1}`;
      });

      return {
        strategyId,
        placements: [],
        eliminations: uniqueElims,
        highlights: {
          cells: [...new Set([...allBaseCells, ...uniqueElims.map((e) => e.cell)])],
          candidates: [
            ...allBaseCells.map((c) => ({ cell: c, digit: d })),
            ...uniqueElims,
          ],
          links: [],
        },
        explanation: {
          zh: `${strategyId === 'franken-fish' ? '法兰肯鱼' : '突变鱼'}：数字 ${d} 以 ${baseLabelParts.join(',')} 为基础集，${coverLabelParts.join(',')} 为覆盖集（size=${size}），鳍格在 B${finBoxIdx + 1}；消去覆盖集中同在鳍宫的格的候选数 ${d}。`,
          en: `${strategyId === 'franken-fish' ? 'Franken Fish' : 'Mutant Fish'}: digit ${d} with base ${baseLabelParts.join(',')} and cover ${coverLabelParts.join(',')} (size=${size}), fin in box ${finBoxIdx + 1}; eliminate ${d} from cover cells within the fin box.`,
        },
      };
    }
  }
  return null;
}

function tryFrankenFish(grid: Grid, size: number): Step | null {
  for (let d = 1; d <= 9; d++) {
    // Franken: base is rows+boxes, cover is cols+boxes (or any mix with at least 1 box)
    // We enumerate: base = N houses from (rows ∪ boxes), cover = N houses from (cols ∪ boxes)
    // to keep search tractable, limit to size 2 and 3

    // Base: rows + boxes; Cover: cols + boxes
    const rowIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const colIndices = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const boxIndices = [18, 19, 20, 21, 22, 23, 24, 25, 26];

    // Franken: base has at least one box OR cover has at least one box (not pure row/col fish)
    // Case 1: base = rows + boxes, cover = cols + boxes
    {
      const base = [...rowIndices, ...boxIndices];
      const cover = [...colIndices, ...boxIndices];
      const step = tryGeneralFish(grid, d, base, cover, size, 'franken-fish', false);
      if (step) return step;
    }

    // Case 2: base = cols + boxes, cover = rows + boxes
    {
      const base = [...colIndices, ...boxIndices];
      const cover = [...rowIndices, ...boxIndices];
      const step = tryGeneralFish(grid, d, base, cover, size, 'franken-fish', false);
      if (step) return step;
    }
  }
  return null;
}

function tryMutantFish(grid: Grid, size: number): Step | null {
  for (let d = 1; d <= 9; d++) {
    // Mutant: base and cover can be any mix of rows, cols, boxes
    const allHouseIndices = Array.from({ length: 27 }, (_, i) => i);
    const step = tryGeneralFish(grid, d, allHouseIndices, allHouseIndices, size, 'mutant-fish', true);
    if (step) return step;
  }
  return null;
}

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '法兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let size = 2; size <= 4; size++) {
      const step = tryFrankenFish(grid, size);
      if (step) return step;
    }
    return null;
  },
};

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '突变鱼', en: 'Mutant Fish' },
  difficulty: 1085,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let size = 2; size <= 3; size++) {
      const step = tryMutantFish(grid, size);
      if (step) return step;
    }
    return null;
  },
};
