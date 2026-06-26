/**
 * Finned / Sashimi Fish (P0) — 鳍鱼与寿司鱼
 *
 * Extends the basic fish (X-Wing / Swordfish / Jellyfish) base/cover model to
 * allow a "fin": extra candidates of the digit in one box that break the pure
 * N-base/N-cover containment. Eliminate only from cover cells that see every
 * fin cell (i.e. within the fin's box).
 *
 * Sashimi is the case where the fin's box lacks a genuine fish corner — the
 * "reduced fish" would be degenerate. The elimination rule is identical.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
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

  const eligibleBases = coverSets
    .map((cs, i) => (cs.length >= 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const coverUnion = new Set<number>();
    const baseCoverCells: Array<{ cell: number; coverIdx: number }> = [];
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) {
        coverUnion.add(ci);
      }
      for (const cell of baseHouses[bi]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          baseCoverCells.push({ cell, coverIdx });
        }
      }
    }

    if (coverUnion.size === size) {
      // Pure basic fish — skip, handled by x-wing/swordfish/jellyfish
      continue;
    }
    if (coverUnion.size < size) continue;

    // Excess: base candidates not covered by the cover union
    const finCells: number[] = [];
    const finBoxes = new Set<number>();
    for (const bcc of baseCoverCells) {
      if (!coverUnion.has(bcc.coverIdx)) {
        finCells.push(bcc.cell);
        finBoxes.add(BOX_OF[bcc.cell]!);
      }
    }
    if (finCells.length === 0) continue;
    if (finBoxes.size !== 1) continue;

    const finBox = [...finBoxes][0]!;
    const finCellSet = new Set(finCells);

    // Verify that removing fin cells makes a valid fish
    const reducedCoverUnion = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) {
        reducedCoverUnion.add(ci);
      }
    }
    if (reducedCoverUnion.size !== size && reducedCoverUnion.size !== size - 1) continue;

    // Elimination: cover cells that see ALL fin cells
    const eliminations: { cell: number; digit: number }[] = [];
    const baseSet = new Set(baseIndices);

    for (const ci of coverUnion) {
      const coverHouse = coverHouses[ci]!;
      for (const cell of coverHouse) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (baseSet.has(bi)) continue;
        const box = BOX_OF[cell]!;
        if (box !== finBox) continue;
        const seesAllFin = finCells.every((fc) => {
          if (fc === cell) return false;
          return ROW_OF[fc] === ROW_OF[cell] || COL_OF[fc] === COL_OF[cell] || BOX_OF[fc] === BOX_OF[cell];
        });
        if (!seesAllFin) continue;
        eliminations.push({ cell, digit: d });
      }
    }

    if (eliminations.length === 0) continue;

    const names = FISH_NAMES[size]!;
    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = [...coverUnion].sort((a, b) => a - b).map((i) => i + 1).join(', ');
    const isSashimi = !baseCoverCells.some((bcc) => !finCellSet.has(bcc.cell) && BOX_OF[bcc.cell] === finBox);

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...finCells, ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...finCells.map((c) => ({ cell: c, digit: d })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d}：${isSashimi ? '寿司' : '鳍'}${names.zh}。基础${baseAxisLabel} ${baseNums} 中候选数超出 ${coverNums} 号${baseAxis === 'row' ? '列' : '行'}的额外格均在 B${finBox + 1} 宫（鳍）；消去该宫中覆盖${baseAxis === 'row' ? '列' : '行'}上的 ${d}。`,
        en: `Digit ${d}: ${isSashimi ? 'Sashimi ' : ''}${names.en}. Extra candidates in base ${baseAxisLabelEn}s ${baseNums} beyond cover ${baseAxis === 'row' ? 'column' : 'row'}s ${coverNums} all lie in box ${finBox + 1} (fin); eliminate ${d} from cover cells inside that box.`,
      },
    };
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