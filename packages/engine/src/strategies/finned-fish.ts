/**
 * Finned / Sashimi Fish (T3 extension) — 鳍鱼与寿司鱼
 *
 * Extends the basic fish base/cover model: when extra base candidates (the fin)
 * lie outside the cover set but all in one box, eliminations apply to cover cells
 * that would be cleared by the reduced fish AND see every fin cell.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { combineIndices } from './fish-utils.js';

const FISH_NAMES: Record<number, { zh: string; en: string; id: string }> = {
  2: { zh: '鳍 X 翼', en: 'Finned X-Wing', id: 'finned-x-wing' },
  3: { zh: '鳍剑鱼', en: 'Finned Swordfish', id: 'finned-swordfish' },
  4: { zh: '鳍水母', en: 'Finned Jellyfish', id: 'finned-jellyfish' },
};

function seesAllFins(cell: number, finCells: readonly number[]): boolean {
  return finCells.every((fin) => fin === cell || PEERS_OF[cell]!.includes(fin));
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

  interface CandEntry {
    cell: number;
    baseIdx: number;
    coverIdx: number;
  }

  const byBase = new Map<number, CandEntry[]>();
  for (let bi = 0; bi < 9; bi++) {
    const entries: CandEntry[] = [];
    for (const cell of baseHouses[bi]!) {
      if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
      const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      entries.push({ cell, baseIdx: bi, coverIdx });
    }
    if (entries.length > 0) byBase.set(bi, entries);
  }

  const eligibleBases = [...byBase.keys()];
  if (eligibleBases.length < size) return null;

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);
    const baseSet = new Set(baseIndices);
    const allCands: CandEntry[] = [];
    for (const bi of baseIndices) allCands.push(...byBase.get(bi)!);

    for (const coverCombo of combineIndices(9, size)) {
      const coverSet = new Set(coverCombo);
      const fins = allCands.filter((c) => !coverSet.has(c.coverIdx));
      if (fins.length === 0) continue;

      const finBoxes = new Set(fins.map((f) => BOX_OF[f.cell]!));
      if (finBoxes.size !== 1) continue;

      let reducedValid = true;
      for (const bi of baseIndices) {
        const inCover = allCands.filter((c) => c.baseIdx === bi && coverSet.has(c.coverIdx));
        if (inCover.length === 0) {
          reducedValid = false;
          break;
        }
      }
      if (!reducedValid) continue;

      const finCells = fins.map((f) => f.cell);
      const eliminations: { cell: number; digit: number }[] = [];
      const baseCells: number[] = [];
      const sashimi = fins.some((f) => {
        const inCoverOnLine = allCands.filter((c) => c.baseIdx === f.baseIdx && coverSet.has(c.coverIdx));
        return inCoverOnLine.length === 0;
      });

      for (const ci of coverSet) {
        for (const cell of coverHouses[ci]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) {
            baseCells.push(cell);
            continue;
          }
          if (seesAllFins(cell, finCells)) eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = [...coverSet].sort((a, b) => a - b).map((i) => i + 1).join(', ');
      const finLabel = finCells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
      const kindZh = sashimi ? '寿司' : '鳍';
      const kindEn = sashimi ? 'Sashimi' : 'Finned';

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
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel}构成${kindZh}${names.zh}（鳍格 ${finLabel}，覆盖${baseAxis === 'row' ? '列' : '行'} ${coverNums}）；可见全部鳍格的覆盖格可消去 ${d}。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} forms a ${kindEn} ${names.en} (fin at ${finLabel}, cover ${baseAxis === 'row' ? 'column' : 'row'}s ${coverNums}); eliminate ${d} from cover cells seeing all fin cells.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, difficulty: number): Strategy {
  const meta = FISH_NAMES[size]!;
  return {
    id: meta.id,
    name: { zh: meta.zh, en: meta.en },
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size, this.id);
        if (step) return step;
        const step2 = tryFinnedFish(grid, d, COLS, ROWS, 'col', size, this.id);
        if (step2) return step2;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFishStrategy(2, 415);
export const finnedSwordfish = makeFinnedFishStrategy(3, 455);
export const finnedJellyfish = makeFinnedFishStrategy(4, 495);