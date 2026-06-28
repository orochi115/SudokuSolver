/**
 * APE / ATE — Aligned Pair / Triple Exclusion (T4, exotic).
 *
 * Pick a base set K of 2 cells (APE) or 3 cells (ATE). For each base cell
 * k_i, candidates = cands(k_i). Enumerate every combination of digit
 * assignments (d_1, …, d_|K|) with d_i ∈ cands(k_i). Each combination is
 * "allowed" unless:
 *   - two base cells share a house and got the same digit (alignment drop), OR
 *   - there exists a common ALS A (a set of m cells whose candidate union
 *     has size m+1, ALL of whose cells are seen by every cell of K) such
 *     that the combination's assignments cover |A| distinct values of
 *     A's (|A|+1)-value union (the "kill" condition — A is left with no
 *     legal value).
 *
 * For each base cell k_i and each value d ∈ cands(k_i), if d never appears
 * in any allowed combination assigned to k_i, eliminate d from k_i.
 *
 * The minimal common ALS is a single bivalue cell seen by all base cells.
 * We restrict to this minimal ALS for human-default tractability; larger
 * common ALSs are uncommon in practice and add a lot of enumeration.
 *
 * APE/ATE is *not* a forcing or backtracking technique — it is pure
 * "combination enumeration + bookkeeping". The enumeration is bounded by
 * ∏|cands(k_i)| which is small for 2-cell bases (up to ~9 combinations).
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface BaseCell {
  cell: number;
  digits: number[];
  digitMask: number;
}

/** Find all bivalue "buddy" cells whose candidates include at least one base
 *  digit AND that are seen by ALL base cells. For each buddy, the kill set
 *  is the buddy's two digits. */
function findCommonBivalueBuddies(grid: Grid, base: readonly BaseCell[]): Array<{ buddy: number; digits: [number, number] }> {
  const out: Array<{ buddy: number; digits: [number, number] }> = [];
  const baseMask = base.reduce((m, b) => m | b.digitMask, 0);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (base.some((b) => b.cell === c)) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    if ((m & baseMask) === 0) continue;
    // Must be seen by every base cell.
    let seenByAll = true;
    for (const b of base) {
      if (!PEERS_OF[b.cell]!.includes(c)) { seenByAll = false; break; }
    }
    if (!seenByAll) continue;
    const digits: [number, number] = [
      digitsOf(m)[0]!,
      digitsOf(m)[1]!,
    ];
    out.push({ buddy: c, digits });
  }
  return out;
}

/** A combination (one digit per base cell) is killed by a buddy if the
 *  combination assigns BOTH of the buddy's digits (each to a different base
 *  cell, OR to the single base cell that sees the buddy if |K|=1 — but we
 *  require |K|≥2). */
function combinationKilledByBuddy(
  combo: readonly number[],
  baseCells: readonly number[],
  buddy: { buddy: number; digits: [number, number] },
): boolean {
  const [d1, d2] = buddy.digits;
  // Buddy is killed if every digit in the buddy's mask is "consumed" by the
  // base combination — i.e. d1 appears in some base cell AND d2 appears in
  // some (other) base cell. The buddy has only 2 candidates; if both are
  // already taken by the base cells (one or two of them), the buddy has no
  // legal value.
  let hasD1 = false;
  let hasD2 = false;
  let d1Cell = -1;
  let d2Cell = -1;
  for (let i = 0; i < baseCells.length; i++) {
    if (combo[i] === d1) { hasD1 = true; d1Cell = i; }
    if (combo[i] === d2) { hasD2 = true; d2Cell = i; }
  }
  if (!hasD1 || !hasD2) return false;
  // If both d1 and d2 are assigned to the SAME base cell, the buddy is
  // still safe (that base cell only takes ONE of d1/d2).
  if (d1Cell === d2Cell) return false;
  return true;
}

/** Check if two base cells share a house. */
function sharesHouse(grid: Grid, c1: number, c2: number): boolean {
  return ROW_OF[c1] === ROW_OF[c2] || COL_OF[c1] === COL_OF[c2] || BOX_OF[c1] === BOX_OF[c2];
}

/** Run APE/ATE for the given base. */
function runApeAte(grid: Grid, base: readonly BaseCell[], strategyId: string): Step | null {
  if (base.length < 2 || base.length > 3) return null;
  const baseCells = base.map((b) => b.cell);
  const buddies = findCommonBivalueBuddies(grid, base);
  if (buddies.length === 0) return null;
  // Enumerate all combinations.
  function* genCombos(idx: number, current: number[]): Generator<number[]> {
    if (idx === base.length) { yield [...current]; return; }
    for (const d of base[idx]!.digits) {
      current.push(d);
      yield* genCombos(idx + 1, current);
      current.pop();
    }
  }
  // Determine allowed combinations.
  const allowed: number[][] = [];
  for (const combo of genCombos(0, [])) {
    // Alignment drop: two base cells share a house and got the same digit.
    let dropped = false;
    for (let i = 0; i < baseCells.length; i++) {
      for (let j = i + 1; j < baseCells.length; j++) {
        if (combo[i] === combo[j] && sharesHouse(grid, baseCells[i]!, baseCells[j]!)) {
          dropped = true;
          break;
        }
      }
      if (dropped) break;
    }
    if (dropped) continue;
    // Buddy kill: any buddy is killed?
    let killed = false;
    for (const buddy of buddies) {
      if (combinationKilledByBuddy(combo, baseCells, buddy)) { killed = true; break; }
    }
    if (killed) continue;
    allowed.push(combo);
  }
  if (allowed.length === 0) return null;
  // Determine surviving digits per base cell.
  const elims: { cell: number; digit: number }[] = [];
  for (let i = 0; i < base.length; i++) {
    const surviving = new Set(allowed.map((c) => c[i]!));
    for (const d of base[i]!.digits) {
      if (!surviving.has(d) && grid.hasCandidate(base[i]!.cell, d)) {
        elims.push({ cell: base[i]!.cell, digit: d });
      }
    }
  }
  if (elims.length === 0) return null;
  return {
    strategyId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...baseCells, ...elims.map((e) => e.cell)],
      candidates: baseCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `${strategyId === 'aligned-pair-exclusion' ? '对齐数对排除（APE）' : '对齐三数排除（ATE）'}：基底 ${baseCells.map(cellLabel).join('、')}，对位组合后幸存 ${allowed.length} 种；消去从未出现的候选（${strategyId === 'aligned-pair-exclusion' ? 'APE' : 'ATE'}）。`,
      en: `${strategyId === 'aligned-pair-exclusion' ? 'Aligned Pair Exclusion (APE)' : 'Aligned Triple Exclusion (ATE)'}: base ${baseCells.map(cellLabel).join(', ')}, ${allowed.length} surviving combinations; strip digits never appearing (${strategyId === 'aligned-pair-exclusion' ? 'APE' : 'ATE'}).`,
    },
  };
}

/** APE: enumerate 2-cell bases (aligned = in a common house). */
function tryApe(grid: Grid): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) emptyCells.push(c);
  // For tractability, only iterate 2-cell bases where the two cells share a
  // house (Type 1 — aligned). For Type 2 (non-aligned), allow any pair but
  // cap candidates to ≤ 3 each.
  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      const c1 = emptyCells[i]!;
      const c2 = emptyCells[j]!;
      const m1 = grid.candidatesOf(c1);
      const m2 = grid.candidatesOf(c2);
      if (popcount(m1) < 2 || popcount(m1) > 4) continue;
      if (popcount(m2) < 2 || popcount(m2) > 4) continue;
      // Must have at least one common digit (else no buddy kill possible).
      if ((m1 & m2) === 0) continue;
      // Type 1: aligned (share a house) — preferred.
      const aligned = sharesHouse(grid, c1, c2);
      const base: BaseCell[] = [
        { cell: c1, digits: digitsOf(m1), digitMask: m1 },
        { cell: c2, digits: digitsOf(m2), digitMask: m2 },
      ];
      const step = runApeAte(grid, base, 'aligned-pair-exclusion');
      if (step) return step;
      // Type 2: non-aligned — try anyway if candidates are small.
      if (!aligned && popcount(m1) <= 3 && popcount(m2) <= 3) {
        const step2 = runApeAte(grid, base, 'aligned-pair-exclusion');
        if (step2) return step2;
      }
    }
  }
  return null;
}

/** ATE: enumerate 3-cell bases where the 3 cells share at least one common
 *  house (aligned). */
function tryAte(grid: Grid): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) emptyCells.push(c);
  if (emptyCells.length < 3) return null;
  // Bound: candidates per cell ≤ 3 to keep ∏ ≤ 27.
  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        const c1 = emptyCells[i]!;
        const c2 = emptyCells[j]!;
        const c3 = emptyCells[k]!;
        const m1 = grid.candidatesOf(c1);
        const m2 = grid.candidatesOf(c2);
        const m3 = grid.candidatesOf(c3);
        if (popcount(m1) < 2 || popcount(m1) > 3) continue;
        if (popcount(m2) < 2 || popcount(m2) > 3) continue;
        if (popcount(m3) < 2 || popcount(m3) > 3) continue;
        // Aligned: all three share a house, OR pairwise-aligned.
        const allAligned = sharesHouse(grid, c1, c2) && sharesHouse(grid, c2, c3) && sharesHouse(grid, c1, c3);
        if (!allAligned) continue;
        // Must share at least one common digit overall.
        if ((m1 & m2 & m3) === 0) continue;
        const base: BaseCell[] = [
          { cell: c1, digits: digitsOf(m1), digitMask: m1 },
          { cell: c2, digits: digitsOf(m2), digitMask: m2 },
          { cell: c3, digits: digitsOf(m3), digitMask: m3 },
        ];
        const step = runApeAte(grid, base, 'aligned-triple-exclusion');
        if (step) return step;
      }
    }
  }
  return null;
}

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除 (APE)', en: 'Aligned Pair Exclusion (APE)' },
  difficulty: 1120,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryApe(grid);
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除 (ATE)', en: 'Aligned Triple Exclusion (ATE)' },
  difficulty: 1130,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryAte(grid);
  },
};

// Suppress unused
void maskOf;
