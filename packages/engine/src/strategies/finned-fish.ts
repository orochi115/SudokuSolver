/**
 * Finned Fish (T3) — 鳍鱼与寿司鱼 (X-Wing / Swordfish / Jellyfish)
 * 
 * A finned fish is a basic fish that almost holds, spoiled by a few extra candidates
 * ("the fin") confined to one box. You may eliminate the digit from cells that
 * would be cleared by the plain fish AND that also see every fin cell.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍 X翼', en: 'Finned X-Wing' },
  3: { zh: '鳍 剑鱼', en: 'Finned Swordfish' },
  4: { zh: '鳍 水母', en: 'Finned Jellyfish' },
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

function areAllInSameBox(cells: number[]): number | null {
  if (cells.length === 0) return null;
  const box = BOX_OF[cells[0]!]!;
  for (let i = 1; i < cells.length; i++) {
    if (BOX_OF[cells[i]!]! !== box) return null;
  }
  return box;
}

function seeAllFinCells(cell: number, finCells: number[]): boolean {
  // A cell sees all fin cells if it shares a house (row, col, or box) with each fin cell
  outer: for (const finCell of finCells) {
    if (cell === finCell) continue;
    const sameRow = ROW_OF[cell]! === ROW_OF[finCell]!;
    const sameCol = COL_OF[cell]! === COL_OF[finCell]!;
    const sameBox = BOX_OF[cell]! === BOX_OF[finCell]!;
    if (!sameRow && !sameCol && !sameBox) {
      return false;
    }
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
  const names = FINNED_FISH_NAMES[size]!;

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
    coverSets.push(covers);
  }

  // Try all combinations of `size` base houses
  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 1 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    
    // Map each base house's cover indices
    const baseLinesCover: number[][] = baseIndices.map((bi) => coverSets[bi]!);
    const coverUnion = new Set<number>();
    for (const covers of baseLinesCover) {
      for (const ci of covers) coverUnion.add(ci);
    }
    const coverList = [...coverUnion];

    // Look for fins: base candidates that lie outside coverUnion
    const finCells: number[] = [];
    const baseCellsInCover: number[] = [];
    
    for (const bi of baseIndices) {
      const house = baseHouses[bi]!;
      for (const cell of house) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const coverCoord = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverUnion.has(coverCoord)) {
          baseCellsInCover.push(cell);
        } else {
          finCells.push(cell);
        }
      }
    }

    if (finCells.length === 0) continue; // no fin -> basic fish, not finned

    // Constraint: all fin cells must lie in a single box
    const finBox = areAllInSameBox(finCells);
    if (!finBox) continue; // fins span multiple boxes -> invalid

    // Prepare target cells under plain fish
    const baseSet = new Set(baseIndices);
    const targetCells: number[] = [];

    for (const ci of coverList) {
      const house = coverHouses[ci]!;
      for (const cell of house) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const baseCoord = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (!baseSet.has(baseCoord) && seeAllFinCells(cell, finCells)) {
          targetCells.push(cell);
        }
      }
    }

    if (targetCells.length === 0) continue;

    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = coverList.sort((a, b) => a - b).map((i) => i + 1).join(', ');
    const finBoxNum = finBox + 1;

    return {
      strategyId,
      placements: [],
      eliminations: targetCells.map((cell) => ({ cell, digit: d })),
      highlights: {
        cells: [...baseCellsInCover, ...finCells, ...targetCells],
        candidates: [
          ...baseCellsInCover.map((c) => ({ cell: c, digit: d })),
          ...finCells.map((c) => ({ cell: c, digit: d })),
          ...targetCells.map((c) => ({ cell: c, digit: d })),
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）与 ${coverNums} 号 ${baseAxis === 'row' ? '列' : '行'}（覆盖集）构成鳍鱼，鳍位于格 ${finCells.map(c => String.fromCharCode(65 + Math.floor(c / 9)) + (c % 9 + 1)).join(', ')}（均在盒 ${finBoxNum}）；可从覆盖集中看到全部鳍格的格子消去 ${d}。`,
        en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) together with cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) form a Finned ${names.en}; eliminate ${d} from cover-line cells that see every fin cell in box ${finBoxNum}.`,
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

// Finned fish sizes (follow basic fish)
export const finnedXWing = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);
