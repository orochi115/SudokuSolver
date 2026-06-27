/**
 * Finned / Sashimi Fish (P0) — 鳍鱼 / 寿司鱼
 *
 * Extension of basic fish: a near-fish spoiled by extra candidates ("fins")
 * all confined to a single box. Eliminate d from cover-line cells that lie
 * in the fin box (i.e., see every fin).
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

function cellsWithDigitInHouse(grid: Grid, house: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
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

  // per base house: list of cover indices that hold d
  const coverSets: number[][] = [];
  for (let i = 0; i < 9; i++) {
    const house = baseHouses[i]!;
    const covers: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        covers.push(ci);
      }
    }
    coverSets.push(covers);
  }

  const eligible: number[] = [];
  for (let i = 0; i < 9; i++) if (coverSets[i]!.length >= 1) eligible.push(i);

  for (const baseCombo of combineIndices(eligible.length, size)) {
    const baseIndices = baseCombo.map((k) => eligible[k]!);
    // union of cover indices from these bases
    const coverUnion = new Set<number>();
    for (const bi of baseIndices) {
      for (const ci of coverSets[bi]!) coverUnion.add(ci);
    }
    if (coverUnion.size > size) continue;

    // Compute all base candidates in the chosen bases
    const baseCells: number[] = [];
    const finCells: number[] = [];
    for (const bi of baseIndices) {
      const house = baseHouses[bi]!;
      for (const cell of house) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          baseCells.push(cell);
          const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          if (!coverUnion.has(ci)) finCells.push(cell);
        }
      }
    }

    // Fins must be non-empty for finned; if empty this would be plain fish (handled elsewhere)
    if (finCells.length === 0) continue;

    // All fins must be in ONE box
    const finBoxSet = new Set(finCells.map((c) => BOX_OF[c]!));
    if (finBoxSet.size !== 1) continue;
    const finBox = [...finBoxSet][0]!;

    // Compute reduced cover set: covers that would be used by plain fish
    // (the union of size cover houses that the non-fin base cands would fit)
    // For elims we use the current coverUnion as the "cover lines" that the reduced pattern claims.
    // Plain fish elim targets: cover houses in union, outside the base lines, carrying d.
    const baseSet = new Set(baseIndices);
    const plainTargets: number[] = [];
    for (const ci of coverUnion) {
      const ch = coverHouses[ci]!;
      for (const cell of ch) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
        if (!baseSet.has(bi)) plainTargets.push(cell);
      }
    }

    if (plainTargets.length === 0) continue;

    // Only keep targets that see ALL fins (share house with every fin)
    const eliminations: { cell: number; digit: number }[] = [];
    for (const t of plainTargets) {
      let seesAll = true;
      for (const f of finCells) {
        // shares row/col/box with f
        if (ROW_OF[t] !== ROW_OF[f] && COL_OF[t] !== COL_OF[f] && BOX_OF[t] !== BOX_OF[f]) {
          seesAll = false;
          break;
        }
      }
      if (seesAll && grid.hasCandidate(t, d)) eliminations.push({ cell: t, digit: d });
    }

    if (eliminations.length === 0) continue;

    const names = FISH_NAMES[size]!;
    const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
    const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
    const baseNums = baseIndices.map((i) => i + 1).join(', ');
    const coverNums = [...coverUnion].sort((a, b) => a - b).map((i) => i + 1).join(', ');
    const finLabel = `B${finBox + 1}`;

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...baseCells, ...finCells, ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...baseCells.map((c) => ({ cell: c, digit: d })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d} 构成${names.zh}（基础集第 ${baseNums} ${baseAxisLabel}，覆盖 ${coverNums}；鳍在${finLabel}）；仅消去同时看见全部鳍的覆盖格中的 ${d}。`,
        en: `${names.en} for digit ${d} (bases ${baseNums} ${baseAxisLabelEn}s, covers ${coverNums}); eliminate ${d} only from cover cells that see all fins in ${finLabel}.`,
      },
    };
  }
  return null;
}

function makeFinnedFish(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FISH_NAMES[size]!,
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        let step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size, id);
        if (step) return step;
        step = tryFinnedFish(grid, d, COLS, ROWS, 'col', size, id);
        if (step) return step;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFish(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFish(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFish(4, 'finned-jellyfish', 495);
