import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
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
    coverSets.push(covers.length >= 1 && covers.length <= size + 1 ? covers : []);
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
    if (coverUnion.size !== size + 1) continue;

    const covers = [...coverUnion];
    for (const finCover of covers) {
      const coreCovers = covers.filter((c) => c !== finCover);
      const coreSet = new Set(coreCovers);

      let allInCore = true;
      for (const bi of baseIndices) {
        for (const ci of coverSets[bi]!) {
          if (!coreSet.has(ci)) { allInCore = false; break; }
        }
        if (!allInCore) break;
      }
      if (allInCore) continue;

      const finCells: number[] = [];
      for (const bi of baseIndices) {
        for (const cell of baseHouses[bi]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          if (ci === finCover) finCells.push(cell);
        }
      }
      if (finCells.length === 0) continue;

      const finBoxSet = new Set(finCells.map((c) => BOX_OF[c]!));
      if (finBoxSet.size > 2) continue;

      const baseSet = new Set(baseIndices);
      const eliminations: { cell: number; digit: number }[] = [];
      const baseCells: number[] = [];

      for (const ci of coreCovers) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) {
            baseCells.push(cell);
          } else {
            const seesAllFin = finCells.every((fc) => PEERS_OF[cell]!.includes(fc));
            if (seesAllFin) eliminations.push({ cell, digit: d });
          }
        }
      }

      if (eliminations.length === 0) continue;

      const names = FINNED_FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coreCovers.sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finLabel = finCells.map((c) => cellLabel(c)).join(', ');

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
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数覆盖 ${size + 1} 个${baseAxis === 'row' ? '列' : '行'}，其中 ${finLabel} 为鳍；核心 ${size} 覆盖（${coverNums}号）构成${names.zh}，消去同时看到所有鳍格的核心覆盖格中的 ${d}。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} covers ${size + 1} ${baseAxis === 'row' ? 'column' : 'row'}s; ${finLabel} is the fin. Core ${size} covers (${coverNums}) form a ${names.en}; eliminate ${d} from core cover cells seeing all fin cells.`,
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
