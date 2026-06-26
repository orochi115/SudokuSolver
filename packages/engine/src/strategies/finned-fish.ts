/**
 * Finned / Sashimi Fish — 鳍鱼与寿司鱼
 *
 * Extension of basic fish: base/cover alignment holds except for fin cells
 * (base candidates outside the cover set) confined to a single box.
 * Eliminate digit d from cover cells that a plain fish would clear AND that
 * see every fin cell.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍 X翼', en: 'Finned X-Wing' },
  3: { zh: '鳍剑鱼', en: 'Finned Swordfish' },
  4: { zh: '鳍水母', en: 'Finned Jellyfish' },
};

function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return;
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

function sharesHouse(a: number, b: number): boolean {
  return ROW_OF[a]! === ROW_OF[b]! || COL_OF[a]! === COL_OF[b]! || BOX_OF[a]! === BOX_OF[b]!;
}

function seesAllFins(cell: number, fins: readonly number[]): boolean {
  for (const fin of fins) {
    if (!sharesHouse(cell, fin)) return false;
  }
  return true;
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
    if (covers.length >= 1) {
      coverSets.push([...new Set(covers)]);
    } else {
      coverSets.push([]);
    }
  }

  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 1 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const coverUnion = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) coverUnion.add(ci);
    }
    if (coverUnion.size < size) continue;

    for (const coverCombo of combineIndices(coverUnion.size, size)) {
      const coverIndices = coverCombo.map((i) => [...coverUnion][i]!);
      const coverSet = new Set(coverIndices);
      const baseSet = new Set(baseIndices);

      const finCells: number[] = [];
      const baseCells: number[] = [];

      for (const bi of baseIndices) {
        const house = baseHouses[bi]!;
        for (const cell of house) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          if (coverSet.has(coverIdx)) {
            baseCells.push(cell);
          } else {
            finCells.push(cell);
          }
        }
      }

      if (finCells.length === 0) continue;

      const finBox = BOX_OF[finCells[0]!]!;
      if (!finCells.every((c) => BOX_OF[c] === finBox)) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const ci of coverIndices) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue;
          if (!seesAllFins(cell, finCells)) continue;
          eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coverIndices.sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const sashimi = baseCells.length === 0 || baseCells.every((c) => !coverSet.has(
        baseAxis === 'row' ? COL_OF[c]! : ROW_OF[c]!,
      ));
      const variant = sashimi ? '寿司' : '鳍';
      const variantEn = sashimi ? 'Sashimi' : 'Finned';

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...baseCells, ...finCells, ...eliminations.map((e) => e.cell)])],
          candidates: [
            ...baseCells.map((c) => ({ cell: c, digit: d })),
            ...finCells.map((c) => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${d}：${variant}${names.zh}。基础${baseAxisLabel} ${baseNums} 相对覆盖${baseAxis === 'row' ? '列' : '行'} ${coverNums} 构成约化鱼，鳍格集中在第 ${finBox + 1} 宫；消除同时看到全部鳍格且在覆盖线上的 ${d}。`,
          en: `Digit ${d}: ${variantEn} ${names.en}. Base ${baseAxisLabelEn}s ${baseNums} vs cover ${baseAxis === 'row' ? 'column' : 'row'}s ${coverNums} form a reduced fish with fin(s) in box ${finBox + 1}; eliminate ${d} from cover cells seeing every fin.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FISH_NAMES[size]!,
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size, id);
        if (step) return step;
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