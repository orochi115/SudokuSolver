/**
 * Basic Fish (T3) — 基础鱼 (X-Wing / Swordfish / Jellyfish)
 *
 * Unified base/cover model:
 *   For one digit d, choose N "base" houses (rows or columns) whose candidates
 *   for d collectively fit in exactly N "cover" houses (the orthogonal dimension).
 *   Any candidate of d in a cover house but NOT in a base house can be eliminated.
 *
 * Size 2 → X-Wing, Size 3 → Swordfish, Size 4 → Jellyfish.
 */

import { ROWS, COLS, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

/** Generate all size-k combinations from [0..n-1]. */
function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return; // not enough elements
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = size - 1;
    while (i >= 0 && idx[i]! === n - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

/**
 * Try fish using base=ROWS and cover=COLS (or vice versa).
 * baseHouses: array of 9 houses (rows or cols)
 * coverHouses: the orthogonal 9 houses
 * coordOfCell: function returning the "cover" axis coordinate of a cell
 */
function tryFish(
  grid: Grid,
  d: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
  size: number,
  strategyId: string,
): Step | null {
  const bit = maskOf(d);

  // For each base house, collect cover-axis indices where d is a candidate
  const coverSets: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const covers: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        covers.push(coverIdx);
      }
    }
    // Base house must have 2..size candidates (degenerate bases allowed for Swordfish/Jellyfish)
    if (covers.length >= 2 && covers.length <= size) {
      coverSets.push(covers);
    } else {
      coverSets.push([]); // placeholder so indices align
    }
  }

  // Try all combinations of `size` base houses that all have 2..size candidates
  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    // Union of cover indices
    const coverUnion = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) coverUnion.add(ci);
    }
    if (coverUnion.size !== size) continue;

    // Valid fish found — gather eliminations
    const baseSet = new Set(baseIndices);
    const eliminations: { cell: number; digit: number }[] = [];
    const baseCells: number[] = [];

    for (const ci of coverUnion) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (baseSet.has(bi)) {
          baseCells.push(cell);
        } else {
          eliminations.push({ cell, digit: d });
        }
      }
    }

    if (eliminations.length === 0) continue;

    const names = FISH_NAMES[size]!;
    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = [...coverUnion].sort((a, b) => a - b).map((i) => i + 1).join(', ');

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...baseCells, ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...baseCells.map((c) => ({ cell: c, digit: d })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数恰好覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}号），构成${names.zh}；可从覆盖${baseAxis === 'row' ? '列' : '行'}中非基础${baseAxisLabel}的格子消去 ${d}。`,
        en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) fit in exactly ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}), forming a ${names.en}; eliminate ${d} from cover ${baseAxis === 'row' ? 'column' : 'row'}s outside the base ${baseAxisLabelEn}s.`,
      },
    };
  }
  return null;
}

function makeBasicFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FISH_NAMES[size]!,
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        // Base = rows, cover = columns
        const step = tryFish(grid, d, ROWS, COLS, 'row', size, id);
        if (step) return step;
        // Base = columns, cover = rows
        const step2 = tryFish(grid, d, COLS, ROWS, 'col', size, id);
        if (step2) return step2;
      }
      return null;
    },
  };
}

export const xWing = makeBasicFishStrategy(2, 'x-wing', 410);
export const swordfish = makeBasicFishStrategy(3, 'swordfish', 450);
export const jellyfish = makeBasicFishStrategy(4, 'jellyfish', 490);
