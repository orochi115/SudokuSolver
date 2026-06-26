/**
 * Finned & Sashimi Fish (T4) — 鳍鱼与寿司鱼
 *
 * A finned fish is a basic fish that almost holds, spoiled by a few extra
 * candidates (the "fin") confined to one box. You may still eliminate the digit
 * from any cell that:
 *   1. Would be eliminated by the plain fish (a cover cell not in any base line), AND
 *   2. Sees every fin cell (i.e. lies in the same box as all fin cells).
 *
 * Sashimi = the fin's box lacks a genuine fish corner (missing corner / degenerate fish);
 * detected automatically — same algorithm, different geometry.
 *
 * Sizes: 2 (Finned X-Wing), 3 (Finned Swordfish), 4 (Finned Jellyfish).
 *
 * Research card: research/sudoku-human-solving/local-library/techniques/04-fish/finned-sashimi.md
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Generate all size-k combinations from a subset of indices. */
function* combineIndices(indices: number[], size: number): Generator<number[]> {
  const n = indices.length;
  if (n < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => indices[i]!);
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

/**
 * Try finned fish using base=baseHouses, cover=coverHouses.
 * baseAxis: 'row' means base lines are rows, cover lines are columns (and vice versa).
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

  // For each base house, collect candidate cells and their cover-axis indices
  const baseCandCells: number[][] = [];
  const coverIdxSets: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const cells: number[] = [];
    const coverIdxs: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        cells.push(cell);
        coverIdxs.push(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!);
      }
    }
    baseCandCells.push(cells);
    coverIdxSets.push(coverIdxs);
  }

  // Only consider base houses with at least 1 candidate
  const eligibleBases = baseCandCells
    .map((cells, i) => (cells.length >= 1 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases, size)) {
    // baseCombo: array of size base house indices

    // Union of all candidate cells in these base houses
    const allBaseCells: number[] = [];
    for (const bi of baseCombo) {
      allBaseCells.push(...baseCandCells[bi]!);
    }

    // Collect all cover indices from all base cells
    const allCoverIdxs = allBaseCells.map((c) => (baseAxis === 'row' ? COL_OF[c]! : ROW_OF[c]!));
    const coverUnion = new Set(allCoverIdxs);

    // We need: covered base cells (within N cover lines) + fin cells (outside N cover lines)
    // Try all C(coverUnion.size, size) cover sets of size N
    const coverCandidates = [...coverUnion];

    for (const coverCombo of combineIndices(coverCandidates, size)) {
      const coverSet = new Set(coverCombo);

      // Separate base candidates into covered and fin (outside cover)
      const coveredCells: number[] = [];
      const finCells: number[] = [];
      for (const cell of allBaseCells) {
        const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverSet.has(ci)) {
          coveredCells.push(cell);
        } else {
          finCells.push(cell);
        }
      }

      // Fin must be non-empty (otherwise it's a basic fish)
      if (finCells.length === 0) continue;

      // All fin cells must be in a single box
      const finBoxes = new Set(finCells.map((c) => BOX_OF[c]!));
      if (finBoxes.size !== 1) continue;
      const finBox = finCells[0]!; // representative cell in fin box
      const finBoxIdx = BOX_OF[finBox]!;

      // Each base line must have at least one candidate in the covered area
      // (Sashimi: a base line may have only fin cells — that's ok, same algorithm)
      let eachBaseLineContributes = true;
      for (const bi of baseCombo) {
        const lineContrib = baseCandCells[bi]!.some((c) => {
          const ci = baseAxis === 'row' ? COL_OF[c]! : ROW_OF[c]!;
          return coverSet.has(ci);
        });
        // In sashimi, a base line may contribute only fin candidates (no covered)
        // The overall pattern is still valid. We require at least one base line
        // has covered candidates (otherwise the fish backbone is entirely fin, not a fish).
        // Actually for finned/sashimi: we just require all base cells either covered or fin.
        // We'll allow a base line with only fin cells (sashimi).
        if (!lineContrib) {
          // Check: do all base cells in this line lie in the fin box?
          const allInFinBox = baseCandCells[bi]!.every((c) => BOX_OF[c]! === finBoxIdx);
          if (!allInFinBox) {
            eachBaseLineContributes = false;
            break;
          }
        }
      }
      if (!eachBaseLineContributes) continue;

      // Compute plain-fish elimination targets: cover cells not in any base line, carrying d
      const baseSet = new Set(baseCombo);
      const elimTargets: number[] = [];
      for (const ci of coverSet) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue; // in a base line => not eliminated
          // This cell would be eliminated by the plain fish
          // Now restrict: it must see ALL fin cells (i.e. be in the fin box)
          if (BOX_OF[cell]! !== finBoxIdx) continue;
          // Don't eliminate fin cells themselves
          if (finCells.includes(cell)) continue;
          elimTargets.push(cell);
        }
      }

      if (elimTargets.length === 0) continue;

      // Valid finned fish found!
      const baseNums = baseCombo.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const finLabels = finCells.map(cellLabel).join(', ');
      const fishNames: Record<number, { zh: string; en: string }> = {
        2: { zh: '鳍翼 X-Wing', en: 'Finned X-Wing' },
        3: { zh: '鳍剑鱼', en: 'Finned Swordfish' },
        4: { zh: '鳍水母', en: 'Finned Jellyfish' },
      };
      const names = fishNames[size]!;

      const highlightCells = [...new Set([...allBaseCells, ...elimTargets])];
      const highlightCands = [
        ...allBaseCells.map((c) => ({ cell: c, digit: d })),
        ...elimTargets.map((c) => ({ cell: c, digit: d })),
      ];

      return {
        strategyId,
        placements: [],
        eliminations: elimTargets.map((c) => ({ cell: c, digit: d })),
        highlights: {
          cells: highlightCells,
          candidates: highlightCands,
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）几乎构成${names.zh}，仅鳍格 ${finLabels}（均在 B${finBoxIdx + 1} 宫）超出覆盖列 ${coverNums}；任何同时在覆盖线内且与全部鳍格同宫的格子可消去 ${d}。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} (base) almost forms a ${names.en} covering ${baseAxis === 'row' ? 'column' : 'row'}s ${coverNums}, with fin cell(s) ${finLabels} (all in box ${finBoxIdx + 1}); eliminate ${d} from cover cells that also see all fin cells (inside the fin box).`,
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
      2: { zh: '鳍翼 X-Wing', en: 'Finned X-Wing' },
      3: { zh: '鳍剑鱼', en: 'Finned Swordfish' },
      4: { zh: '鳍水母', en: 'Finned Jellyfish' },
    }[size]!,
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
