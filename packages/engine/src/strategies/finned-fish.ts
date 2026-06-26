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

/**
 * For each base house, collect the set of perpendicular coordinates
 * where digit d appears. Returns arrays of cover-indices per base house.
 */
function getCoverSets(
  grid: Grid,
  d: number,
  baseHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
): number[][] {
  const bit = maskOf(d);
  return baseHouses.map((house) => {
    const covers: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        covers.push(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!);
      }
    }
    return covers;
  });
}

/**
 * Try finned fish for a digit d.
 *
 * For each size-N combo of base houses, find their candidate cover positions.
 * If the total number of distinct cover positions > N, the extras form the fin.
 * Requirements: fin cells are all in a single box.
 * Eliminate d from cover cells in the fin box that are not in any base house.
 */
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
  const coverSets = getCoverSets(grid, d, baseHouses, baseAxis);

  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    const allCoverPositions = new Set<number>();
    const allFinCandidateCells: number[] = [];

    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) {
        allCoverPositions.add(ci);
        const cell = baseAxis === 'row' ? bi * 9 + ci : ci * 9 + bi;
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          if (!allFinCandidateCells.includes(cell)) {
            allFinCandidateCells.push(cell);
          }
        }
      }
    }

    if (allCoverPositions.size <= size) continue;
    if (allCoverPositions.size > size + 1) continue;

    const validCoverSubsets: number[][] = [];
    const coverPositionArray = [...allCoverPositions];
    for (const subset of combineIndices(coverPositionArray.length, size)) {
      validCoverSubsets.push(subset.map((i) => coverPositionArray[i]!));
    }

    for (const coverSubset of validCoverSubsets) {
      const coverSet = new Set(coverSubset);
      const finCells: number[] = [];

      for (const bi of baseIndices) {
        for (const ci of coverSets[bi]!) {
          if (!coverSet.has(ci)) {
            const cell = baseAxis === 'row' ? bi * 9 + ci : ci * 9 + bi;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
              if (!finCells.includes(cell)) finCells.push(cell);
            }
          }
        }
      }

      if (finCells.length === 0) continue;

      const finBoxes = new Set(finCells.map((c) => BOX_OF[c]!));
      if (finBoxes.size !== 1) continue;

      const finBoxIdx = [...finBoxes][0]!;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const ci of coverSubset) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          if (BOX_OF[cell] !== finBoxIdx) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseIndices.includes(bi)) continue;
          const seesAllFin = finCells.every((fc) => {
            if (fc === cell) return false;
            return ROW_OF[fc] === ROW_OF[cell] || COL_OF[fc] === COL_OF[cell] || BOX_OF[fc] === BOX_OF[cell];
          });
          if (seesAllFin) eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const baseCells: number[] = [];
      for (const bi of baseIndices) {
        for (const ci of coverSets[bi]!) {
          if (coverSet.has(ci)) {
            const cell = baseAxis === 'row' ? bi * 9 + ci : ci * 9 + bi;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
              baseCells.push(cell);
            }
          }
        }
      }

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');

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
          zh: `数字 ${d}：在第 ${baseNums} ${baseAxisLabel} 上候选数近乎形成${size === 2 ? 'X翼' : size === 3 ? '剑鱼' : '水母'}，但第 ${finBoxIdx + 1} 宫有鳍格；消除鳍格所在宫中覆盖${baseAxis === 'row' ? '列' : '行'}上的 ${d}。`,
          en: `Digit ${d}: Almost a ${names.en} in ${baseAxisLabelEn}s ${baseNums} with a fin in box ${finBoxIdx + 1}; eliminate ${d} from cover cells in the fin box.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  const baseName = size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish';
  return {
    id,
    name: { zh: `鳍${baseName}`, en: `Finned ${baseName}` },
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