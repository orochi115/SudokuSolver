import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, BOXES, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍X翼', en: 'Finned X-Wing' },
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

  const baseData: Array<{ eligible: boolean; coverPositions: Set<number>; cellsByCover: Map<number, number[]> }> = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const coverPositions = new Set<number>();
    const cellsByCover = new Map<number, number[]>();
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        coverPositions.add(coverIdx);
        const arr = cellsByCover.get(coverIdx) ?? [];
        arr.push(cell);
        cellsByCover.set(coverIdx, arr);
      }
    }
    baseData.push({ eligible: coverPositions.size >= 2 && coverPositions.size <= size + 2, coverPositions, cellsByCover });
  }

  const eligibleBases = baseData.map((bd, i) => bd.eligible ? i : -1).filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    const allCoverPositions = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of baseData[bi]!.coverPositions) allCoverPositions.add(ci);
    }

    if (allCoverPositions.size < size || allCoverPositions.size > size + 3) continue;

    for (const coverCombo of combineIndices(allCoverPositions.size, size)) {
      const coverArray = [...allCoverPositions];
      const coverIndices = coverCombo.map((i) => coverArray[i]!);
      const coverSet = new Set(coverIndices);

      const finCells: number[] = [];
      for (const bi of baseIndices) {
        for (const ci of baseData[bi]!.coverPositions) {
          if (!coverSet.has(ci)) {
            finCells.push(...baseData[bi]!.cellsByCover.get(ci)!);
          }
        }
      }

      if (finCells.length === 0) continue;

      const finBoxes = new Set(finCells.map((c) => BOX_OF[c]!));
      if (finBoxes.size !== 1) continue;
      const finBox = [...finBoxes][0]!;

      let validCore = true;
      for (const bi of baseIndices) {
        let hasCore = false;
        for (const ci of coverSet) {
          if (baseData[bi]!.cellsByCover.has(ci)) { hasCore = true; break; }
        }
        if (!hasCore) {
          const finInThisBase = finCells.some((fc) => {
            const cellRow = ROW_OF[fc]!;
            const cellCol = COL_OF[fc]!;
            return baseAxis === 'row' ? cellRow === bi : cellCol === bi;
          });
          if (!finInThisBase) { validCore = false; break; }
        }
      }
      if (!validCore) continue;

      const baseSet = new Set(baseIndices);
      const eliminations: { cell: number; digit: number }[] = [];
      const baseCells: number[] = [];

      for (const ci of coverIndices) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) {
            baseCells.push(cell);
            continue;
          }
          if (BOX_OF[cell]! !== finBox) continue;
          const seesAllFin = finCells.every((fc) => PEERS_OF[cell]!.includes(fc));
          if (!seesAllFin) continue;
          eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FINNED_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coverIndices.sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finLabel = finCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',');

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
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}号），加上第 ${finBox + 1} 宫的鳍格 ${finLabel}，构成${names.zh}；可在鳍宫内消去同时看到全部鳍格的覆盖格中的 ${d}。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} (base) covers ${size} ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) plus fin cell(s) ${finLabel} in box ${finBox + 1}, forming a ${names.en}; eliminate ${d} from cover cells in the fin box that see all fin cells.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FINNED_NAMES[size]!,
    difficulty,
    tieBreak: ['digit', 'size'],

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
