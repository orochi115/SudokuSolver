import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const BASE_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼鳍鱼', en: 'Finned X-Wing' },
  3: { zh: '剑鱼鳍鱼', en: 'Finned Swordfish' },
  4: { zh: '水母鳍鱼', en: 'Finned Jellyfish' },
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
    if (covers.length >= 2 && covers.length <= size) {
      coverSets.push(covers);
    } else {
      coverSets.push([]);
    }
  }

  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const coverUnion = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) coverUnion.add(ci);
    }

    const baseSet = new Set(baseIndices);
    const baseCells: number[] = [];
    const coreCoverCells: number[] = [];
    const allFishCells: number[] = [];

    for (const ci of coverUnion) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (baseSet.has(bi)) {
          baseCells.push(cell);
          allFishCells.push(cell);
        } else {
          coreCoverCells.push(cell);
        }
      }
    }

    const finCells: number[] = [];
    for (const bi of baseIndices) {
      const baseHouse = baseHouses[bi]!;
      for (const cell of baseHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (!coverUnion.has(coverIdx)) {
          finCells.push(cell);
        }
      }
    }

    if (finCells.length === 0) continue;

    const finBoxes = new Set(finCells.map((c) => BOX_OF[c]!));
    if (finBoxes.size !== 1) continue;

    const finBox = [...finBoxes][0]!;

    const eliminations: { cell: number; digit: number }[] = [];
    for (const cell of coreCoverCells) {
      if (BOX_OF[cell] === finBox) {
        eliminations.push({ cell, digit: d });
      }
    }

    if (eliminations.length === 0) continue;

    const isSashimi = baseCells.some((c) => BOX_OF[c] === finBox);

    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = [...coverUnion].sort((a, b) => a - b).map((i) => i + 1).join(', ');
    const names = BASE_NAMES[size]!;
    const sashimiLabel = isSashimi ? 'Sashimi ' : 'Finned ';

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...allFishCells, ...finCells, ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...allFishCells.map((c) => ({ cell: c, digit: d })),
          ...finCells.map((c) => ({ cell: c, digit: d })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d}：${isSashimi ? '寿司鱼' : '鳍鱼'}。${size}条${baseAxisLabel}（${baseNums}）上数字 ${d} 的候选数几乎构成${baseAxis === 'row' ? '列' : '行'}覆盖（${coverNums}），但第${finBox + 1}宫有额外候选（鳍）；消去覆${baseAxis === 'row' ? '列' : '行'}中在该宫内且非基础${baseAxisLabel}的格中的 ${d}。`,
        en: `Digit ${d}: ${sashimiLabel}${names.en.split(' ').slice(1).join(' ') || names.en}. The fish in ${baseAxisLabelEn}s ${baseNums} (cover ${baseAxis === 'row' ? 'col' : 'row'}s ${coverNums}) has a fin in box ${finBox + 1}; eliminate ${d} from cover cells in that fin box.`,
      },
    };
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: { zh: `${size === 2 ? '鳍鱼X翼' : size === 3 ? '鳍鱼剑鱼' : '鳍鱼水母'}`, en: `Finned ${size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish'}` },
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

export const finnedXWing: Strategy = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish: Strategy = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish: Strategy = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);