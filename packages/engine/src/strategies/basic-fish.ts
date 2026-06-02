/**
 * T3: Basic Fish — X-Wing / Swordfish / Jellyfish.
 *
 * Unified base/cover model:
 *  For a given digit, find N base houses (rows or cols) whose candidates for
 *  that digit fall within exactly N cover houses (cols or rows). Then eliminate
 *  that digit from all cover-house cells outside the base houses.
 *
 *  Size 2 = X-Wing, Size 3 = Swordfish, Size 4 = Jellyfish.
 */

import { ROWS, COLS, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'basic-fish';

export const basicFish: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const step = findFish(grid, d, bit, ROWS, COLS, true);
      if (step) return step;
      const step2 = findFish(grid, d, bit, COLS, ROWS, false);
      if (step2) return step2;
    }
    return null;
  },
};

function findFish(
  grid: Grid,
  d: number,
  bit: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseIsRow: boolean
): Step | null {
  for (let size = 2; size <= 4; size++) {
    const result = findFishCombination(grid, d, bit, baseHouses, coverHouses, size, baseIsRow);
    if (result) return result;
  }
  return null;
}

function findFishCombination(
  grid: Grid,
  d: number,
  bit: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  size: number,
  baseIsRow: boolean
): Step | null {
  const baseIndices: number[] = [];
  for (let i = 0; i < baseHouses.length; i++) {
    const house = baseHouses[i]!;
    let count = 0;
    for (const cell of house) {
      if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) count++;
    }
    if (count >= 2 && count <= size + 3) baseIndices.push(i);
  }

  if (baseIndices.length < size) return null;

  const subsets = getCombinations(baseIndices, size);
  for (const bases of subsets) {
    const baseSet = new Set(bases);
    const coverSet = new Set<number>();

    for (const bi of bases) {
      const house = baseHouses[bi]!;
      for (const cell of house) {
        if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
          const coverIdx = baseIsRow ? COL_OF[cell]! : ROW_OF[cell]!;
          coverSet.add(coverIdx);
        }
      }
    }

    if (coverSet.size !== size) continue;

    const coverIndices = [...coverSet];
    const elims: { cell: number; digit: number }[] = [];
    const highlightCells: number[] = [];

    for (const bi of bases) {
      const house = baseHouses[bi]!;
      for (const cell of house) {
        if (grid.values[cell] === 0 && (grid.candidates[cell]! & bit)) {
          highlightCells.push(cell);
        }
      }
    }

    for (const ci of coverIndices) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.values[cell] === 0) {
          const baseIdx = baseIsRow ? ROW_OF[cell]! : COL_OF[cell]!;
          if (!baseSet.has(baseIdx) && grid.hasCandidate(cell, d)) {
            elims.push({ cell, digit: d });
          }
        }
      }
    }

    if (elims.length > 0) {
      const fishName = size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish';
      const fishZh = size === 2 ? 'X翼' : size === 3 ? '剑鱼' : '水母';
      const baseNames = bases.map((i) => baseIsRow ? `第${i + 1}行` : `第${i + 1}列`).join(',');
      const coverNames = coverIndices.map((i) => baseIsRow ? `第${i + 1}列` : `第${i + 1}行`).join(',');
      return {
        strategyId: STRATEGY_ID,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: highlightCells,
          candidates: highlightCells.map((cell) => ({ cell, digit: d })),
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在 ${fishZh} 模式中，基础行/列为 ${baseNames}，覆盖列/行为 ${coverNames}，从覆盖行/列的其他格中消去 ${d}（${fishZh}）。`,
          en: `Digit ${d} forms a ${fishName} with base houses ${baseNames} and cover houses ${coverNames}, eliminating ${d} from cover houses outside base intersections (${fishName}).`,
        },
      };
    }
  }
  return null;
}

function getCombinations(arr: number[], size: number): number[][] {
  if (size === arr.length) return [arr.slice()];
  if (size === 1) return arr.map((x) => [x]);
  if (size === 2) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        result.push([arr[i]!, arr[j]!]);
      }
    }
    return result;
  }
  if (size === 3) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 2; i++) {
      for (let j = i + 1; j < arr.length - 1; j++) {
        for (let k = j + 1; k < arr.length; k++) {
          result.push([arr[i]!, arr[j]!, arr[k]!]);
        }
      }
    }
    return result;
  }
  if (size === 4) {
    const result: number[][] = [];
    for (let i = 0; i < arr.length - 3; i++) {
      for (let j = i + 1; j < arr.length - 2; j++) {
        for (let k = j + 1; k < arr.length - 1; k++) {
          for (let l = k + 1; l < arr.length; l++) {
            result.push([arr[i]!, arr[j]!, arr[k]!, arr[l]!]);
          }
        }
      }
    }
    return result;
  }
  return [];
}
