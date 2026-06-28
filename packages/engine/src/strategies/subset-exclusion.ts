/**
 * Subset Exclusion (with Subset Counting / Extended Subset Principle) — 子集排除.
 *
 * Subset Exclusion generalises Aligned Pair Exclusion (APE) and Aligned Triple
 * Exclusion (ATE): the base cells need **not** be aligned (need not see each
 * other) at all. The base size k ≥ 2; we cap k at 3 for tractability (matching
 * the standard human-readable form). When two base cells see each other we apply
 * the alignment-drop rule; otherwise aligned values are allowed.
 *
 * A combination is a tuple (d_1, …, d_k) with d_i ∈ cand(base_cell_i).
 * A combination is "killed" if it empties a common witness (a bivalue "buddy"
 * cell seen by every base cell): the buddy has only two candidates; if both
 * appear among the base cells' assignments, the buddy has no legal value.
 *
 * An *allowed* combination is non-killed (and legal under alignment). For each
 * base cell B_i, the value v ∈ cand(B_i) that survives in **no** allowed
 * combination is eliminated. This is the "Survivor-Drop" form of Subset
 * Exclusion.
 *
 * Per the overlap contract (Roadmap ② gate 3): this strategy is the canonical
 * owner for Subset Exclusion; APE / ATE are presentation aliases over the same
 * search engine with the alignment restriction.
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

function sharesHouse(grid: Grid, c1: number, c2: number): boolean {
  return ROW_OF[c1] === ROW_OF[c2] || COL_OF[c1] === COL_OF[c2] || BOX_OF[c1] === BOX_OF[c2];
}

/**
 * Find all bivalue "buddy" cells seen by every base cell, whose candidate mask
 * intersects the base cells' union. The kill rule: the buddy is killed if both
 * of its digits appear among the base cells' assignments (each to a distinct
 * base cell, or to a single base cell — see combinationKilledByBuddy).
 */
function findCommonBivalueBuddies(grid: Grid, base: readonly BaseCell[]): Array<{ buddy: number; digits: [number, number] }> {
  const out: Array<{ buddy: number; digits: [number, number] }> = [];
  const baseMask = base.reduce((m, b) => m | b.digitMask, 0);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (base.some((b) => b.cell === c)) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    if ((m & baseMask) === 0) continue;
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

function combinationKilledByBuddy(
  combo: readonly number[],
  baseCells: readonly number[],
  buddy: { buddy: number; digits: [number, number] },
): boolean {
  const [d1, d2] = buddy.digits;
  let hasD1 = false;
  let hasD2 = false;
  let d1Cell = -1;
  let d2Cell = -1;
  for (let i = 0; i < baseCells.length; i++) {
    if (combo[i] === d1) { hasD1 = true; d1Cell = i; }
    if (combo[i] === d2) { hasD2 = true; d2Cell = i; }
  }
  if (!hasD1 || !hasD2) return false;
  if (d1Cell === d2Cell) return false;
  return true;
}

/**
 * Run subset-exclusion enumeration on a base. Bases of size 2 or 3 are
 * supported. For each base cell, values that never appear in any allowed
 * combination are eliminated.
 */
function runSubsetExclusion(grid: Grid, base: readonly BaseCell[]): Step | null {
  if (base.length < 2 || base.length > 3) return null;
  const baseCells = base.map((b) => b.cell);
  const buddies = findCommonBivalueBuddies(grid, base);
  if (buddies.length === 0) return null;

  // Enumerate combinations.
  function* genCombos(idx: number, current: number[]): Generator<number[]> {
    if (idx === base.length) { yield [...current]; return; }
    for (const d of base[idx]!.digits) {
      current.push(d);
      yield* genCombos(idx + 1, current);
      current.pop();
    }
  }

  const allowed: number[][] = [];
  for (const combo of genCombos(0, [])) {
    // Alignment drop (only when cells see each other and got the same digit).
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
    // Buddy kill.
    let killed = false;
    for (const buddy of buddies) {
      if (combinationKilledByBuddy(combo, baseCells, buddy)) { killed = true; break; }
    }
    if (killed) continue;
    allowed.push(combo);
  }
  if (allowed.length === 0) return null;

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

  // Deduplicate eliminations.
  const seen = new Set<number>();
  const uniqueElims = elims.filter((e) => {
    const key = e.cell * 10 + e.digit;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueElims.length === 0) return null;

  return {
    strategyId: 'subset-exclusion',
    placements: [],
    eliminations: uniqueElims,
    highlights: {
      cells: [...baseCells, ...uniqueElims.map((e) => e.cell)],
      candidates: baseCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `子集排除（Subset Exclusion）：基底 ${baseCells.map(cellLabel).join('、')} 共 ${allowed.length} 种合法组合；消去从未出现的候选数（${uniqueElims.map((e) => `${cellLabel(e.cell)}=${e.digit}`).join('、')}）。`,
      en: `Subset Exclusion: base ${baseCells.map(cellLabel).join(', ')} has ${allowed.length} allowed combinations; strip digits never appearing (${uniqueElims.map((e) => `${cellLabel(e.cell)}=${e.digit}`).join(', ')}).`,
    },
  };
}

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // Pair bases (k=2, unaligned OR aligned — supersedes APE for non-aligned).
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) emptyCells.push(c);

    // First try unaligned pairs (those are pure SE; APE takes aligned pairs at
    // its own difficulty band).
    for (let i = 0; i < emptyCells.length; i++) {
      for (let j = i + 1; j < emptyCells.length; j++) {
        const c1 = emptyCells[i]!;
        const c2 = emptyCells[j]!;
        const m1 = grid.candidatesOf(c1);
        const m2 = grid.candidatesOf(c2);
        if (popcount(m1) < 2 || popcount(m1) > 4) continue;
        if (popcount(m2) < 2 || popcount(m2) > 4) continue;
        if ((m1 & m2) === 0) continue;
        if (sharesHouse(grid, c1, c2)) continue; // APE covers aligned pairs
        const base: BaseCell[] = [
          { cell: c1, digits: digitsOf(m1), digitMask: m1 },
          { cell: c2, digits: digitsOf(m2), digitMask: m2 },
        ];
        const step = runSubsetExclusion(grid, base);
        if (step) return step;
      }
    }

    // Triple bases (k=3, all-aligned ATE supersedes the aligned-triple case;
    // but we also try triples with small candidates — SE's signature form).
    if (emptyCells.length < 3) return null;
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
          if ((m1 & m2 & m3) === 0) continue;
          // Skip aligned triples (those are ATE's domain).
          const allAligned = sharesHouse(grid, c1, c2) && sharesHouse(grid, c2, c3) && sharesHouse(grid, c1, c3);
          if (allAligned) continue;
          const base: BaseCell[] = [
            { cell: c1, digits: digitsOf(m1), digitMask: m1 },
            { cell: c2, digits: digitsOf(m2), digitMask: m2 },
            { cell: c3, digits: digitsOf(m3), digitMask: m3 },
          ];
          const step = runSubsetExclusion(grid, base);
          if (step) return step;
        }
      }
    }

    return null;
  },
};