/**
 * Finned & Sashimi Fish (T4) — 鳍鱼与寿司鱼
 *
 * Extension of basic fish (X-Wing / Swordfish / Jellyfish) where extra "fin"
 * candidates in one box spoil the strict base/cover containment.
 *
 * Pattern:
 *   - Choose N base lines and N cover lines for digit d.
 *   - All base candidates must be covered by the N cover lines,
 *     EXCEPT for some extra candidates ("fin") that all lie in one single box.
 *   - Eliminate d from any cell that:
 *     1. The plain fish would eliminate (cover cell not in a base line), AND
 *     2. Sees every fin cell (shares the fin's box, since all fins are in one box)
 *
 * Finned: the fin's box also contains a genuine fish corner (normal).
 * Sashimi: the fin's box has no fish corner (degenerate / missing corner).
 * Both use the same detector and elimination rule.
 *
 * Size 2 → Finned X-Wing, Size 3 → Finned Swordfish, Size 4 → Finned Jellyfish.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍形X翼', en: 'Finned X-Wing' },
  3: { zh: '鳍形剑鱼', en: 'Finned Swordfish' },
  4: { zh: '鳍形水母', en: 'Finned Jellyfish' },
};

/** Generate all size-k combinations from indices [0..n-1]. */
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
 * Try finned fish for one base axis / direction.
 * baseHouses: the 9 lines on the base axis
 * coverHouses: the 9 orthogonal lines
 * baseAxis: 'row' or 'col'
 * coordOf: returns the cover-axis index of a cell
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
    if (covers.length >= 2 && covers.length <= size + 1) {
      // Allow up to size+1 cover indices per base line (one can be a fin)
      coverSets.push(covers);
    } else if (covers.length === 1) {
      // A single-candidate line can be part of a sashimi fish (degenerate)
      coverSets.push(covers);
    } else {
      coverSets.push([]); // placeholder
    }
  }

  // Try all combinations of `size` base houses
  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 1 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    // Collect all candidate cells in the base lines
    const allBaseCandidates: { cell: number; coverIdx: number; baseIdx: number }[] = [];
    for (const bi of baseIndices) {
      const house = baseHouses[bi]!;
      for (const cell of house) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          allBaseCandidates.push({ cell, coverIdx, baseIdx: bi });
        }
      }
    }

    // Find all cover indices used
    const allCoverIndices = new Set(allBaseCandidates.map((c) => c.coverIdx));

    // If total cover indices <= size → plain basic fish (handled elsewhere), skip
    if (allCoverIndices.size <= size) continue;

    // Try each size-subset of cover indices as the cover set
    const coverIdxArray = [...allCoverIndices];

    for (const coverCombo of combineIndices(coverIdxArray.length, size)) {
      const coverSet = new Set(coverCombo.map((i) => coverIdxArray[i]!));

      // Cells not covered by cover set = fin candidates
      const finCandidates = allBaseCandidates.filter((c) => !coverSet.has(c.coverIdx));
      if (finCandidates.length === 0) continue; // No fin = basic fish, skip

      // All fin candidates must be in a single box
      const finBoxes = new Set(finCandidates.map((c) => BOX_OF[c.cell]!));
      if (finBoxes.size !== 1) continue;

      const finBox = [...finBoxes][0]!;
      const finCells = finCandidates.map((c) => c.cell);

      // Each base line must still have at least one candidate (check sashimi validity)
      // For sashimi: a base line may have all its candidates as fin (missing corner)
      // For finned: the box has both fin and fish corner
      // Either way, the pattern is valid as long as we have eliminations

      // Gather the plain-fish elimination targets:
      // Cover cells NOT in any base line that have d as candidate
      const baseSet = new Set(baseIndices);
      const elimTargets: number[] = [];

      for (const ci of coverSet) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue; // In a base line, not a target
          elimTargets.push(cell);
        }
      }

      // Filter: keep only targets that see all fin cells (share the fin box)
      const eliminations: { cell: number; digit: number }[] = [];
      for (const target of elimTargets) {
        if (BOX_OF[target] === finBox) {
          eliminations.push({ cell: target, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      // Build base cells for highlights
      const baseCells = allBaseCandidates.map((c) => c.cell);

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finCellLabels = finCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');

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
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）构成${names.zh}，鳍格 ${finCellLabels} 均在第 ${finBox + 1} 宫；可从该宫内的覆盖${baseAxis === 'row' ? '列' : '行'}格消去 ${d}。`,
          en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} form a ${names.en} with fin at ${finCellLabels} (all in box ${finBox + 1}); eliminate ${d} from cover ${baseAxis === 'row' ? 'column' : 'row'}s within the fin box.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FISH_NAMES[size]!,
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
