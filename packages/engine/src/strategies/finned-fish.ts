/**
 * Finned & Sashimi Fish (T3/T4) — 鳍鱼与寿司鱼
 *
 * A finned fish is a basic fish that almost holds, except some extra candidates
 * ("the fin") exist outside the cover set, all confined to ONE box.
 * We can still eliminate d from any cell that:
 *   1. Would be eliminated by the plain fish (cover cell not in a base line), AND
 *   2. Sees every fin cell (i.e. shares the fin's box AND lies on a cover line).
 *
 * Sashimi = a finned fish where the fin's box lacks the underlying fish corner
 * (the "corner" candidate was already absent). The elimination is still valid
 * by the same "fin OR fish" disjunction argument.
 *
 * Sizes: 2 → Finned/Sashimi X-Wing (difficulty 415)
 *        3 → Finned/Sashimi Swordfish (difficulty 455)
 *        4 → Finned/Sashimi Jellyfish (difficulty 495)
 */

import { ROWS, COLS, BOX_OF, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍X翼/寿司X翼', en: 'Finned/Sashimi X-Wing' },
  3: { zh: '鳍剑鱼/寿司剑鱼', en: 'Finned/Sashimi Swordfish' },
  4: { zh: '鳍水母/寿司水母', en: 'Finned/Sashimi Jellyfish' },
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

/**
 * Try finned/sashimi fish using the given base and cover orientations.
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

  // For each base house, collect cells that have d as a candidate
  const baseCandsByHouse: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const cands: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        cands.push(cell);
      }
    }
    baseCandsByHouse.push(cands);
  }

  // Eligible base lines: those with 2..size+? candidates (we allow bigger for finned)
  // Actually we need lines with at least 1 candidate but not more than size (for basic fish)
  // For finned fish, we try N base lines where the union of cover indices = N,
  // but some candidates are outside the cover (the fins)
  const eligibleBases = baseCandsByHouse
    .map((cands, i) => (cands.length >= 1 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    // Collect all base candidates
    const allBaseCands: number[] = [];
    for (const bi of baseIndices) {
      for (const c of baseCandsByHouse[bi]!) allBaseCands.push(c);
    }

    // Map each candidate to its cover-axis index
    const coverIdxOf = (cell: number): number =>
      baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;

    // Candidates that fit within N cover lines (no fin) vs. candidates outside
    // We try all possible sets of N cover lines such that the "leftover" (fin) candidates
    // all lie in a single box
    const allCoverIdxSet = new Set(allBaseCands.map(coverIdxOf));
    const allCoverIdxArr = [...allCoverIdxSet];

    if (allCoverIdxArr.length < size) continue; // degenerate: fewer cover positions than base lines

    // Try all N-element subsets of the cover positions that actually appear
    for (const coverCombo of combineIndices(allCoverIdxArr.length, size)) {
      const coverSet = new Set(coverCombo.map((i) => allCoverIdxArr[i]!));

      // Split base candidates into "inside cover" and "outside cover" (fin)
      const insideCover: number[] = [];
      const finCands: number[] = []; // outside the cover set

      for (const c of allBaseCands) {
        if (coverSet.has(coverIdxOf(c))) {
          insideCover.push(c);
        } else {
          finCands.push(c);
        }
      }

      // Must have at least one fin cell (else it's a plain fish, handled elsewhere)
      if (finCands.length === 0) continue;

      // All fin cells must lie in a single box
      const finBoxSet = new Set(finCands.map((c) => BOX_OF[c]!));
      if (finBoxSet.size !== 1) continue;
      const finBox = finCands[0]! !== undefined ? BOX_OF[finCands[0]!]! : -1;
      if (finBox === -1) continue;

      // Verify each base line contributes at least one candidate inside the cover
      // (i.e., no base line is entirely in the fin set after choosing this cover)
      let allBasesContribute = true;
      for (const bi of baseIndices) {
        const lineCandsInsideCover = baseCandsByHouse[bi]!.filter((c) => coverSet.has(coverIdxOf(c)));
        if (lineCandsInsideCover.length === 0) {
          allBasesContribute = false;
          break;
        }
      }
      if (!allBasesContribute) continue;

      // Now find eliminations: cover cells NOT in any base line, carrying d,
      // AND in the fin box (because they must see all fin cells)
      const baseIndexSet = new Set(baseIndices);
      const eliminations: { cell: number; digit: number }[] = [];

      for (const ci of coverSet) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          // Check: not in a base line
          const thisCellBaseIdx = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseIndexSet.has(thisCellBaseIdx)) continue;
          // Must be in the fin box (sees all fin cells)
          if (BOX_OF[cell] !== finBox) continue;
          // Must not be a fin cell itself
          if (finCands.includes(cell)) continue;
          eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FINNED_FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const coverAxisLabelEn = baseAxis === 'row' ? 'column' : 'row';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finDesc = finCands.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
      const isSashimi = insideCover.some(
        (c) => BOX_OF[c] === finBox && baseCandsByHouse[baseAxis === 'row' ? ROW_OF[c]! : COL_OF[c]!]!
          .filter((cc) => coverSet.has(coverIdxOf(cc))).length === 0,
      );
      const typeLabel = isSashimi ? '寿司' : '鳍';
      const typeLabelEn = isSashimi ? 'Sashimi' : 'Finned';

      const highlightCells = [...new Set([...allBaseCands, ...finCands, ...eliminations.map((e) => e.cell)])];

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: highlightCells,
          candidates: [
            ...allBaseCands.map((c) => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}号），鳍格（${finDesc}）均在第 B${finBox + 1} 宫；构成${typeLabel}${names.zh}，可从该宫内覆盖${baseAxis === 'row' ? '列' : '行'}的格消去 ${d}。`,
          en: `Digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) cover ${size} ${coverAxisLabelEn}s (${coverNums}); fin cells (${finDesc}) confined to box B${finBox + 1}; ${typeLabelEn} ${names.en} — eliminate ${d} from cover cells inside the fin box.`,
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
