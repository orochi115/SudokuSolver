/**
 * Finned / Sashimi Fish (P0) — 鳍鱼 / 寿司鱼
 *
 * Extension of basic fish: for one digit d, choose N base houses whose candidates
 * almost fit in N cover houses, except for a non-empty "fin" confined to a single
 * box. Any candidate of d in a cover house but outside the base houses, and which
 * sees every fin cell, can be eliminated.
 *
 * Sashimi is the degenerate case where at least one base house would contribute
 * no candidate to the reduced fish body (its candidates are all fin cells).
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string; id: string; difficulty: number }> = {
  2: { zh: '鳍 / 寿司 X-Wing', en: 'Finned / Sashimi X-Wing', id: 'finned-x-wing', difficulty: 415 },
  3: { zh: '鳍 / 寿司剑鱼', en: 'Finned / Sashimi Swordfish', id: 'finned-swordfish', difficulty: 455 },
  4: { zh: '鳍 / 寿司水母', en: 'Finned / Sashimi Jellyfish', id: 'finned-jellyfish', difficulty: 495 },
};

/** Generate all size-k combinations from [0..n-1] in lexicographic order. */
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

function cellSeesAll(cell: number, targets: readonly number[]): boolean {
  const peers = new Set(PEERS_OF[cell]!);
  for (const t of targets) {
    if (t === cell) return false;
    if (!peers.has(t)) return false;
  }
  return true;
}

function tryFinnedFish(
  grid: Grid,
  d: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
  size: number,
): Step | null {
  const bit = maskOf(d);

  // For each base house, collect cover-axis indices where d is a candidate.
  const baseCandidates: { baseIdx: number; coverIdx: number; cell: number }[] = [];
  for (let bi = 0; bi < 9; bi++) {
    for (const cell of baseHouses[bi]!) {
      if (grid.get(cell) !== 0 && grid.get(cell) !== d) continue;
      if ((grid.candidatesOf(cell) & bit) === 0) continue;
      const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      baseCandidates.push({ baseIdx: bi, coverIdx: ci, cell });
    }
  }

  const baseSet = new Set(baseCandidates.map((c) => c.baseIdx));
  if (baseSet.size < size) return null;

  for (const baseCombo of combineIndices(9, size)) {
    // Every base house in the combo must have at least one candidate.
    if (baseCombo.some((bi) => !baseCandidates.some((c) => c.baseIdx === bi))) continue;

    for (const coverCombo of combineIndices(9, size)) {
      const coverSet = new Set(coverCombo);

      const body: { baseIdx: number; coverIdx: number; cell: number }[] = [];
      const fin: { baseIdx: number; coverIdx: number; cell: number }[] = [];
      for (const c of baseCandidates) {
        if (!coverSet.has(c.coverIdx)) {
          fin.push(c);
        } else {
          body.push(c);
        }
      }

      // Only keep candidates from chosen base houses.
      const chosenBase = new Set(baseCombo);
      const bodyInBase = body.filter((c) => chosenBase.has(c.baseIdx));
      const finInBase = fin.filter((c) => chosenBase.has(c.baseIdx));
      if (finInBase.length === 0) continue; // no fin -> basic fish, handled elsewhere

      // Fin must be confined to one box.
      const finBoxes = new Set(finInBase.map((c) => BOX_OF[c.cell]!));
      if (finBoxes.size !== 1) continue;
      const finBox = [...finBoxes][0]!;

      // Each chosen cover column/row must receive at least one body candidate
      // (otherwise it is not a genuine reduced fish body).
      let coverHasBody = true;
      for (const ci of coverCombo) {
        if (!bodyInBase.some((c) => c.coverIdx === ci)) {
          coverHasBody = false;
          break;
        }
      }
      if (!coverHasBody) continue;

      const finCells = finInBase.map((c) => c.cell);

      // Targets: cells in cover houses, not in any chosen base house, candidate d,
      // and see every fin cell.
      const eliminations: { cell: number; digit: number }[] = [];
      for (const ci of coverCombo) {
        for (const cell of coverHouses[ci]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (chosenBase.has(bi)) continue;
          if (!cellSeesAll(cell, finCells)) continue;
          eliminations.push({ cell, digit: d });
        }
      }

      if (eliminations.length === 0) continue;

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseCombo.map((i) => i + 1).join(', ');
      const coverNums = coverCombo.map((i) => i + 1).join(', ');
      const isSashimi = baseCombo.some((bi) => !bodyInBase.some((c) => c.baseIdx === bi));
      const variantZh = isSashimi ? '寿司' : '鳍';
      const variantEn = isSashimi ? 'Sashimi' : 'Finned';

      return {
        strategyId: names.id,
        placements: [],
        eliminations,
        highlights: {
          cells: [
            ...new Set([
              ...bodyInBase.map((c) => c.cell),
              ...finCells,
              ...eliminations.map((e) => e.cell),
            ]),
          ],
          candidates: [
            ...bodyInBase.map((c) => ({ cell: c.cell, digit: d })),
            ...finCells.map((c) => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${d} 在第 ${baseNums} ${baseAxisLabel} 构成${variantZh}${names.zh}（覆盖${baseAxis === 'row' ? '列' : '行'} ${coverNums}），鳍格位于第 ${finBox + 1} 宫；从能看到全部鳍格的覆盖${baseAxis === 'row' ? '列' : '行'}格中消去 ${d}。`,
          en: `Digit ${d} in ${baseAxisLabelEn}s ${baseNums} forms a ${variantEn} ${names.en} (cover ${baseAxis === 'row' ? 'columns' : 'rows'} ${coverNums}), fin in box ${finBox + 1}; eliminate ${d} from cover ${baseAxis === 'row' ? 'column' : 'row'} cells that see every fin cell.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4): Strategy {
  const meta = FISH_NAMES[size]!;
  return {
    id: meta.id,
    name: { zh: meta.zh, en: meta.en },
    difficulty: meta.difficulty,
    tieBreak: ['digit', 'house'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size);
        if (step) return step;
        const step2 = tryFinnedFish(grid, d, COLS, ROWS, 'col', size);
        if (step2) return step2;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFishStrategy(2);
export const finnedSwordfish = makeFinnedFishStrategy(3);
export const finnedJellyfish = makeFinnedFishStrategy(4);
