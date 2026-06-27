/**
 * Finned/Sashimi Fish (T4) — 鱼鳍/佐仕豪型
 *
 * Extension of basic fish: the "base" houses can now include "fins" — candidate
 * cells that lie in the same column/line as a cover and can see all the base
 * houses. A fin allows eliminations in the same line as the fin (the fin's
 * "իոնχη""). Sashimi fish are a presentation variant when the fin is missing.
 *
 * Logic: if we remove the fin candidates, the base+cover form a standard fish.
 * Hence the candidates in the fish cover sets are still constrained. And because
 * one of the fin candidates must be true, the other can be eliminated from the
 * fin's line/box if it sees the base houses.
 */

import { ROWS, COLS, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '带鳍 X翼', en: 'Finned X-Wing' },
  3: { zh: '带鳍 剑鱼', en: 'Finned Swordfish' },
  4: { zh: '带鳍 水母', en: 'Finned Jellyfish' },
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
    if (covers.length >= 2 && covers.length <= size + 1) { // allow extra candidates for fins
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

    if (coverUnion.size === size) {
      const baseSet = new Set(baseIndices);
      const coverList = [...coverUnion].sort((a, b) => a - b);

      // Find fins: cells in cover houses outside base that can see ALL base houses
      const finCells: number[] = [];
      for (const ci of coverList) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const baseCoord = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(baseCoord)) continue;

          // Check if this cell can see ALL base houses
          let seesAll = true;
          for (const bi of baseIndices) {
            const baseHouse = baseHouses[bi]!;
            let seesHouse = false;
            for (const bc of baseHouse) {
              if (bc === cell) continue;
              if (ROW_OF[cell] === ROW_OF[bc] || COL_OF[cell] === COL_OF[bc] || 
                  (Math.floor(ROW_OF[cell]! / 3) === Math.floor(ROW_OF[bc]! / 3) &&
                   Math.floor(COL_OF[cell]! / 3) === Math.floor(COL_OF[bc]! / 3))) {
                seesHouse = true;
                break;
              }
            }
            if (!seesHouse) {
              seesAll = false;
              break;
            }
          }
          if (seesAll) {
            finCells.push(cell);
          }
        }
      }

      if (finCells.length === 0) continue;

      // Eliminations: candidates in fin's line/box that are not the fin itself
      const eliminations: { cell: number; digit: number }[] = [];
      const baseCells: number[] = [];
      const affectedCells = new Set<number>();

      // Standard fish coverage eliminations (non-fin part)
      for (const ci of coverList) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const baseCoord = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(baseCoord)) {
            baseCells.push(cell);
          } else if (!finCells.includes(cell)) {
            eliminations.push({ cell, digit: d });
            affectedCells.add(cell);
          }
        }
      }

      // Finned elimination: any cell in the same line/box as a fin that can see
      // all base houses and is not a base cell
      for (const finCell of finCells) {
        const finRow = ROW_OF[finCell]!;
        const finCol = COL_OF[finCell]!;
        const finBox = 3 * Math.floor(finRow / 3) + Math.floor(finCol / 3);

        // Check siblings in the same row
        for (let c = 0; c < 9; c++) {
          const cell = finRow * 9 + c;
          if (cell === finCell) continue;
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          if (baseCells.includes(cell) || affectedCells.has(cell)) continue;

          let seesAll = true;
          for (const bi of baseIndices) {
            const baseCoord = baseAxis === 'row' ? bi : finRow;
            let seesHouse = false;
            for (const bc of baseHouses[bi]!) {
              if (bc === cell) continue;
              if (ROW_OF[cell] === ROW_OF[bc] || COL_OF[cell] === COL_OF[bc] ||
                  (Math.floor(ROW_OF[cell] / 3) === Math.floor(ROW_OF[bc] / 3) &&
                   Math.floor(COL_OF[cell] / 3) === Math.floor(COL_OF[bc] / 3))) {
                seesHouse = true;
                break;
              }
            }
            if (!seesHouse) {
              seesAll = false;
              break;
            }
          }
          if (seesAll) {
            eliminations.push({ cell, digit: d });
            affectedCells.add(cell);
          }
        }

        // Check siblings in the same column
        for (let r = 0; r < 9; r++) {
          const cell = r * 9 + finCol;
          if (cell === finCell) continue;
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          if (baseCells.includes(cell) || affectedCells.has(cell)) continue;

          let seesAll = true;
          for (const bi of baseIndices) {
            const baseCoord = baseAxis === 'row' ? bi : finCol;
            let seesHouse = false;
            for (const bc of baseHouses[bi]!) {
              if (bc === cell) continue;
              if (ROW_OF[cell] === ROW_OF[bc] || COL_OF[cell] === COL_OF[bc] ||
                  (Math.floor(ROW_OF[cell] / 3) === Math.floor(ROW_OF[bc] / 3) &&
                   Math.floor(COL_OF[cell] / 3) === Math.floor(COL_OF[bc] / 3))) {
                seesHouse = true;
                break;
              }
            }
            if (!seesHouse) {
              seesAll = false;
              break;
            }
          }
          if (seesAll) {
            eliminations.push({ cell, digit: d });
            affectedCells.add(cell);
          }
        }

        // Check siblings in the same box
        for (let r = finBox * 3; r < finBox * 3 + 3; r++) {
          for (let c = finCol * 3; c < finCol * 3 + 3; c++) {
            const cell = (finBox * 3) + r + c;
            if (cell === finCell) continue;
            if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
            if (baseCells.includes(cell) || affectedCells.has(cell)) continue;

            let seesAll = true;
            for (const bi of baseIndices) {
              let seesHouse = false;
              for (const bc of baseHouses[bi]!) {
                if (bc === cell) continue;
                if (ROW_OF[cell] === ROW_OF[bc] || COL_OF[cell] === COL_OF[bc] ||
                    (Math.floor(ROW_OF[cell] / 3) === Math.floor(ROW_OF[bc] / 3) &&
                     Math.floor(COL_OF[cell] / 3) === Math.floor(COL_OF[bc] / 3))) {
                  seesHouse = true;
                  break;
                }
              }
              if (!seesHouse) {
                seesAll = false;
                break;
              }
            }
            if (seesAll) {
              eliminations.push({ cell, digit: d });
              affectedCells.add(cell);
            }
          }
        }
      }

      if (eliminations.length === 0) continue;

      const names = FINNED_FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coverList.map((i) => i + 1).join(', ');
      const finInfo = finCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');

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
          zh: `数字 ${d} 在${baseAxisLabel}（${baseNums}）（基础集）的候选数通过鳍格 R（${finInfo}）覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}），构成带鳍${names.zh}；消去鳍格共享线路上看到全部基础集的 ${d} 呢。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} (base) fit ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) with fins at R (${finInfo}), forming a ${names.en}; eliminate ${d} from cells in the fin lines seeing all base houses.`,
        },
      };
    }
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
        const step1 = tryFinnedFish(grid, d, ROWS, COLS, 'row', size, id);
        if (step1) return step1;
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
