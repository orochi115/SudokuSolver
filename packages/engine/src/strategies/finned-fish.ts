/**
 * Finned & Sashimi Fish (P0) — 鳍鱼与寿司鱼
 *
 * Three finned-fish strategies that share a single detector and are named by
 * base size (X-Wing=2, Swordfish=3, Jellyfish=4). The same detector fires
 * whether the fin is "finned" (the fish's corner in the fin's box still holds
 * the digit) or "sashimi" (the corner is missing); only the geometry changes.
 *
 * Pattern (see `research/sudoku-human-solving/local-library/techniques/04-fish/finned-sashimi.md`):
 *   - For digit d, base set B = N houses (rows or cols), cover set C = N
 *     orthogonal houses.
 *   - Per base line b ∈ B, write pos_b = {cover indices where d is a
 *     candidate}. The ideal fish would have |⋃ pos_b| = N, i.e. exactly N
 *     cover columns.
 *   - Here that equality is *spoiled*: there are more base candidates than N
 *     cover indices, AND the *extras* (cells not in any chosen cover) all sit
 *     in a single box (the "fin").
 *   - If we strip the fin, the remaining base candidates span exactly N
 *     covers, so the reduced fish holds.
 *   - A target cell is a base-fish elimination (cover cell not in any base
 *     line) that ALSO sees every fin cell; only those are eliminated.
 *
 * The instance is emitted under id `finned-x-wing` (size 2),
 * `finned-swordfish` (size 3) or `finned-jellyfish` (size 4). Sashimi cases
 * share the same id (Sashimi is geometry, not a separate technique).
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SIZE_NAMES: Record<number, { zh: string; en: string; id: string; difficulty: number }> = {
  2: { zh: '鳍 X 翼', en: 'Finned X-Wing', id: 'finned-x-wing', difficulty: 415 },
  3: { zh: '鳍剑鱼', en: 'Finned Swordfish', id: 'finned-swordfish', difficulty: 455 },
  4: { zh: '鳍水母', en: 'Finned Jellyfish', id: 'finned-jellyfish', difficulty: 495 },
};

/** Generate all k-combinations of indices from [0..n-1]. */
function* combineIndices(n: number, k: number): Generator<number[]> {
  if (n < k) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function tryFinnedFish(grid: Grid, digit: number, size: 2 | 3 | 4, strategyId: string): Step | null {
  // Try both orientations: base = rows, cover = cols AND base = cols, cover = rows.
  return tryFinnedFishOrientation(grid, digit, size, 'row', strategyId)
    ?? tryFinnedFishOrientation(grid, digit, size, 'col', strategyId);
}

function tryFinnedFishOrientation(
  grid: Grid,
  digit: number,
  size: 2 | 3 | 4,
  baseAxis: 'row' | 'col',
  strategyId: string,
): Step | null {
  const bit = maskOf(digit);
  const baseHouses: readonly (readonly number[])[] = baseAxis === 'row' ? ROWS : COLS;
  const coverHouses: readonly (readonly number[])[] = baseAxis === 'row' ? COLS : ROWS;

  // Per base house, collect (cover-index, cell) pairs where digit d is a candidate.
  type CoverCell = { coverIdx: number; cell: number };
  const perBase: CoverCell[][] = baseHouses.map((house) => {
    const out: CoverCell[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        out.push({ coverIdx, cell });
      }
    }
    return out;
  });

  // A base house is "eligible" if it has >= 1 d-candidate. (Basic fish
  // requires >= 2 to keep the line non-degenerate; finned-fish relaxes this
  // because Sashimi patterns may have a base line with a single
  // cover-resident candidate whose missing corner has been filled/eliminated
  // elsewhere, leaving only the box-mate in the cover.)
  const eligibleBases: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (perBase[i]!.length >= 1) eligibleBases.push(i);
  }
  if (eligibleBases.length < size) return null;

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    // Union of cover indices covered by the chosen base houses.
    const allCoverPairs: CoverCell[] = [];
    for (const bi of baseIndices) for (const pair of perBase[bi]!) allCoverPairs.push(pair);

    // For every subset of size-N cover indices, check if the cells NOT in
    // that subset (the "fin") all sit in a single box.
    const allCoverIdxs = [...new Set(allCoverPairs.map((p) => p.coverIdx))];
    if (allCoverIdxs.length < size) continue;
    if (allCoverIdxs.length > 8) {
      // 9 or more cover positions means the reduced fish can't form; but we
      // can only have up to 8 unique cover indices (9 houses total), so this
      // branch only fires for the impossible case.
      continue;
    }

    for (const coverCombo of combineIndices(allCoverIdxs.length, size)) {
      const coverSet = new Set(coverCombo.map((i) => allCoverIdxs[i]!));

      // Compute the "fin": base candidates whose cover is NOT in coverSet.
      const fin: CoverCell[] = allCoverPairs.filter((p) => !coverSet.has(p.coverIdx));
      if (fin.length === 0) continue; // plain basic fish — not a finned-fish

      // All fin cells must lie in a single box.
      const finBoxes = new Set(fin.map((p) => BOX_OF[p.cell]!));
      if (finBoxes.size !== 1) continue;
      const finBox = [...finBoxes][0]!;

      // Sashimi-vs-finned classification is recorded in the explanation but
      // not used to gate; both cases use the same id and elimination rule.

      // Reduced fish: base candidates inside coverSet.
      const reducedCells = allCoverPairs.filter((p) => coverSet.has(p.coverIdx));
      // Validate reduced fish: each base line contributes >=1 cell.
      const reducedByBase = new Map<number, number>();
      for (const bi of baseIndices) reducedByBase.set(bi, 0);
      for (const p of reducedCells) {
        const bi = baseAxis === 'row' ? ROW_OF[p.cell]! : COL_OF[p.cell]!;
        reducedByBase.set(bi, (reducedByBase.get(bi) ?? 0) + 1);
      }
      // Every base must still contribute at least 1 reduced cell.
      let allBasesContribute = true;
      for (const bi of baseIndices) {
        if ((reducedByBase.get(bi) ?? 0) === 0) { allBasesContribute = false; break; }
      }
      if (!allBasesContribute) continue;
      // Reduced cover must be exactly `size` covers (it is by construction)
      // and reduced base cells must be in those covers only.

      // Compute the basic-fish elimination set T0: cover cells NOT in any
      // base line, carrying d.
      const baseSet = new Set(baseIndices);
      const reducedCellSet = new Set(reducedCells.map((p) => p.cell));
      const t0: number[] = [];
      for (const ci of coverSet) {
        for (const cell of coverHouses[ci]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue; // base cell — not a target
          if (reducedCellSet.has(cell)) continue; // safety
          t0.push(cell);
        }
      }
      if (t0.length === 0) continue;

      // Apply the "sees every fin cell" filter. A target must share a house
      // (row/col/box) with every fin cell. Because all fin cells live in
      // finBox, this filter is equivalent to: target cell shares finBox with
      // every fin cell. A target that lives in finBox automatically shares
      // the box with all fin cells.
      const finCellSet = new Set(fin.map((p) => p.cell));
      const targetElims: number[] = [];
      for (const t of t0) {
        if (BOX_OF[t] !== finBox) continue; // not in fin's box
        if (finCellSet.has(t)) continue; // a fin cell itself
        targetElims.push(t);
      }
      if (targetElims.length === 0) continue;

      // Fin cells that happen to be base candidates of the reduced fish
      // (i.e. also in coverSet) act as the "split" cells of the sashimi case
      // — we still eliminate the same target set.
      const finBaseLine = baseAxis === 'row' ? ROW_OF[fin[0]!.cell]! : COL_OF[fin[0]!.cell]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const coverAxisLabel = baseAxis === 'row' ? '列' : '行';
      const coverAxisLabelEn = baseAxis === 'row' ? 'column' : 'row';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finLabels = fin.map((f) => `R${ROW_OF[f.cell]! + 1}C${COL_OF[f.cell]! + 1}`).join(',');
      const elimLabels = targetElims
        .map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`)
        .join(',');

      return {
        strategyId,
        placements: [],
        eliminations: targetElims.map((cell) => ({ cell, digit })),
        highlights: {
          cells: [
            ...new Set([
              ...allCoverPairs.map((p) => p.cell),
              ...targetElims,
            ]),
          ],
          candidates: [
            ...allCoverPairs.map((p) => ({ cell: p.cell, digit })),
            ...targetElims.map((cell) => ({ cell, digit })),
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${digit}：鳍鱼（${SIZE_NAMES[size]!.zh}）。第 ${baseNums} ${baseAxisLabel}（基础集）的候选数原本应覆盖 ${size} 个${coverAxisLabel}（${coverNums}号）；但基础行 R${finBaseLine + 1} 在宫 B${finBox + 1} 中多出鳍候选数（${finLabels}），故仅在能看到全部鳍的格子（即宫 B${finBox + 1} 中位于覆盖${coverAxisLabel}的格 ${elimLabels}）消去 ${digit}。`,
          en: `Digit ${digit}: Finned ${SIZE_NAMES[size]!.en}. The ${baseAxisLabelEn}s ${baseNums} (base) almost cover ${size} ${coverAxisLabelEn}s (${coverNums}), but base ${baseAxisLabelEn} R${finBaseLine + 1} in box B${finBox + 1} has extra fin cells (${finLabels}); eliminate ${digit} only from the fish targets that share box B${finBox + 1} with the fins (${elimLabels}).`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategyReal(size: 2 | 3 | 4): Strategy {
  const meta = SIZE_NAMES[size]!;
  return {
    id: meta.id,
    name: { zh: meta.zh, en: meta.en },
    difficulty: meta.difficulty,
    tieBreak: ['digit', 'cell-index'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step = tryFinnedFish(grid, d, size, meta.id);
        if (step) return step;
      }
      return null;
    },
  };
}

export const finnedXWing: Strategy = makeFinnedFishStrategyReal(2);
export const finnedSwordfish: Strategy = makeFinnedFishStrategyReal(3);
export const finnedJellyfish: Strategy = makeFinnedFishStrategyReal(4);
