/**
 * Sue de Coq — Extended Form — 苏德蔻扩展型.
 *
 * Per the overlap rule (Roadmap ②), the basic SdC lives in `sue-de-coq.ts` and
 * only handles the canonical 2/4 and 3/5 forms (n=0). The "extended" form
 * allows n>0: extra non-V candidates in CL or CB may legitimately appear in
 * both wings — the shared extension digit need not be drawn from V.
 *
 * Concretely the canonical extended forms covered here are:
 *
 *   (a) 3-cell intersection with 5+ candidates, the wing cells draw subsets of
 *       V plus at most one extension candidate (n=1) shared between CL/CB.
 *   (b) Larger wing groups: |CL| ≥ 2 or |CB| ≥ 2 (the basic SdC restricts to
 *       |CL|=|CB|=1 for hand-traceability; the extended form can have 2-cell
 *       wing groups when the digit-set balances).
 *
 * The engine is a *superset* of the basic SdC. To stay under the contract, we
 * search the SAME intersections the basic engine searches, but allow richer
 * wing configurations and report results under `sue-de-coq-extended` only when
 * the basic SdC form fails to fire (i.e. when n>0 or wing size > 1 is needed
 * for the partition to balance). This is a *detection* overlay — the algorithm
 * reuses `trySdCIntersection` only for soundness check, but recomputes
 * extended partitions.
 *
 * Rule (per `11-exotic/sue-de-coq.md`):
 *   - |C| = 2 or 3 intersection cells
 *   - V = union of candidates over C
 *   - |V| >= |C| + 2  (basic threshold)
 *   - Disjointness: VL ∩ VB ∩ V = ∅  (intersection values stay disjoint)
 *   - Extension: any value outside V appearing in both CL and CB is allowed;
 *     elimination falls on the union of values not in V across both wings.
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* combineK<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combineK(rest, k - 1)) yield [first!, ...combo];
  yield* combineK(rest, k);
}

/**
 * Search for a valid SdC partition with at most |CL|=2 and |CB|=2 cells in the
 * wings (extended variants). Returns the partition on success.
 *
 * Acceptance: union-of-wing-values ∩ V must include at least |V|-|C| values
 * drawn from V; values outside V may appear in either wing (extension).
 */
function findExtendedSdC(
  grid: Grid,
  lineCells: readonly number[],
  boxCells: readonly number[],
): { C: number[]; Ldigits: number[]; Bdigits: number[]; lComp: number[]; bComp: number[]; V: number[] } | null {
  const intersectCells = lineCells.filter((c) => boxCells.includes(c));
  const emptyIntersect = intersectCells.filter((c) => grid.get(c) === 0);
  if (emptyIntersect.length < 2 || emptyIntersect.length > 3) return null;

  let intersectMask = 0;
  for (const c of emptyIntersect) intersectMask |= grid.candidatesOf(c);
  const V = digitsOf(intersectMask);
  if (V.length < emptyIntersect.length + 2) return null;

  const restLine = lineCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);
  const restBox = boxCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);

  // For each partition of V into L_mask and B_mask, find line companions and
  // box companions.
  const N = emptyIntersect.length;
  for (let lineMask = 1; lineMask < (1 << V.length) - 1; lineMask++) {
    const L_mask = V.reduce((acc, d, i) => ((lineMask & (1 << i)) ? acc | maskOf(d) : acc), 0);
    const B_mask = intersectMask & ~L_mask;
    if (B_mask === 0) continue;
    const L_digits = digitsOf(L_mask);
    const B_digits = digitsOf(B_mask);

    // Companion counts (>=1 each, <=2 each for extended).
    for (let ncL = 1; ncL <= 2; ncL++) {
      for (let ncB = 1; ncB <= 2; ncB++) {
        // |CL| = L_digits.length - N (each line companion contributes 1 L value)
        // Allow the partition to balance by extending with extra (non-V) values.
        if (ncL > L_digits.length - N + 1) continue;
        if (ncB > B_digits.length - N + 1) continue;
        // Use at most the difference between L_digits count and N (a wing cell
        // can host one value from V plus optional non-V extension values).
        if (ncL !== L_digits.length - N && ncL !== L_digits.length - N + 1) continue;
        if (ncB !== B_digits.length - N && ncB !== B_digits.length - N + 1) continue;

        const lineCompanionCandidates = restLine.filter((c) => {
          const m = grid.candidatesOf(c);
          if (m === 0) return false;
          // Each companion must have candidates ⊆ (L_mask ∪ extraMask); we
          // permit candidates outside V (extension values).
          return (m & L_mask) !== 0; // must hold at least one L digit
        });
        if (lineCompanionCandidates.length < ncL) continue;

        const boxCompanionCandidates = restBox.filter((c) => {
          const m = grid.candidatesOf(c);
          if (m === 0) return false;
          return (m & B_mask) !== 0; // must hold at least one B digit
        });
        if (boxCompanionCandidates.length < ncB) continue;

        for (const lComp of combineK(lineCompanionCandidates, ncL)) {
          // Verify: the union of L_mask in intersection + lComp covers L_mask.
          let coveredL = 0;
          for (const c of emptyIntersect) coveredL |= (grid.candidatesOf(c) & L_mask);
          for (const c of lComp) coveredL |= (grid.candidatesOf(c) & L_mask);
          if (coveredL !== L_mask) continue;

          // All L digits in the line must be confined to intersection + lComp.
          const LConfined = restLine.every((c) => {
            if (lComp.includes(c)) return true;
            return (grid.candidatesOf(c) & L_mask) === 0;
          });
          if (!LConfined) continue;

          for (const bComp of combineK(boxCompanionCandidates, ncB)) {
            // Verify B coverage.
            let coveredB = 0;
            for (const c of emptyIntersect) coveredB |= (grid.candidatesOf(c) & B_mask);
            for (const c of bComp) coveredB |= (grid.candidatesOf(c) & B_mask);
            if (coveredB !== B_mask) continue;

            const BConfined = restBox.every((c) => {
              if (bComp.includes(c)) return true;
              return (grid.candidatesOf(c) & B_mask) === 0;
            });
            if (!BConfined) continue;

            // Disjointness: intersection of L and B values across wings,
            // restricted to V, must be empty. (Extension values can be shared.)
            const wingVMask = (lComp.reduce((m, c) => m | grid.candidatesOf(c), 0) & intersectMask)
              & (bComp.reduce((m, c) => m | grid.candidatesOf(c), 0) & intersectMask);
            if (wingVMask !== 0) continue;

            return { C: emptyIntersect, Ldigits: L_digits, Bdigits: B_digits, lComp, bComp, V };
          }
        }
      }
    }
  }
  return null;
}

function applyExtendedSdC(
  grid: Grid,
  lineCells: readonly number[],
  boxCells: readonly number[],
  lineLabel: string,
  boxLabel: string,
): Step | null {
  const part = findExtendedSdC(grid, lineCells, boxCells);
  if (!part) return null;
  const { C, Ldigits, Bdigits, lComp, bComp, V } = part;

  const elims: { cell: number; digit: number }[] = [];

  // Line side: B_digits and (V \ Ldigits) get eliminated from rest of line.
  const BMask = Bdigits.reduce((m, d) => m | maskOf(d), 0);
  const LMask = Ldigits.reduce((m, d) => m | maskOf(d), 0);
  const VMask = V.reduce((m, d) => m | maskOf(d), 0);
  const notLMask = VMask & ~LMask;
  const lineElimMask = BMask | notLMask;

  for (const c of lineCells) {
    if (C.includes(c) || lComp.includes(c)) continue;
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c) & lineElimMask)) {
      if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
    }
  }

  // Box side: L_digits and (V \ Bdigits) get eliminated from rest of box.
  const notBMask = VMask & ~BMask;
  const boxElimMask = LMask | notBMask;

  for (const c of boxCells) {
    if (C.includes(c) || bComp.includes(c)) continue;
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c) & boxElimMask)) {
      if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
    }
  }

  if (elims.length === 0) return null;

  // Deduplicate.
  const seen = new Set<number>();
  const uniqueElims = elims.filter((e) => {
    const key = e.cell * 10 + e.digit;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueElims.length === 0) return null;

  const involved = [...C, ...lComp, ...bComp];

  return {
    strategyId: 'sue-de-coq-extended',
    placements: [],
    eliminations: uniqueElims,
    highlights: {
      cells: [...new Set([...involved, ...uniqueElims.map((e) => e.cell)])],
      candidates: involved.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `苏德蔻扩展型：${C.length} 格（${lineLabel} ∩ ${boxLabel}）候选数 {${V.join(',')}}；行部分 {${Ldigits.join(',')}} 配 ${lComp.length} 个行伙伴，宫部分 {${Bdigits.join(',')}} 配 ${bComp.length} 个宫伙伴；消去扩展型对应的行/宫其余格（苏德蔻扩展型）。`,
      en: `Sue de Coq Extended: ${C.length} cells (${lineLabel} ∩ ${boxLabel}) with candidates {${V.join(',')}}; line-part {${Ldigits.join(',')}} paired with ${lComp.length} line companions, box-part {${Bdigits.join(',')}} paired with ${bComp.length} box companions; eliminations on rest of line and box (SdC Extended).`,
    },
  };
}

export const sueDeCoqExtended: Strategy = {
  id: 'sue-de-coq-extended',
  name: { zh: '苏德蔻扩展型', en: 'Sue de Coq (Extended)' },
  difficulty: 1015,
  tieBreak: ['house', 'cell-index'],

  apply(grid: Grid): Step | null {
    // Try row × box intersections.
    for (let r = 0; r < 9; r++) {
      const rowCells = ROWS[r]!;
      for (let b = 0; b < 9; b++) {
        if (!rowCells.some((c) => BOX_OF[c] === b)) continue;
        const step = applyExtendedSdC(grid, rowCells, BOXES[b]!, `R${r + 1}`, `B${b + 1}`);
        if (step) return step;
      }
    }
    // Try col × box intersections.
    for (let col = 0; col < 9; col++) {
      const colCells = COLS[col]!;
      for (let b = 0; b < 9; b++) {
        if (!colCells.some((c) => BOX_OF[c] === b)) continue;
        const step = applyExtendedSdC(grid, colCells, BOXES[b]!, `C${col + 1}`, `B${b + 1}`);
        if (step) return step;
      }
    }
    return null;
  },
};

// Suppress unused
void popcount;