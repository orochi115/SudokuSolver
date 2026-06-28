/**
 * Franken Fish (T4, exotic) — 弗兰肯鱼.
 *
 * A Franken fish generalises basic / finned fish by allowing **boxes** to
 * enter exactly one of the constraint sets (the base or the cover) while
 * keeping the other set pure (rows-only or cols-only). Size N ≥ 3 (size-2
 * Franken X-Wing degenerates to Locked Candidates).
 *
 * Per the research card (`04-fish/franken-mutant.md`):
 *   D = N rows, S = N cols+boxes  (or D = N cols, S = N rows+boxes;
 *                                  or D = N rows+boxes, S = N cols;
 *                                  or D = N cols+boxes, S = N rows)
 *   i.e. one side pure-line, the other side pure-line + boxes.
 *
 * Detection:
 *   1. Enumerate defining sets D of N houses drawn from {rows, cols, boxes}.
 *   2. The OTHER set S is also N houses, with the "Franken" property:
 *      exactly one of (D, S) is pure (rows only or cols only) and the other
 *      contains both lines of the *same* orientation AND boxes.
 *   3. Collect base candidates d in D; every cell of d in D must lie in S
 *      ("cover-covered") OR be an endo-fin (cell in two D houses).
 *   4. Cover-covered cells form a balanced injection into S: each D-line has
 *      ≥1 cover-covered cell, and the union of cover indices is ≤ |S|.
 *      (For Franken: the box-house in S contains cells from multiple D lines
 *      that all hit the box; the cover count is N.)
 *   5. Surplus candidates in S-but-not-D are eliminable. With an endo-fin /
 *      exo-fin (cells in D but not S, sitting in one box), eliminations only
 *      target cells seeing all fins.
 *
 * For soundness, we require |cover| = |S| (perfect matching) and that every
 * base line contributes at least one cover-covered cell (no degenerate base).
 *
 * Cannibalism: a base cell that lies in TWO S-houses is itself eliminable.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface HouseSet {
  /** House indices into HOUSES (rows: 0..8, cols: 9..17, boxes: 18..26). */
  readonly members: readonly number[];
  /** Cell union. */
  readonly cells: readonly number[];
}

function houseSetOf(houseIndices: readonly number[]): HouseSet {
  const cells: number[] = [];
  for (const h of houseIndices) {
    const hh = HOUSES_BY_INDEX(h);
    for (const c of hh) cells.push(c);
  }
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

/** Enumerate size-k subsets of {0..8}, {9..17}, {18..26}. */
function* combinationsFrom(arr: readonly number[], k: number): Generator<number[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const c of combinationsFrom(rest, k - 1)) yield [first!, ...c];
  yield* combinationsFrom(rest, k);
}

/**
 * Search a Franken fish for one digit `d`. Returns eliminations on success.
 * `baseMembers` = N houses of one orientation (rows OR cols), and
 * `coverMembers` = N houses containing the orthogonal orientation + boxes
 * (or vice versa). At least one side must contain a box (else this is plain
 * / finned basic fish and is handled elsewhere).
 *
 * To keep the search tractable we cap cover-side box count at 1 (most Franken
 * patterns use a single box as cover house; multi-box Franken is rare).
 */
function tryFrankenFish(
  grid: Grid,
  digit: number,
  baseMembers: readonly number[],
  coverMembers: readonly number[],
): Step | null {
  const bit = maskOf(digit);

  // Base houses must be PURE (one orientation): all rows or all cols.
  if (!(baseMembers.every(isRow) || baseMembers.every(isCol))) return null;

  // Cover houses must contain boxes + the orthogonal lines.
  const coverRows = coverMembers.filter(isRow);
  const coverCols = coverMembers.filter(isCol);
  const coverBoxes = coverMembers.filter(isBox);
  if (coverBoxes.length === 0) return null; // not Franken
  if (coverBoxes.length > 1) return null; // cap

  // Exactly one side must be "Franken" (mixed). Cover side must contain
  // both lines (cols or rows) PLUS at least one box.
  const baseIsRows = baseMembers.every(isRow);
  if (baseIsRows) {
    // Cover must include cols (not rows) AND a box.
    if (coverRows.length !== 0) return null;
    if (coverCols.length === 0) return null;
    if (coverCols.length + coverBoxes.length !== baseMembers.length) return null;
  } else {
    if (coverCols.length !== 0) return null;
    if (coverRows.length === 0) return null;
    if (coverRows.length + coverBoxes.length !== baseMembers.length) return null;
  }

  const baseSet = houseSetOf(baseMembers);
  const coverSet = houseSetOf(coverMembers);

  // For each base house, collect candidate cells (must be 2+ candidates per
  // base line — degenerate bases with 0 or 1 candidates are skipped).
  const baseCellsPerHouse: number[][] = [];
  for (const h of baseMembers) {
    const house = HOUSES_BY_INDEX(h);
    const cs: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) cs.push(c);
    }
    if (cs.length < 2) return null;
    baseCellsPerHouse.push(cs);
  }

  // Build the set of "cover-covered" base candidates: cells in D that lie in
  // any cover house. The rest are fins (endo or exo).
  const coverHouseCells = new Set(coverSet.cells);
  const baseCoverCovered: number[] = [];
  const baseFins: number[] = [];
  for (const cs of baseCellsPerHouse) {
    for (const c of cs) {
      if (coverHouseCells.has(c)) baseCoverCovered.push(c);
      else baseFins.push(c);
    }
  }

  // Fins must sit in a single box (exo-fin constraint).
  if (baseFins.length > 0) {
    const finBoxes = new Set(baseFins.map((c) => BOX_OF[c]!));
    if (finBoxes.size !== 1) return null;
  }

  // Perfect matching: every cover house gets ≥1 cover-covered cell from base.
  // (For Franken with one box as cover, the box-house naturally aggregates
  // base cells from all base lines that pass through the box.)
  const coverCoveredCount = new Map<number, number>();
  for (const c of baseCoverCovered) {
    // Walk the cover houses and count this cell's contribution.
    for (const h of coverMembers) {
      if (HOUSES_BY_INDEX(h).includes(c)) {
        coverCoveredCount.set(h, (coverCoveredCount.get(h) ?? 0) + 1);
      }
    }
  }
  // Each cover house must receive ≥1 cover-covered cell.
  for (const h of coverMembers) {
    if ((coverCoveredCount.get(h) ?? 0) < 1) return null;
  }

  // Targets: surplus cover candidates (cells in S but NOT in D, holding d).
  // Plus cannibalism: base cells that lie in TWO cover houses.
  const baseCellSet = new Set(baseSet.cells);
  const targets: number[] = [];
  for (const c of coverSet.cells) {
    if (grid.get(c) !== 0) continue;
    if ((grid.candidatesOf(c) & bit) === 0) continue;
    if (baseCellSet.has(c)) {
      // Check cannibalism: c in two cover houses?
      let inTwo = 0;
      for (const h of coverMembers) if (HOUSES_BY_INDEX(h).includes(c)) inTwo++;
      if (inTwo >= 2) targets.push(c); // cannibalistic elimination
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
      // Single-cell fin: also visible via row/col.
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

  const baseAll = baseCoverCovered.concat(baseFins);
  const baseAxisLabel = baseIsRows ? '行' : '列';
  const coverAxisLabel = baseIsRows ? '列' : '行';
  const baseLabels = baseMembers.map((h) => isRow(h) ? `R${h + 1}` : `C${h - 8}`).join(', ');
  const coverLabels = coverMembers.map((h) => isRow(h) ? `R${h + 1}` : isCol(h) ? `C${h - 8}` : `B${h - 17}`).join(', ');
  const finLabels = baseFins.length === 0 ? '无鳍' : baseFins.map(cellLabel).join(',');

  return {
    strategyId: 'franken-fish',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set([...baseAll, ...elims.map((e) => e.cell)])],
      candidates: [...baseAll.map((c) => ({ cell: c, digit })), ...elims],
      links: [],
    },
    explanation: {
      zh: `弗兰肯鱼（Franken Fish，N=${baseMembers.length}）：基础集 ${baseAxisLabel} ${baseLabels}，覆盖集 ${coverAxisLabel}/宫 ${coverLabels}，鳍 ${finLabels}；消去覆盖集中的冗余 ${digit}。`,
      en: `Franken Fish (N=${baseMembers.length}): base ${baseAxisLabel} ${baseLabels}, cover ${coverAxisLabel}/boxes ${coverLabels}, fins ${finLabels}; eliminate ${digit} from surplus cover cells.`,
    },
  };
}

/**
 * Enumerate all size-N Franken configurations for one digit and return the
 * first one with eliminations.
 */
function findFrankenFishForDigit(grid: Grid, digit: number, size: 3 | 4): Step | null {
  const rows = Array.from({ length: 9 }, (_, i) => i);
  const cols = Array.from({ length: 9 }, (_, i) => i + 9);
  const boxes = Array.from({ length: 9 }, (_, i) => i + 18);

  // Franken patterns (size N):
  //  - base = N rows, cover = (size - coverBoxCount) cols + coverBoxCount boxes (1 box)
  //  - base = N cols, cover = (size - coverBoxCount) rows + coverBoxCount boxes
  for (const baseRows of combinationsFrom(rows, size)) {
    for (const coverBox of combinationsFrom(boxes, 1)) {
      const numCols = size - 1;
      for (const coverColsCombo of combinationsFrom(cols, numCols)) {
        const cover = [...coverColsCombo, ...coverBox];
        const step = tryFrankenFish(grid, digit, baseRows, cover);
        if (step) return step;
      }
    }
  }
  for (const baseColsCombo of combinationsFrom(cols, size)) {
    for (const coverBox of combinationsFrom(boxes, 1)) {
      const numRows = size - 1;
      for (const coverRowsCombo of combinationsFrom(rows, numRows)) {
        const cover = [...coverRowsCombo, ...coverBox];
        const step = tryFrankenFish(grid, digit, baseColsCombo, cover);
        if (step) return step;
      }
    }
  }
  return null;
}

function tryFish(grid: Grid, digit: number): Step | null {
  for (const size of [3, 4] as const) {
    const step = findFrankenFishForDigit(grid, digit, size);
    if (step) return step;
  }
  return null;
}

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '弗兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
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
void popcount;
void digitsOf;
void CELLS;
void BOXES;