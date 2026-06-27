/**
 * Finned & Sashimi Fish — 鳍鱼与寿司鱼
 *
 * Extension of basic fish (X-Wing / Swordfish / Jellyfish) that handles a small
 * "fin" of extra candidate cells in a single box outside the cover set.
 *
 * For digit d, base orientation, size N (2..4):
 *   1. Take an N-line base set B whose d-candidates *almost* line up on N
 *      cover lines C — there is a non-empty "fin" of extra base candidates
 *      that all lie in a single box outside C.
 *   2. Without the fin, B/C would form a valid basic fish.
 *   3. Eliminate d from any cell that the basic fish would clear AND that
 *      also sees every fin cell. Because all fins sit in one box, the
 *      surviving targets lie in that box on the cover lines.
 *
 * Sashimi = same shape with the underlying fish corner missing (the box that
 * holds the fin does not contribute a fish candidate). The elimination rule
 * is identical; the engine reports them under the same `finned-*` ids.
 */

import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

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

function candidateCellsInHouse(
  grid: Grid,
  house: readonly number[],
  digit: number,
): number[] {
  const bit = maskOf(digit);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

function visibleFromAll(cells: readonly number[], candidates: readonly number[]): number[] {
  // candidates outside the fin-set that share at least one house with every fin cell.
  // All fin cells share a single box ⇒ a candidate "sees" the whole fin iff it
  // shares that box (a cell can only see a cell via box/row/col, and the fin
  // sits in one box so any non-row/col-of-fin-cell inside the box qualifies).
  // We accept row/col shortcuts when the fin is a single cell (the engine's
  // convention: a single-cell fin is visible via its row/col too).
  if (cells.length === 0) return [...candidates];
  const boxes = new Set<number>();
  const rows = new Set<number>();
  const cols = new Set<number>();
  for (const fc of cells) {
    boxes.add(BOX_OF[fc]!);
    rows.add(ROW_OF[fc]!);
    cols.add(COL_OF[fc]!);
  }
  return candidates.filter((c) => {
    if (cells.includes(c)) return false;
    if (boxes.has(BOX_OF[c]!)) return true;
    // Single-cell fin: same row or column also counts as "seeing the fin".
    if (cells.length === 1) {
      const f = cells[0]!;
      if (ROW_OF[c] === ROW_OF[f] || COL_OF[c] === COL_OF[f]) return true;
    }
    return false;
  });
}

interface FinnedFishArgs {
  grid: Grid;
  digit: number;
  baseHouses: readonly (readonly number[])[];
  coverHouses: readonly (readonly number[])[];
  baseAxis: 'row' | 'col';
  size: number;
  strategyId: string;
}

function tryFinnedFish(args: FinnedFishArgs): Step | null {
  const { grid, digit, baseHouses, coverHouses, baseAxis, size, strategyId } = args;
  const bit = maskOf(digit);

  // For each base house collect cover-axis indices where d is a candidate.
  // We need >= 2 candidates per base line; for size-2 the structure can also
  // be 2..size (basic fish restricts to <=size but for sashimi we must allow
  // up to size+1 to permit a fin to break containment).
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

  if (eligibleBases.length < size) return null;

  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map((i) => eligibleBases[i]!);

    // All base candidate cells (including duplicates across cover cols)
    const baseAllCells: number[] = [];
    for (const bi of baseIndices) {
      const house = baseHouses[bi]!;
      for (const c of house) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) baseAllCells.push(c);
      }
    }

    // Find a cover set C of size `size` such that base cells outside C are all
    // in one box and that box is unique.
    const usedCoverIdxs = new Set<number>();
    for (const ci of baseAllCells) {
      const idx = baseAxis === 'row' ? COL_OF[ci]! : ROW_OF[ci]!;
      usedCoverIdxs.add(idx);
    }

    // We need to try each size-N subset of used cover indices that has at
    // least one base candidate outside it (i.e. we are forced to leave some
    // base candidates out of the cover). Skip subsets where ALL base cells
    // fit inside — that is a plain basic fish, handled by base fish detectors.
    const candidateCoverList = [...usedCoverIdxs];
    if (candidateCoverList.length < size) continue;

    for (const coverCombo of combineIndices(candidateCoverList.length, size)) {
      const coverUnion = new Set<number>();
      for (const i of coverCombo) coverUnion.add(candidateCoverList[i]!);
      const coverArr = [...coverUnion].sort((a, b) => a - b);

      // Compute the fin: base candidate cells whose cover index is NOT in coverArr.
      const fin: number[] = [];
      const baseInsideCover: number[] = [];
      for (const c of baseAllCells) {
        const idx = baseAxis === 'row' ? COL_OF[c]! : ROW_OF[c]!;
        if (coverUnion.has(idx)) baseInsideCover.push(c);
        else fin.push(c);
      }

      if (fin.length === 0) continue; // plain fish, not a finned one
      if (new Set(fin.map((c) => BOX_OF[c]!)).size !== 1) continue; // fin must sit in one box

      const finBox = BOX_OF[fin[0]!]!;

      // Reduced fish: every base line must contribute at least one cell inside C
      // (sashimi allows one base line to have only the fin's box-mate inside C,
      // i.e. only the box contribution counts; we accept any base line that has
      // ≥1 cell inside C).
      const baseCoveredOk = baseIndices.every((bi) => {
        const house = baseHouses[bi]!;
        return house.some((c) => {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            const idx = baseAxis === 'row' ? COL_OF[c]! : ROW_OF[c]!;
            return coverUnion.has(idx);
          }
          return false;
        });
      });
      if (!baseCoveredOk) continue;

      // For sashimi: require that ignoring the fin, each cover col/row still
      // gets a contribution from base lines (the box-fin constraint already
      // guarantees a base line crosses the box, so we just need at least one
      // base line contributing each cover line — which holds because fin is
      // contained in the box and base lines pass through the box).
      // (No additional sashimi check needed beyond the "all base lines still
      // covered" rule above.)

      // Targets: cover cells of coverArr NOT in any base line, holding d.
      const baseSet = new Set(baseIndices);
      const targets: number[] = [];
      for (const ci of coverArr) {
        const coverHouse = coverHouses[ci]!;
        for (const cell of coverHouse) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue;
          targets.push(cell);
        }
      }

      // Apply fin-visibility filter.
      const visibleTargets = visibleFromAll(fin, targets);
      if (visibleTargets.length === 0) continue;

      const eliminations = visibleTargets
        .filter((c) => grid.hasCandidate(c, digit))
        .map((cell) => ({ cell, digit }));

      if (eliminations.length === 0) continue;

      const names = FISH_NAMES[size]!;
      const baseAxisLabel = baseAxis === 'row' ? '行' : '列';
      const baseAxisLabelEn = baseAxis === 'row' ? 'row' : 'column';
      const baseNums = baseIndices.map((i) => i + 1).join(', ');
      const coverNums = coverArr.map((i) => i + 1).join(', ');
      const finBoxNum = finBox + 1;
      const finList = fin.map(cellLabel).join(',');

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...baseAllCells, ...eliminations.map((e) => e.cell)])],
          candidates: [
            ...baseAllCells.map((c) => ({ cell: c, digit })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${digit} 在第 ${baseNums} ${baseAxisLabel}（基础集）几乎覆盖 ${size} 个${baseAxis === 'row' ? '列' : '行'}（${coverNums}号），构成${names.zh}；第 ${finBoxNum} 宫中多出的候选数 ${finList} 为鳍；只消去能同时看到全部鳍且属于覆盖${baseAxis === 'row' ? '列' : '行'}的格中的 ${digit}（鳍${names.zh}）。`,
          en: `Digit ${digit}'s candidates in ${baseAxisLabelEn}s ${baseNums} (base) almost fit in ${size} cover ${baseAxis === 'row' ? 'column' : 'row'}s (${coverNums}); the extras ${finList} in box ${finBoxNum} are the fin; eliminate ${digit} from cover ${baseAxis === 'row' ? 'column' : 'row'} cells that see every fin cell (Finned ${names.en}).`,
        },
      };
    }
  }

  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: { zh: `${FISH_NAMES[size]!.zh}（鳍）`, en: `Finned ${FISH_NAMES[size]!.en}` },
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const rowStep = tryFinnedFish({ grid, digit: d, baseHouses: ROWS, coverHouses: COLS, baseAxis: 'row', size, strategyId: id });
        if (rowStep) return rowStep;
        const colStep = tryFinnedFish({ grid, digit: d, baseHouses: COLS, coverHouses: ROWS, baseAxis: 'col', size, strategyId: id });
        if (colStep) return colStep;
      }
      return null;
    },
  };
}

// Suppress unused warnings for unused imports we may need later.
void BOXES;
void popcount;

export const finnedXWing: Strategy = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish: Strategy = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish: Strategy = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);