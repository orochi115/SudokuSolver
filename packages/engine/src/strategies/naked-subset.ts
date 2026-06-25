/**
 * Naked Subset (T2) — 显性数组 (Pair / Triple / Quad)
 *
 * In a house, if N cells together contain exactly N candidates (in total),
 * those N digits can be eliminated from all other cells in the house.
 *
 * Covers: Naked Pair (N=2), Naked Triple (N=3), Naked Quad (N=4).
 */

import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '显性数对', en: 'Naked Pair' },
  3: { zh: '显性三数组', en: 'Naked Triple' },
  4: { zh: '显性四数组', en: 'Naked Quad' },
};

/** Generate all combinations of `size` indices chosen from 0..n-1. */
function* combinations(n: number, size: number): Generator<number[]> {
  if (n < size) return;
  const indices = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...indices];
    // advance
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

function makeNakedSubsetStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: SUBSET_NAMES[size]!,
    difficulty,
    tieBreak: ['house'],

    apply(grid: Grid): Step | null {
      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        const emptyCells = house.filter((c) => grid.get(c) === 0);
        if (emptyCells.length <= size) continue;

        for (const combo of combinations(emptyCells.length, size)) {
          const subsetCells = combo.map((i) => emptyCells[i]!);
          // Union of candidates
          let unionMask = 0;
          for (const c of subsetCells) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== size) continue;

          // Each cell in subset must have candidates ⊆ union (always true since union built from them)
          // Also check that every subset cell has at least one candidate overlapping
          const allHaveOverlap = subsetCells.every((c) => (grid.candidatesOf(c) & unionMask) !== 0);
          if (!allHaveOverlap) continue;

          // Find eliminations: other cells in the house that have any of these digits
          const otherCells = emptyCells.filter((c) => !subsetCells.includes(c));
          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of otherCells) {
            const overlap = grid.candidatesOf(c) & unionMask;
            for (const d of digitsOf(overlap)) {
              eliminations.push({ cell: c, digit: d });
            }
          }

          if (eliminations.length === 0) continue;

          const subsetDigits = digitsOf(unionMask);
          const names = SUBSET_NAMES[size]!;
          const cellsStr = subsetCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
          const hl = houseLabel(h);
          const hle = houseLabelEn(h);

          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...subsetCells, ...eliminations.map((e) => e.cell)],
              candidates: [
                ...subsetCells.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c) & unionMask).map((d) => ({ cell: c, digit: d })),
                ),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `${hl} 中，格子 ${cellsStr} 合计只含候选数 ${subsetDigits.join(', ')}，构成${names.zh}；可从该${hl.slice(0, 1)}的其他格中消去这些数字。`,
              en: `In ${hle}, cells ${cellsStr} together contain only candidates ${subsetDigits.join(', ')}, forming a ${names.en}; eliminate those digits from the rest of the ${hle}.`,
            },
          };
        }
      }
      return null;
    }
  };
}

export const nakedPair = makeNakedSubsetStrategy(2, 'naked-pair', 310);
export const nakedTriple = makeNakedSubsetStrategy(3, 'naked-triple', 330);
export const nakedQuad = makeNakedSubsetStrategy(4, 'naked-quad', 350);
