/**
 * Gurth's Symmetrical Placement — 葛斯定理（对称摆放）.
 *
 * Per the research card (`10-uniqueness/gurth.md`):
 *   If a puzzle's givens are SYMMETRICAL under a geometric transform σ
 *   combined with a fixed digit permutation π, and the puzzle has a unique
 *   solution, then the entire candidate grid is σ∘π-symmetric. Cells on
 *   the axis of symmetry must hold digits that map to themselves under π.
 *
 * Allowed symmetries (σ):
 *   - main-diagonal reflection (σ swaps (r,c) with (c,r));
 *   - anti-diagonal reflection;
 *   - 180° rotation.
 *
 * Conditions:
 *   - Every clue must have a σ-image (paired clues).
 *   - The digit permutation π must be a complete 1:1 mapping of {1..9}.
 *
 * Implementation:
 *   1. Try the three σ transforms. For each, iterate over every cell c and
 *      check that the clue at σ(c) (a solved cell in the grid) agrees with
 *      π-derived clue at c. If all clues pair up consistently, the puzzle is
 *      Gurth-compatible.
 *   2. Derive π: for each clue pair (c1, c2 = σ(c1)), π(solution(c1)) =
 *      solution(c2). The mapping must be consistent and complete.
 *   3. Compute self-mapped digits: {d : π(d) = d}.
 *   4. For each cell c on the axis (σ(c) = c), the candidates must be a
 *      subset of self-mapped digits → eliminate non-self-mapped candidates.
 *
 * Soundness caveat: Gurth assumes unique solution (stated explicitly in the
 * card). Puzzles without a unique solution may produce unsound deductions;
 * we therefore only fire when the puzzle is consistent with a candidate
 * σ∘π invariant AND when the puzzle has a known unique solution
 * (the engine assumes competition puzzles are unique).
 *
 * In practice, the engine cannot enumerate all candidate σ∘π symmetries
 * cheaply; we test the three canonical symmetries, derive π from clues, and
 * validate completeness.
 */

import { CELLS, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

type Symmetry = 'main-diag' | 'anti-diag' | 'rot180';

function applySymmetry(sigma: Symmetry, cell: number): number {
  const r = Math.floor(cell / 9);
  const c = cell % 9;
  switch (sigma) {
    case 'main-diag': return c * 9 + r;
    case 'anti-diag': return (8 - c) * 9 + (8 - r);
    case 'rot180': return (8 - r) * 9 + (8 - c);
  }
}

interface DeriveResult {
  pi: number[]; // pi[d] = d' where d,d' are 1..9
  complete: boolean;
}

function derivePi(grid: Grid, sigma: Symmetry): DeriveResult | null {
  // Build pi mapping from clue pairs. We need π(solution(c)) = solution(σ(c)).
  const pi: number[] = new Array(10).fill(0); // 1-indexed; pi[d] = d'
  const seen = new Set<number>();
  for (let c = 0; c < CELLS; c++) {
    const v = grid.get(c);
    if (v === 0) continue; // not a clue
    const sc = applySymmetry(sigma, c);
    const sv = grid.get(sc);
    if (sv === 0) {
      // σ(c) is not a clue. For a complete symmetry, every clue must pair.
      // Skip — this transform is not a valid Gurth symmetry for this puzzle.
      return null;
    }
    // π(v) = sv
    if (pi[v] === 0) {
      pi[v] = sv;
      seen.add(v);
    } else if (pi[v] !== sv) {
      // Inconsistent mapping — this σ is not a valid symmetry.
      return null;
    }
  }
  // Check completeness: every digit 1..9 must appear in π's image.
  if (seen.size !== 9) return null;
  // Check injectivity: π must be a permutation.
  const usedImages = new Set<number>();
  for (let d = 1; d <= 9; d++) {
    if (usedImages.has(pi[d]!)) return null;
    usedImages.add(pi[d]!);
  }
  return { pi, complete: true };
}

function tryGurth(grid: Grid): Step | null {
  const symmetries: Symmetry[] = ['main-diag', 'anti-diag', 'rot180'];

  for (const sigma of symmetries) {
    const result = derivePi(grid, sigma);
    if (!result) continue;
    const { pi } = result;

    // Self-mapped digits.
    const selfMapped: number[] = [];
    for (let d = 1; d <= 9; d++) if (pi[d] === d) selfMapped.push(d);

    // Axis cells: cells where σ(c) = c.
    const axisCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (applySymmetry(sigma, c) === c) axisCells.push(c);
    }
    if (axisCells.length === 0) continue;
    // For diagonal reflections, axis is the main diagonal (9 cells) — must
    // have at least 3 self-mapped digits for the deduction to be useful.
    if (sigma !== 'rot180' && selfMapped.length < 3) continue;

    const selfMappedMask = selfMapped.reduce((m, d) => m | maskOf(d), 0);

    const elims: { cell: number; digit: number }[] = [];
    for (const c of axisCells) {
      if (grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      const extras = m & ~selfMappedMask;
      if (extras === 0) continue;
      for (const d of digitsOf(extras)) {
        if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
      }
    }
    if (elims.length === 0) continue;

    const sigmaLabel = sigma === 'main-diag' ? '主对角反射' : sigma === 'anti-diag' ? '副对角反射' : '180° 旋转';
    const sigmaLabelEn = sigma === 'main-diag' ? 'main-diagonal reflection' : sigma === 'anti-diag' ? 'anti-diagonal reflection' : '180° rotation';

    return {
      strategyId: 'gurth',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...axisCells, ...elims.map((e) => e.cell)],
        candidates: axisCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `葛斯定理（对称摆放）：题面在 ${sigmaLabel}（σ∘π，π 为 {${pi.slice(1).map((d, i) => `${i + 1}→${d}`).filter((_, i) => pi[i + 1] !== i + 1).join(', ') || '恒等'}}）下对称；唯一解保证全盘候选数亦对称；轴上 ${axisCells.length} 格只能取自映射数字 {${selfMapped.join(',') || '无'}}；消去非 {${selfMapped.join(',') || '无'}} 候选。`,
        en: `Gurth's Symmetrical Placement: givens are symmetric under ${sigmaLabelEn}; uniqueness forces the candidate grid to also be σ∘π-symmetric; the ${axisCells.length} axis cells can only hold self-mapped digits {${selfMapped.join(',') || '(none)'}}; eliminate non-{${selfMapped.join(',') || 'self-mapped'}} candidates.`,
      },
    };
  }
  return null;
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理（对称摆放）', en: 'Gurth\'s Symmetrical Placement' },
  difficulty: 990,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryGurth(grid);
  },
};

// Suppress unused.
void popcount;