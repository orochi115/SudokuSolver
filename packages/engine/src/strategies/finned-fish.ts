/**
 * Finned Fish (P1) — 带鳍鱼 (Finned X-Wing / Swordfish / Jellyfish)
 *
 * Extension of basic fish: the base set includes "fin" cells (extra candidates
 * for the digit that don't fit the cover set). Eliminations are limited to cells
 * that see ALL fin cells in addition to being in the cover set outside the base.
 *
 * A finned fish for digit d, base size N:
 *   - Choose N base houses (rows or cols). The candidates of d in these N houses
 *     occupy a set of cover-axis positions. If |positions| > N, we select N of
 *     them as the "cover set"; the remaining base cells are "fins".
 *   - A cover cell for d (outside the base houses) can be eliminated IF it sees
 *     all fin cells. (If it misses any fin, the fin could be the true one.)
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '带鳍X翼', en: 'Finned X-Wing' },
  3: { zh: '带鳍剑鱼', en: 'Finned Swordfish' },
  4: { zh: '带鳍水母', en: 'Finned Jellyfish' },
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

function isPeer(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
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

  const baseCandidates: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const cells: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) cells.push(cell);
    }
    baseCandidates.push(cells);
  }

  const eligibleBases = baseCandidates
    .map((cs, i) => (cs.length >= 1 && cs.length <= size + 2 ? i : -1))
    .filter((i) => i >= 0);

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const baseSet = new Set(baseIndices);

    const allBaseCells: number[] = [];
    for (const bi of baseIndices) allBaseCells.push(...baseCandidates[bi]!);

    const coverPosSet = new Set<number>();
    for (const cell of allBaseCells) {
      coverPosSet.add(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!);
    }
    const coverPosArr = [...coverPosSet];

    if (coverPosArr.length <= size) continue;
    if (coverPosArr.length > size + 2) continue;

    for (const coverCombo of combineIndices(coverPosArr.length, size)) {
      const coverSet = new Set(coverCombo.map((i) => coverPosArr[i]!));

      const finCells: number[] = [];
      const coverCells: number[] = [];

      for (const cell of allBaseCells) {
        const pos = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverSet.has(pos)) coverCells.push(cell);
        else finCells.push(cell);
      }

      if (finCells.length === 0) continue;
      if (finCells.length > 3) continue;

      // Sashimi: a base house whose only non-fin cells are in coverSet but has < 2 such cells.
      // Check that each base house has at least 1 cover cell (non-sashimi) or handle sashimi.
      // For soundness, sashimi works the same way: the fin replaces the missing cover position.

      const eliminations: { cell: number; digit: number }[] = [];

      for (const ci of coverSet) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue;

          let seesAll = true;
          for (const fin of finCells) {
            if (!isPeer(cell, fin)) { seesAll = false; break; }
          }

          if (seesAll) eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');

      const allCells = [...new Set([...coverCells, ...finCells, ...eliminations.map((e) => e.cell)])];

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: allCells,
          candidates: [
            ...coverCells.map((c) => ({ cell: c, digit: d })),
            ...finCells.map((c) => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: finCells.map((f) => ({
            from: { cell: f, digit: d },
            to: { cell: eliminations[0]!.cell, digit: d },
            type: 'weak' as const,
          })),
        },
        explanation: {
          zh: `带鳍${names.zh}：数字 ${d} 在第 ${baseNums} ${baseAxisLabel}（基础集）的候选覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}）外加 ${finCells.length} 个鳍格；可从覆盖${baseAxis === 'row' ? '列' : '行'}中看到所有鳍格的非基础格消去 ${d}。`,
          en: `${names.en}: digit ${d}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) occupy ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}) plus ${finCells.length} fin cell(s); eliminate ${d} from cover ${baseAxis === 'row' ? 'column' : 'row'} cells outside the base that see all fins.`,
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
