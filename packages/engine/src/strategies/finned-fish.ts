/**
 * Fin Fish Variants (T4) — 带鳍鱼
 *
 * Extends basic fish with fin cells (extra candidates that see the cover set).
 * Eliminations can only be made from cells that see ALL fin cells.
 */

import { ROWS, COLS, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '带鳍 X-Wing', en: 'Finned X-Wing' },
  3: { zh: '带鳍 剑鱼', en: 'Finned Swordfish' },
  4: { zh: '带鳍 水母', en: 'Finned Jellyfish' },
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

function tryFinnedFish(
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
    // Base house must have 2..size+1 candidates for finned fish
    if (covers.length >= 2 && covers.length <= size + 1) {
      coverSets.push(covers);
    } else {
      coverSets.push([]); // placeholder so indices align
    }
  }

  // Try all combinations of `size` base houses that all have 2..size+1 candidates
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

    // Identify fin cells: candidates for d in cover houses but NOT in base houses
    const baseSet = new Set(baseIndices);
    const fins: { cell: number; coverIdx: number }[] = [];
    for (const ci of coverUnion) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (!baseSet.has(bi)) {
          fins.push({ cell, coverIdx: ci });
        }
      }
    }

    if (fins.length === 0) continue; // No fins found

    // Gather eliminations: must see ALL fins
    const finCoverHouses = new Set(fins.map((f) => f.coverIdx));
    const eliminations: { cell: number; digit: number }[] = [];
    const baseCells: number[] = [];

    for (const ci of coverUnion) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (baseSet.has(bi)) {
          baseCells.push(cell);
        } else if (!finCoverHouses.has(ci)) {
          // Cell is not a fin and doesn't share cover house with any fin
          // It can see all fins, so we can eliminate
          eliminations.push({ cell, digit: d });
        }
      }
    }

    if (eliminations.length === 0) continue;

    const names = FINNED_FISH_NAMES[size]!;
    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = [...coverUnion].sort((a, b) => a - b).map((i) => i + 1).join(', ');

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...baseCells, ...fins.map((f) => f.cell), ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...baseCells.map((c) => ({ cell: c, digit: d })),
          ...fins.map((f) => ({ cell: f.cell, digit: d })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `带鳍${names.zh.substring(2)}：数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数通过鳍格（${fins.map((f) => `R${ROW_OF[f.cell]! + 1}C${COL_OF[f.cell]! + 1}`).join(',')}）覆盖 ${size} ${baseAxis === 'row' ? '列' : '行'}（${coverNums}号）；能看到全部鳍格的格可消去 ${d}。`,
        en: `Finned ${names.en.substring(5)}: digit ${d} in ${baseAxisLabelEn}s ${baseNums} (base) fit in exactly ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) via fins at ${fins.map((f) => `R${ROW_OF[f.cell]! + 1}C${COL_OF[f.cell]! + 1}`).join(',')}; eliminate ${d} from cells seeing all fins.`,
      },
    };
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FINNED_FISH_NAMES[size]!,
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        // Base = rows, cover = columns
        const step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size, id);
        if (step) return step;
        // Base = columns, cover = rows
        const step2 = tryFinnedFish(grid, d, COLS, ROWS, 'col', size, id);
        if (step2) return step2;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);
