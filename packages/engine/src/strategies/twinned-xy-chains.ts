/**
 * Twinned XY-Chains (T4, chains-aic) — 孪生 XY 链.
 *
 * Per the research card (Nils Leder / Andrew Stuart, SudokuWiki), the
 * canonical pattern is a six-cell formation (3×2 or 2×3 in two parallel lines
 * sharing three columns) where:
 *   - the six cells hold candidates from a 6-digit set {d1, …, d6};
 *   - for every value d, all cells of the formation that can hold d mutually
 *     see each other (so d can appear at most once);
 *   - the formation is then a "giant naked sextuple" (Hall's theorem: every
 *     value appears exactly once).
 *
 * Eliminations: for each value d in the set, every cell outside the formation
 * that sees ALL of d's positions inside the formation loses d.
 *
 * The implementation here uses two heuristics for tractability:
 *   (1) Six-cell formations built from two parallel lines (rows or columns)
 *       sharing three columns (or rows). 3+3, 2+4, 4+2, 5+2, 2+5.
 *   (2) We require every cell's candidates to be a subset of the union and at
 *       most one cell carries 3 candidates (the "pivot"); the others are
 *       bivalue.
 *
 * Per the overlap rule this is a presentation alias over the chain engine —
 * the "twin XY-cycles" are exactly the AIC interpretation of the giant
 * locked set. We expose it as its own strategyId for the trace.
 */

import { CELLS, ROWS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** All cells of the formation that can hold digit d. */
function cellsForDigit(grid: Grid, formation: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return formation.filter((c) => grid.candidatesOf(c) & bit);
}

/** All cells of an outer set that see EVERY cell in the inner set. */
function cellsSeeingAll(grid: Grid, outer: readonly number[], inner: readonly number[]): number[] {
  const innerSet = new Set(inner);
  const out: number[] = [];
  for (const c of outer) {
    if (grid.get(c) !== 0) continue;
    let seesAll = true;
    for (const ic of inner) {
      if (ic === c) continue;
      if (!PEERS_OF[c]!.includes(ic)) { seesAll = false; break; }
    }
    if (seesAll) out.push(c);
  }
  return out;
}

/**
 * Test whether the six cells form a "giant naked sextuple": every digit d in
 * the union is *visible* in every cell that holds it (i.e. the d-holders
 * mutually see each other). This is the "no-repeat" condition.
 *
 * Returns the digit set on success, null on failure.
 */
function isGiantNakedSextuple(grid: Grid, formation: readonly number[]): number[] | null {
  if (formation.length !== 6) return null;
  // All cells empty.
  for (const c of formation) {
    if (grid.get(c) !== 0) return null;
  }
  // Union of candidates across the formation.
  let union = 0;
  for (const c of formation) union |= grid.candidatesOf(c);
  const digits = digitsOf(union);
  if (digits.length !== 6) return null;
  // At most one pivot cell carries 3 candidates; others must be bivalue.
  let pivotCount = 0;
  for (const c of formation) {
    const m = grid.candidatesOf(c);
    const sz = popcount(m);
    if (sz < 2 || sz > 3) return null;
    if (sz === 3) pivotCount++;
  }
  if (pivotCount > 1) return null;
  // Mutual visibility: for every digit d, all d-holders must mutually see each
  // other. (Pre-filtering: cells in the same row/col/box automatically see
  // each other. Cells in different houses must be cross-visible via the link
  // graph.)  We allow per-digit holders to see each other pairwise. If any
  // pair is NOT peers, the sextuple is invalid.
  for (const d of digits) {
    const holders = cellsForDigit(grid, formation, d);
    if (holders.length < 1) continue;
    if (holders.length === 1) continue; // single holder, trivially mutual
    for (let i = 0; i < holders.length; i++) {
      for (let j = i + 1; j < holders.length; j++) {
        if (!PEERS_OF[holders[i]!]!.includes(holders[j]!)) return null;
      }
    }
  }
  return digits;
}

/**
 * Build six-cell formations from two parallel lines sharing three columns
 * (rows) — the canonical Nils Leder 3×2 / 2×3 substrate.
 */
function* formationsFromParallelRows(): Generator<number[]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      // Pick 3 columns shared by the two rows; try every 3-subset.
      for (let c1 = 0; c1 < 7; c1++) {
        for (let c2 = c1 + 1; c2 < 8; c2++) {
          for (let c3 = c2 + 1; c3 < 9; c3++) {
            yield [
              ROWS[r1]![c1]!, ROWS[r1]![c2]!, ROWS[r1]![c3]!,
              ROWS[r2]![c1]!, ROWS[r2]![c2]!, ROWS[r2]![c3]!,
            ];
          }
        }
      }
    }
  }
}

/**
 * Same as above but for columns.
 */
function* formationsFromParallelCols(): Generator<number[]> {
  for (let c1 = 0; c1 < 8; c1++) {
    for (let c2 = c1 + 1; c2 < 9; c2++) {
      for (let r1 = 0; r1 < 7; r1++) {
        for (let r2 = r1 + 1; r2 < 8; r2++) {
          for (let r3 = r2 + 1; r3 < 9; r3++) {
            yield [
              ROWS[r1]![c1]!, ROWS[r2]![c1]!, ROWS[r3]![c1]!,
              ROWS[r1]![c2]!, ROWS[r2]![c2]!, ROWS[r3]![c2]!,
            ];
          }
        }
      }
    }
  }
}

function tryTwinnedXyChains(grid: Grid): Step | null {
  // Search parallel-row formations.
  for (const formation of formationsFromParallelRows()) {
    const digits = isGiantNakedSextuple(grid, formation);
    if (!digits) continue;
    return emitTwinned(grid, formation, digits);
  }
  // Search parallel-column formations.
  for (const formation of formationsFromParallelCols()) {
    const digits = isGiantNakedSextuple(grid, formation);
    if (!digits) continue;
    return emitTwinned(grid, formation, digits);
  }
  return null;
}

function emitTwinned(grid: Grid, formation: readonly number[], digits: number[]): Step | null {
  const formationSet = new Set(formation);
  const elims: { cell: number; digit: number }[] = [];
  for (const d of digits) {
    const holders = cellsForDigit(grid, formation, d);
    const targets = cellsSeeingAll(grid, Array.from({ length: CELLS }, (_, i) => i), holders);
    for (const t of targets) {
      if (formationSet.has(t)) continue;
      if (grid.hasCandidate(t, d)) elims.push({ cell: t, digit: d });
    }
  }
  // Deduplicate.
  const seen = new Set<number>();
  const uniqueElims = elims.filter((e) => {
    const k = e.cell * 10 + e.digit;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (uniqueElims.length === 0) return null;
  return {
    strategyId: 'twinned-xy-chains',
    placements: [],
    eliminations: uniqueElims,
    highlights: {
      cells: [...formation, ...uniqueElims.map((e) => e.cell)],
      candidates: formation.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `孪生 XY 链：六格 ${formation.map(cellLabel).join('、')} 形成候选数 {${digits.join(',')}} 的巨型裸六数组；对每位数字 d，可看见 d 在六格中全部位置的格消去 d。`,
      en: `Twinned XY-Chains: six cells ${formation.map(cellLabel).join(', ')} form a giant naked sextuple on digits {${digits.join(',')}}; for each digit d, eliminate d from cells outside the formation that see every d-holder inside it.`,
    },
  };
}

export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生 XY 链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryTwinnedXyChains(grid);
  },
};

// Suppress unused.