/**
 * Mutant Fish (T4, exotic) — 变异鱼.
 *
 * A Mutant fish generalises Franken fish by allowing BOTH sides (D and S)
 * to mix rows, cols and boxes. Size N ≥ 3 (size-2 mutant X-Wing collapses to
 * Locked Candidates).
 *
 * Per the research card (`04-fish/franken-mutant.md`), a Mutant fish has
 * |D| = |S| = N and either side contains a *mixture* of houses that's not a
 * Franken layout. Most mutant patterns are size-3 (swordfish) with each side
 * mixing rows+cols+boxes.
 *
 * Detection:
 *   1. D = N houses drawn from rows+cols+boxes (must NOT be all-rows or all-cols).
 *   2. S = N houses drawn from rows+cols+boxes (similar constraint).
 *   3. The pair (D, S) is Mutant iff:
 *      - D mixes lines+boxes OR mixes rows+cols (not all one orientation),
 *        AND/OR S does the same.
 *   4. We require the basic fish constraint: every base candidate must lie in
 *      a cover house (cover-covered), with possibly a few endo-/exo-fins.
 *   5. Endo-fin: a base candidate lying in two D-houses.
 *   6. Exo-fin: a base candidate in no cover house.
 *
 * For tractability we restrict to the most common mutant shape: D contains
 * one row + one col + one box (size 3); S contains one row + one col + one box
 * (size 3). Other shapes are rare.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface HouseSet {
  readonly members: readonly number[];
  readonly cells: readonly number[];
}

function houseSetOf(houseIndices: readonly number[]): HouseSet {
  const cells: number[] = [];
  for (const h of houseIndices) cells.push(...HOUSES_BY_INDEX(h));
  return { members: houseIndices, cells };
}

function HOUSES_BY_INDEX(i: number): readonly number[] {
  if (i < 9) return ROWS[i]!;
  if (i < 18) return COLS[i - 9]!;
  return BOXES[i - 18]!;
}

function isRow(i: number): boolean { return i < 9; }
function isCol(i: number): boolean { return i >= 9 && i < 18; }
function isBox(i: number): boolean { return i >= 18; }

/**
 * Search for a Mutant fish of size N=3 with both sides mixing rows/cols/boxes.
 * For each base-side (rows + cols + boxes) and cover-side configuration:
 *   - base must contain at least one of each kind (or mix lines+boxes).
 *   - cover must contain at least one of each kind (or mix lines+boxes).
 *   - basic fish coverage: base candidates fit into cover houses (with maybe
 *     a fin or two).
 */
function tryMutantFish(grid: Grid, digit: number): Step | null {
  const bit = maskOf(digit);
  const rows = Array.from({ length: 9 }, (_, i) => i);
  const cols = Array.from({ length: 9 }, (_, i) => i + 9);
  const boxes = Array.from({ length: 9 }, (_, i) => i + 18);

  // Mutant size-3 shape: base = one row + one col + one box; cover = the same.
  // For tractability we enumerate a smaller subset: base = {row, col, box};
  // cover = {row, col, box}.
  for (const r of rows) {
    for (const c of cols) {
      for (const b of boxes) {
        const base = [r, c, b];
        // Cover must also mix (rows+cols+boxes).
        for (const r2 of rows) {
          for (const c2 of cols) {
            for (const b2 of boxes) {
              // Skip "pure" configurations (handled by other strategies).
              if (r2 === r && c2 === c) continue;
              const cover = [r2, c2, b2];
              const step = tryMutantConfig(grid, digit, base, cover, bit);
              if (step) return step;
            }
          }
        }
      }
    }
  }
  return null;
}

function tryMutantConfig(
  grid: Grid,
  digit: number,
  baseMembers: readonly number[],
  coverMembers: readonly number[],
  bit: number,
): Step | null {
  // Both sides must be Mutant: each side must contain at least 2 different
  // house kinds.
  const baseKinds = new Set(baseMembers.map((h) =>
    isRow(h) ? 'row' : isCol(h) ? 'col' : 'box',
  ));
  if (baseKinds.size < 2) return null;
  const coverKinds = new Set(coverMembers.map((h) =>
    isRow(h) ? 'row' : isCol(h) ? 'col' : 'box',
  ));
  if (coverKinds.size < 2) return null;

  const baseSet = houseSetOf(baseMembers);
  const coverSet = houseSetOf(coverMembers);

  // Collect base candidate cells: cells in base houses that hold digit.
  const baseAll: number[] = [];
  for (const c of baseSet.cells) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) baseAll.push(c);
  }
  if (baseAll.length < 3) return null;

  // Each base house must contribute at least one candidate.
  for (const h of baseMembers) {
    let count = 0;
    for (const c of HOUSES_BY_INDEX(h)) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) count++;
    }
    if (count < 1) return null;
  }

  // Cover-covered: cells of baseAll that lie in any cover house.
  const coverCellsSet = new Set(coverSet.cells);
  const baseCoverCovered: number[] = [];
  const baseFins: number[] = [];
  for (const c of baseAll) {
    if (coverCellsSet.has(c)) baseCoverCovered.push(c);
    else baseFins.push(c);
  }
  // Fins must be in one box.
  if (baseFins.length > 0) {
    const finBoxes = new Set(baseFins.map((c) => BOX_OF[c]!));
    if (finBoxes.size !== 1) return null;
  }

  // Each cover house must receive at least one cover-covered cell.
  for (const h of coverMembers) {
    let count = 0;
    for (const c of HOUSES_BY_INDEX(h)) {
      if (baseCoverCovered.includes(c)) count++;
    }
    if (count < 1) return null;
  }

  // Targets: surplus cover candidates (cells in S but NOT in D, holding d).
  // Plus cannibalism: base cells in two cover houses.
  const baseSetCells = new Set(baseSet.cells);
  const targets: number[] = [];
  for (const c of coverSet.cells) {
    if (grid.get(c) !== 0) continue;
    if ((grid.candidatesOf(c) & bit) === 0) continue;
    if (baseSetCells.has(c)) {
      let inTwo = 0;
      for (const h of coverMembers) if (HOUSES_BY_INDEX(h).includes(c)) inTwo++;
      if (inTwo >= 2) targets.push(c);
    } else {
      targets.push(c);
    }
  }
  if (targets.length === 0) return null;

  // Apply fin-visibility filter.
  let visibleTargets = targets;
  if (baseFins.length > 0) {
    const finBox = BOX_OF[baseFins[0]!]!;
    visibleTargets = targets.filter((c) => {
      if (BOX_OF[c] === finBox) return true;
      if (baseFins.length === 1) {
        const f = baseFins[0]!;
        if (ROW_OF[c] === ROW_OF[f] || COL_OF[c] === COL_OF[f]) return true;
      }
      return false;
    });
  }
  if (visibleTargets.length === 0) return null;

  const elims: { cell: number; digit: number }[] = [];
  for (const c of visibleTargets) if (grid.hasCandidate(c, digit)) elims.push({ cell: c, digit });
  if (elims.length === 0) return null;

  const baseLabels = baseMembers.map((h) => isRow(h) ? `R${h + 1}` : isCol(h) ? `C${h - 8}` : `B${h - 17}`).join(',');
  const coverLabels = coverMembers.map((h) => isRow(h) ? `R${h + 1}` : isCol(h) ? `C${h - 8}` : `B${h - 17}`).join(',');
  const finLabels = baseFins.length === 0 ? '无鳍' : baseFins.map(cellLabel).join(',');

  return {
    strategyId: 'mutant-fish',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set([...baseAll, ...elims.map((e) => e.cell)])],
      candidates: [...baseAll.map((c) => ({ cell: c, digit })), ...elims],
      links: [],
    },
    explanation: {
      zh: `变异鱼（Mutant Fish，N=${baseMembers.length}）：基础集 ${baseLabels}，覆盖集 ${coverLabels}，鳍 ${finLabels}；消去覆盖集中的冗余 ${digit}。`,
      en: `Mutant Fish (N=${baseMembers.length}): base ${baseLabels}, cover ${coverLabels}, fins ${finLabels}; eliminate ${digit} from surplus cover cells.`,
    },
  };
}

function tryFish(grid: Grid, digit: number): Step | null {
  return tryMutantFish(grid, digit);
}

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1085,
  tieBreak: ['digit', 'house'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryFish(grid, d);
      if (step) return step;
    }
    return null;
  },
};

// Suppress unused.
void CELLS;
void BOXES;