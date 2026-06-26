/**
 * Finned & Sashimi Fish (T4/T5) — 鳍鱼与寿司鱼 (X-Wing / Swordfish / Jellyfish)
 *
 * Size 2 → finned-x-wing, Size 3 → finned-swordfish, Size 4 → finned-jellyfish.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

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

  const lineCandidates: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const cells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    lineCandidates.push(cells);
  }

  const eligibleBases = lineCandidates
    .map((cells, i) => (cells.length >= 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map(i => eligibleBases[i]!);
    const baseSet = new Set(baseIndices);
    const baseCells = baseIndices.flatMap((bi) => lineCandidates[bi]!);
    if (baseCells.length === 0) continue;

    const allCovers = new Set<number>();
    for (const cell of baseCells) {
      const cc = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      allCovers.add(cc);
    }

    if (allCovers.size <= size) continue;

    const allCoversArr = [...allCovers];
    for (const coverIndices of combineIndices(allCoversArr.length, size)) {
      const coverSet = new Set(coverIndices.map(idx => allCoversArr[idx]!));

      const finCells = baseCells.filter((cell) => {
        const cc = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        return !coverSet.has(cc);
      });

      if (finCells.length === 0) continue;

      const finBoxes = new Set(finCells.map((c) => BOX_OF[c]));
      if (finBoxes.size !== 1) continue;
      const finBox = [...finBoxes][0]!;

      const remainingBaseCells = baseCells.filter((cell) => {
        const cc = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        return coverSet.has(cc);
      });

      let validReduced = true;
      for (const bi of baseIndices) {
        const hasRemaining = remainingBaseCells.some((cell) => {
          const bc = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          return bc === bi;
        });
        if (!hasRemaining) {
          validReduced = false;
          break;
        }
      }
      if (!validReduced) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      const fishCoverCells: number[] = [];

      for (const ci of coverSet) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) {
            fishCoverCells.push(cell);
          } else {
            const seesAllFins = finCells.every((fc) => {
              return ROW_OF[cell] === ROW_OF[fc] || COL_OF[cell] === COL_OF[fc] || BOX_OF[cell] === BOX_OF[fc];
            });
            if (seesAllFins) {
              eliminations.push({ cell, digit: d });
            }
          }
        }
      }

      if (eliminations.length === 0) continue;

      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const fishNameZh = size === 2 ? '鳍鱼/寿司鱼' : size === 3 ? '鳍剑鱼/寿司剑鱼' : '鳍水母/寿司水母';
      const fishNameEn = size === 2 ? 'Finned/Sashimi X-Wing' : size === 3 ? 'Finned/Sashimi Swordfish' : 'Finned/Sashimi Jellyfish';

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...fishCoverCells, ...finCells, ...eliminations.map((e) => e.cell)])],
          candidates: [
            ...fishCoverCells.map((c) => ({ cell: c, digit: d })),
            ...finCells.map((c) => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数被覆盖于 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}号）外加宫 B${finBox + 1} 的鳍（${finCells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}），构成${fishNameZh}；可消去看到全部鳍的覆盖格子 ${d}。`,
          en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) fit in ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) with a fin in box B${finBox + 1} (${finCells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}), forming a ${fishNameEn}; eliminate ${d} from cover cells seeing all fin cells.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: {
      zh: size === 2 ? '鳍鱼/寿司鱼' : size === 3 ? '鳍剑鱼/寿司剑鱼' : '鳍水母/寿司水母',
      en: size === 2 ? 'Finned/Sashimi X-Wing' : size === 3 ? 'Finned/Sashimi Swordfish' : 'Finned/Sashimi Jellyfish',
    },
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
