/**
 * Hidden Subset (T2) — 隐性数组 (Pair / Triple / Quad)
 *
 * In a house, if N digits appear only in N cells (in total), those cells
 * cannot contain any other digits — so eliminate non-subset candidates from
 * those N cells.
 *
 * Covers: Hidden Pair (N=2), Hidden Triple (N=3), Hidden Quad (N=4).
 */

import { HOUSES, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '隐性数对', en: 'Hidden Pair' },
  3: { zh: '隐性三数组', en: 'Hidden Triple' },
  4: { zh: '隐性四数组', en: 'Hidden Quad' },
};

/** Generate all combinations of `size` elements from array. */
function* combinations<T>(arr: T[], size: number): Generator<T[]> {
  const n = arr.length;
  if (n < size) return;
  const indices = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield indices.map((i) => arr[i]!);
    let i = size - 1;
    while (i >= 0 && indices[i]! === n - size + i) i--;
    if (i < 0) break;
    indices[i]!++;
    for (let j = i + 1; j < size; j++) indices[j] = indices[j - 1]! + 1;
  }
}

function houseLabel(houseIdx: number): string {
  if (houseIdx < 9) return `行 R${houseIdx + 1}`;
  if (houseIdx < 18) return `列 C${houseIdx - 9 + 1}`;
  return `宫 B${houseIdx - 18 + 1}`;
}

function houseLabelEn(houseIdx: number): string {
  if (houseIdx < 9) return `row R${houseIdx + 1}`;
  if (houseIdx < 18) return `column C${houseIdx - 9 + 1}`;
  return `box B${houseIdx - 18 + 1}`;
}

function makeHiddenSubsetStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: SUBSET_NAMES[size]!,
    difficulty,
    tieBreak: ['house', 'digit'],

    apply(grid: Grid): Step | null {
      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        const emptyCells = house.filter((c) => grid.get(c) === 0);
        if (emptyCells.length < size) continue;

        // For each digit 1-9, find which cells in this house have it as candidate
        const digitPositions: number[][] = [];
        const candidateDigits: number[] = [];
        for (let d = 1; d <= 9; d++) {
          const bit = maskOf(d);
          const positions = emptyCells.filter((c) => (grid.candidatesOf(c) & bit) !== 0);
          if (positions.length >= 2 && positions.length <= 4) {
            digitPositions.push(positions);
            candidateDigits.push(d);
          }
        }

        if (candidateDigits.length < size) continue;

        for (const combo of combinations(candidateDigits, size)) {
          // Union of cells that can contain any of these digits
          const cellSet = new Set<number>();
          for (const d of combo) {
            const idx = candidateDigits.indexOf(d);
            for (const c of digitPositions[idx]!) cellSet.add(c);
          }

          if (cellSet.size !== size) continue;

          // These N digits appear only in these N cells
          // Verify: each digit in combo must appear in at least one of the subset cells
          const subsetCells = [...cellSet];
          const allDigitsPresent = combo.every((d) => {
            const bit = maskOf(d);
            return subsetCells.some((c) => (grid.candidatesOf(c) & bit) !== 0);
          });
          if (!allDigitsPresent) continue;

          // Build the union mask of the subset digits
          let subsetMask = 0;
          for (const d of combo) subsetMask |= maskOf(d);

          // Eliminations: non-subset candidates in the subset cells
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of subsetCells) {
            const extraCands = grid.candidatesOf(c) & ~subsetMask;
            for (const d of digitsOf(extraCands)) {
              eliminations.push({ cell: c, digit: d });
            }
          }

          if (eliminations.length === 0) continue;

          const names = SUBSET_NAMES[size]!;
          const cellsStr = subsetCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
          const hl = houseLabel(h);
          const hle = houseLabelEn(h);

          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: subsetCells,
              candidates: [
                ...subsetCells.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c) & subsetMask).map((d) => ({ cell: c, digit: d })),
                ),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `${hl} 中，数字 ${combo.join(', ')} 只出现在格子 ${cellsStr}，构成${names.zh}；可从这些格中消去非子集候选数。`,
              en: `In ${hle}, digits ${combo.join(', ')} appear only in cells ${cellsStr}, forming a ${names.en}; eliminate non-subset candidates from those cells.`,
            },
          };
        }
      }
      return null;
    }
  };
}

export const hiddenPair = makeHiddenSubsetStrategy(2, 'hidden-pair', 320);
export const hiddenTriple = makeHiddenSubsetStrategy(3, 'hidden-triple', 340);
export const hiddenQuad = makeHiddenSubsetStrategy(4, 'hidden-quad', 360);
