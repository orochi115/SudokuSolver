import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍鱼 X翼', en: 'Finned X-Wing' },
  3: { zh: '鳍鱼 剑鱼', en: 'Finned Swordfish' },
  4: { zh: '鳍鱼 水母', en: 'Finned Jellyfish' },
};

/** Generate all size-k combinations from [0..n-1]. */
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

  // Collect all base lines that have candidate d
  const eligibleBases: number[] = [];
  const baseCandidatesByLine: number[][] = Array.from({ length: 9 }, () => []);

  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        baseCandidatesByLine[i]!.push(cell);
      }
    }
    // A base line must have at least 1 candidate to be part of a non-trivial/degenerate fish (note in Sashimi one base line may now hold only the fin's box-mate, which means 1 core cell)
    if (baseCandidatesByLine[i]!.length >= 1) {
      eligibleBases.push(i);
    }
  }

  // Iterate over all base line combinations of size N
  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const baseSet = new Set(baseIndices);

    // All candidates in these base lines
    const baseCandidates: number[] = [];
    for (const bi of baseIndices) {
      baseCandidates.push(...baseCandidatesByLine[bi]!);
    }

    // Iterate over all cover line combinations of size N
    for (const coverIndices of combineIndices(9, size)) {
      const coverSet = new Set(coverIndices);

      // Find fin cells: base candidates whose cover index is not in the cover set
      const finCells: number[] = [];
      const coreCells: number[] = [];
      for (const cell of baseCandidates) {
        const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverSet.has(ci)) {
          coreCells.push(cell);
        } else {
          finCells.push(cell);
        }
      }

      // Fin cells must be non-empty (if empty, it's a basic fish)
      if (finCells.length === 0) continue;

      // All fin cells must lie in a single box
      const finBox = BOX_OF[finCells[0]!]!;
      if (!finCells.every((cell) => BOX_OF[cell] === finBox)) continue;

      // Each base line must still contain at least one core cell
      let baseLinesValid = true;
      for (const bi of baseIndices) {
        const hasCore = coreCells.some((cell) =>
          baseAxis === 'row' ? ROW_OF[cell] === bi : COL_OF[cell] === bi
        );
        if (!hasCore) {
          baseLinesValid = false;
          break;
        }
      }
      if (!baseLinesValid) continue;

      // Find eliminations:
      // Cells in cover lines, NOT in base lines, having candidate d, and seeing ALL fin cells
      const eliminations: { cell: number; digit: number }[] = [];
      const coreInCover: number[] = [];

      for (const ci of coverIndices) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) {
            coreInCover.push(cell);
            continue; // in base line
          }

          // Does it see all fin cells?
          const seesAllFins = finCells.every((f) => PEERS_OF[f]!.includes(cell));
          if (seesAllFins) {
            eliminations.push({ cell, digit: d });
          }
        }
      }

      if (eliminations.length === 0) continue;

      // Gather highlights
      const highlightCells = [...new Set([...coreInCover, ...finCells, ...eliminations.map((e) => e.cell)])];
      const highlightCandidates = [
        ...coreInCover.map((c) => ({ cell: c, digit: d })),
        ...finCells.map((c) => ({ cell: c, digit: d })),
        ...eliminations,
      ];

      const names = FINNED_FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coverIndices.map((i) => i + 1).join(', ');

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: highlightCells,
          candidates: highlightCandidates,
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选数，因在宫 ${finBox + 1} 内存在鳍格（${finCells.map(c => `r${ROW_OF[c]! + 1}c${COL_OF[c]! + 1}`).join(', ')}），几乎构成覆盖于第 ${coverNums} ${baseAxis === 'row' ? '列' : '行'}的 ${names.zh}；可消去同时看到所有鳍格且在覆盖线上的候选数 ${d}。`,
          en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) almost fit in cover ${baseAxis === 'row' ? 'column' : 'row'}s ${coverNums}, spoiled by fin cells in box ${finBox + 1} (${finCells.map(c => `r${ROW_OF[c]! + 1}c${COL_OF[c]! + 1}`).join(', ')}); eliminate ${d} from cover cells that see all fin cells.`,
        },
      };
    }
  }

  return null;
}

export function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
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
