/**
 * Finned & Sashimi Fish (X-Wing / Swordfish / Jellyfish) — 鳍鱼与寿司鱼.
 *
 * A finned fish is a basic fish that *almost* holds, spoiled by a few extra
 * candidates ("the fin") confined to ONE box on a base line. The reduction rule:
 * every basic-fish elimination target that ALSO sees every fin cell is valid.
 *
 *   - Non-sashimi (Finned): the basic fish is complete; the fin is in one box
 *     on a base row/col, and targets in that box (cover cells in the box that
 *     are not in the base lines) get cleared.
 *   - Sashimi: the basic fish's corner inside the fin's box is missing (a
 *     clue or non-candidate). The "odd corner" — the present corner of the
 *     same X-Wing in the same box, in the SAME cover col — pins down which
 *     col the eliminations are in. Targets = cover cells in the fin box AND
 *     in the missing-corner col.
 *
 * This is a controlled extension of `basic-fish.ts`: same base/cover model,
 * extra "fin" candidate bookkeeping, restricted elimination set. The basic
 * fish remains the canonical owner of the un-finned case; this module only
 * adds a fresh detector for size 2/3/4 with a fin.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '鳍 X 翼', en: 'Finned X-Wing' },
  3: { zh: '鳍 剑鱼', en: 'Finned Swordfish' },
  4: { zh: '鳍 水母', en: 'Finned Jellyfish' },
};

const SASHIMI_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '寿司 X 翼', en: 'Sashimi X-Wing' },
  3: { zh: '寿司 剑鱼', en: 'Sashimi Swordfish' },
  4: { zh: '寿司 水母', en: 'Sashimi Jellyfish' },
};

interface FinInstance {
  digit: number;
  baseAxis: 'row' | 'col';
  size: number;
  baseIndices: number[];
  coverIndices: number[];
  /** Cells of the basic fish core (intersection of base × cover, present corners only). */
  core: number[];
  /** All corners in the base×cover grid, including missing ones. */
  allCorners: number[];
  /** All extras in base rows/cols outside the cover, grouped by box. */
  finsByBox: Map<number, number[]>;
  /** True if the basic fish is degenerate (a corner in the fin's box is missing). */
  sashimi: boolean;
  /** Sashimi only: the cover col with the missing corner (also the "odd corner" col). */
  sashimiCoverCol?: number;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FINNED_FISH_NAMES[size]!,
    difficulty,
    tieBreak: ['digit', 'house'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step1 = tryFinnedFish(grid, d, size, 'row', id);
        if (step1) return step1;
        const step2 = tryFinnedFish(grid, d, size, 'col', id);
        if (step2) return step2;
      }
      return null;
    },
  };
}

function tryFinnedFish(
  grid: Grid,
  d: number,
  size: 2 | 3 | 4,
  baseAxis: 'row' | 'col',
  strategyId: string,
): Step | null {
  const bit = maskOf(d);
  const baseHouses = baseAxis === 'row' ? ROWS : COLS;
  const coverHouses = baseAxis === 'row' ? COLS : ROWS;

  // Per base house, collect candidates of d (cells + their cover-axis index + their box).
  type Cand = { cell: number; coverIdx: number; box: number };
  const perBase: Cand[][] = Array.from({ length: 9 }, () => []);
  for (let bi = 0; bi < 9; bi++) {
    for (const cell of baseHouses[bi]!) {
      if (grid.get(cell) !== 0) continue;
      if ((grid.candidatesOf(cell) & bit) === 0) continue;
      const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      perBase[bi]!.push({ cell, coverIdx, box: BOX_OF[cell]! });
    }
  }

  // Enumerate all size-subsets of eligible base houses.
  // A base house is eligible if it has at least 1 d-candidate.
  const eligible: number[] = [];
  for (let bi = 0; bi < 9; bi++) {
    if (perBase[bi]!.length === 0) continue;
    eligible.push(bi);
  }

  const collected: FinInstance[] = [];
  for (const combo of combineIndices(eligible.length, size)) {
    const baseIndices = combo.map((i) => eligible[i]!);
    // For each base row, find its cover-set (the set of cover indices it has candidates at).
    const baseCoverSets = baseIndices.map((bi) => new Set(perBase[bi]!.map((c) => c.coverIdx)));
    // The intersection of these cover-sets is the "shared" cover (basic X-Wing cover).
    let sharedCover: Set<number> = new Set(baseCoverSets[0]!);
    for (let i = 1; i < baseCoverSets.length; i++) {
      sharedCover = new Set([...sharedCover].filter((ci) => baseCoverSets[i]!.has(ci)));
    }
    // We also allow "almost shared" cover (sashimi): a base row may have 0 candidates
    // in a particular cover col, but the OTHER base rows have it. To detect sashimi, we
    // expand the cover to include cover indices that are missing in only one base row.
    // For now, the cover = sharedCover + at most `size` cover indices that are in the
    // union of all base rows' cover sets.
    const unionCover = new Set<number>();
    for (const s of baseCoverSets) for (const ci of s) unionCover.add(ci);

    // Try every subset of `size` cover indices from the union, then check if the basic
    // fish "almost" holds (3+ corners present, fins in one box, sashimi case detected).
    const unionArr = [...unionCover];
    for (const coverCombo of combineIndices(unionArr.length, size)) {
      const coverIndices = coverCombo.map((i) => unionArr[i]!);
      // For this cover set, find:
      //  - core: cells at (base row, cover col) intersections that are d-candidates
      //  - fins: extras outside the cover, grouped by box
      //  - all corners: the 9 (or size*size) intersection cells, whether present or not
      const core: number[] = [];
      const allCorners: number[] = [];
      const finByBox = new Map<number, number[]>();
      let allFinBoxes = new Set<number>();
      for (const bi of baseIndices) {
        const cands = perBase[bi]!;
        const coverSetLocal = new Set(coverIndices);
        const coverCands = cands.filter((c) => coverSetLocal.has(c.coverIdx));
        const extraCands = cands.filter((c) => !coverSetLocal.has(c.coverIdx));
        for (const coverCi of coverIndices) {
          const cornerCell = baseAxis === 'row' ? bi * 9 + coverCi : coverCi * 9 + bi;
          allCorners.push(cornerCell);
          if (grid.hasCandidate(cornerCell, d)) core.push(cornerCell);
        }
        for (const c of coverCands) {
          if (!core.includes(c.cell)) core.push(c.cell);
        }
        for (const c of extraCands) {
          if (!finByBox.has(c.box)) finByBox.set(c.box, []);
          finByBox.get(c.box)!.push(c.cell);
          allFinBoxes.add(c.box);
        }
      }

      if (finByBox.size === 0) continue; // basic fish — owned by x-wing/swordfish/jellyfish
      if (core.length === 0) continue; // fully degenerate

      // Sudopedia / SudokuWiki rule: the target cell must see every fin cell. If the
      // fins span multiple boxes, no target can satisfy this (boxes are exclusive).
      // The canonical case is "all fins in one box"; multi-box fins are not a valid
      // finned fish. We accept them only when all fins lie in one box.
      if (finByBox.size > 1) continue;

      // For the (single) fin box, check sashimi: a corner in this box is missing AND another
      // base row's corner in the SAME cover col is present (the "odd corner").
      // For the X-Cycle reading: the elimination is in the same cover col.
      const finBox = [...finByBox.keys()][0]!;
      let isSashimi = false;
      let sashimiCoverCol: number | null = null;
      for (const bi of baseIndices) {
        for (const coverCi of coverIndices) {
          const cornerCell = baseAxis === 'row' ? bi * 9 + coverCi : coverCi * 9 + bi;
          if (BOX_OF[cornerCell] !== finBox) continue;
          if (!grid.hasCandidate(cornerCell, d)) {
            // This corner is missing. Check the OTHER base rows' corner in the SAME cover col.
            let oddCornerFound = false;
            for (const otherBi of baseIndices) {
              if (otherBi === bi) continue;
              const oddCell = baseAxis === 'row' ? otherBi * 9 + coverCi : coverCi * 9 + otherBi;
              if (grid.hasCandidate(oddCell, d)) {
                oddCornerFound = true;
                break;
              }
            }
            if (oddCornerFound) {
              isSashimi = true;
              sashimiCoverCol = coverCi;
            }
          }
        }
      }

      collected.push({
        digit: d,
        baseAxis,
        size,
        baseIndices,
        coverIndices,
        core,
        allCorners,
        finsByBox: finByBox,
        sashimi: isSashimi,
        sashimiCoverCol: sashimiCoverCol ?? undefined,
      });
    }
  }

  // Tie-break: prefer non-sashimi, then digit, then base axis, then smallest base,
  // then smallest cover, then smallest fin cell.
  collected.sort((a, b) => {
    if (a.sashimi !== b.sashimi) return a.sashimi ? 1 : -1;
    if (a.baseAxis !== b.baseAxis) return a.baseAxis === 'row' ? -1 : 1;
    const ab = Math.min(...a.baseIndices);
    const bb = Math.min(...b.baseIndices);
    if (ab !== bb) return ab - bb;
    const ac = Math.min(...a.coverIndices);
    const bc = Math.min(...b.coverIndices);
    if (ac !== bc) return ac - bc;
    const af = Math.min(...[...a.finsByBox.values()].flat());
    const bf = Math.min(...[...b.finsByBox.values()].flat());
    return af - bf;
  });

  for (const inst of collected) {
    const step = buildFinnedFishStep(grid, inst, strategyId);
    if (step) return step;
  }
  return null;
}

function buildFinnedFishStep(grid: Grid, inst: FinInstance, strategyId: string): Step | null {
  const { digit, baseAxis, size, baseIndices, coverIndices, core, finsByBox, sashimi, sashimiCoverCol } = inst;
  const bit = maskOf(digit);
  const baseSet = new Set(baseIndices);
  const coverHouses = baseAxis === 'row' ? COLS : ROWS;

  // Single fin box (multi-box fins rejected earlier per the "see all fins" rule).
  if (finsByBox.size !== 1) return null;
  const finBox = [...finsByBox.keys()][0]!;
  const finCells = finsByBox.get(finBox)!;

  const eliminations: { cell: number; digit: number }[] = [];
  const cellsInBox: number[] = [];
  for (const ci of coverIndices) {
    for (const cell of coverHouses[ci]!) {
      if (BOX_OF[cell] !== finBox) continue;
      const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
      if (baseSet.has(bi)) continue; // skip base corners
      if (finCells.includes(cell)) continue; // skip fin cells themselves
      if (grid.get(cell) !== 0) continue;
      if ((grid.candidatesOf(cell) & bit) === 0) continue;
      // Per the Sudopedia rule: the target must see ALL fin cells (in this single box).
      if (!finCells.every((f) => f === cell || sharesAnyHouse(f, cell))) continue;
      cellsInBox.push(cell);
    }
  }
  if (sashimi && sashimiCoverCol !== undefined) {
    // Sashimi: only eliminate in the same cover col as the missing corner.
    for (const cell of cellsInBox) {
      const ci = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      if (ci === sashimiCoverCol) eliminations.push({ cell, digit });
    }
  } else {
    for (const cell of cellsInBox) {
      eliminations.push({ cell, digit });
    }
  }

  if (eliminations.length === 0) return null;

  const sizeLabel = size;
  const finalName: { zh: string; en: string } = sashimi
    ? (SASHIMI_NAMES[sizeLabel] ?? FINNED_FISH_NAMES[sizeLabel] ?? { zh: 'Finned Fish', en: 'Finned Fish' })
    : (FINNED_FISH_NAMES[sizeLabel] ?? SASHIMI_NAMES[sizeLabel] ?? { zh: 'Finned Fish', en: 'Finned Fish' });
  const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
  const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
  const coverAxisLabel = baseAxis === 'row' ? '列' : '行';
  const baseNums = baseIndices.map((i) => i + 1).join(', ');
  const coverNums = coverIndices.map((i) => i + 1).join(', ');
  const finCellsFlat = [...finsByBox.values()].flat();
  const finLabels = finCellsFlat.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
  const finLabelsEn = finCellsFlat.map((c) => `r${ROW_OF[c]! + 1}c${COL_OF[c]! + 1}`).join(', ');
  const finBoxLabel = finBox + 1;

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: [
        ...new Set([
          ...core,
          ...finCellsFlat,
          ...eliminations.map((e) => e.cell),
        ]),
      ],
      candidates: [
        ...core.map((c) => ({ cell: c, digit })),
        ...finCellsFlat.map((c) => ({ cell: c, digit })),
        ...eliminations,
      ],
      links: [],
    },
    explanation: sashimi
      ? {
          zh: `数字 ${digit}：${finalName.zh}（缺角寿司）。基础行/列为第 ${baseNums} ${baseAxisLabel}，鳍在第 ${finBoxLabel} 宫（${finLabels}），覆盖${coverAxisLabel} ${coverNums}；缺角位于鳍宫，沿同列方向消去鳍宫内的 ${digit}。`,
          en: `Digit ${digit}: ${finalName.en}. Base ${baseAxisLabelEn}s ${baseNums}, fin in box ${finBoxLabel} (${finLabelsEn}), covers ${coverAxisLabel}s ${coverNums}; sashimi corner missing in fin box, eliminate ${digit} from cells in the fin box on the same ${coverAxisLabel} as the missing corner.`,
        }
      : {
          zh: `数字 ${digit}：${finalName.zh}。基础行/列为第 ${baseNums} ${baseAxisLabel}，鳍在第 ${finBoxLabel} 宫（${finLabels}），覆盖${coverAxisLabel} ${coverNums}；消去鳍宫内覆盖${coverAxisLabel}上但不在基础${baseAxisLabel}的格子中的 ${digit}。`,
          en: `Digit ${digit}: ${finalName.en}. Base ${baseAxisLabelEn}s ${baseNums}, fin in box ${finBoxLabel} (${finLabelsEn}), covers ${coverAxisLabel}s ${coverNums}; eliminate ${digit} from cover-${coverAxisLabel} cells in the fin box that are not on a base ${baseAxisLabelEn}.`,
        },
  };
}

function sharesAnyHouse(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/** Generate all size-k combinations from [0..n-1] as ascending index lists. */
function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = size - 1;
    while (i >= 0 && idx[i]! === n - size + i) i--;
    if (i < 0) return;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

export const finnedXWing: Strategy = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish: Strategy = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish: Strategy = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);
