/**
 * Exotic strategies (P2a/P2b) — 异域策略
 *
 *  - gurth  : Gurth's Symmetrical Placement. If the currently-placed values
 *    exhibit rotational/diagonal symmetry with a complete digit permutation,
 *    axis cells are restricted to self-mapped digits. Sound under the
 *    single-solution assumption (standard for Sudoku).
 *  - exocet : Junior Exocet, Rule 1 (target purge). Conservative: registered
 *    but inactive until full pattern verification is implemented.
 *  - sk-loop: SK-Loop. Conservative: inactive (requires given-cell tracking).
 *  - msls   : Multi-Sector Locked Sets. Conservative: inactive.
 *  - fireworks: Fireworks. Conservative: inactive.
 *
 * The conservative ones are registered (so the engine knows the strategyId)
 * but return null — sound by construction (no eliminations). This matches the
 * approach used for tridagon (see exotic.ts).
 */

import { CELLS, ROW_OF, COL_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

// ============================================================
// Gurth's Symmetrical Placement
// ============================================================
//
// Theorem: if the givens are invariant under a geometric symmetry σ combined
// with a digit permutation π, and the puzzle has a unique solution, then the
// solution (and the entire candidate grid) is also invariant under σ∘π.
//
// We cannot track which cells are givens, so we check whether ALL currently-
// placed values are σ∘π-invariant. If the givens were symmetric, all sound
// placements preserve symmetry, so this check will pass. If the givens were
// NOT symmetric, the check will almost certainly fail (asymmetric givens
// produce asymmetric deductions).
//
// When the invariant holds, cells that σ maps to themselves (the axis) must
// hold self-mapped digits (digits d with π(d) = d). We eliminate all other
// candidates from axis cells.

type SymType = 'rot180' | 'diag-main' | 'diag-anti';

function symCell(c: number, sym: SymType): number {
  const r = ROW_OF[c]!, col = COL_OF[c]!;
  switch (sym) {
    case 'rot180':
      return (8 - r) * 9 + (8 - col);
    case 'diag-main':
      return col * 9 + r;
    case 'diag-anti':
      return (8 - col) * 9 + (8 - r);
  }
}

/** Try to derive a consistent digit permutation π from placed values under σ. */
function derivePermutation(grid: Grid, sym: SymType): Map<number, number> | null {
  const pi = new Map<number, number>();
  for (let c = 0; c < CELLS; c++) {
    const v = grid.get(c);
    if (v === 0) continue;
    const tc = symCell(c, sym);
    const tv = grid.get(tc);
    if (tv === 0) return null; // a placed cell maps to an empty cell → givens not symmetric
    if (pi.has(v)) {
      if (pi.get(v) !== tv) return null; // inconsistent mapping
    } else {
      // Check bijectivity: no two digits map to the same digit
      for (const [k, val] of pi) {
        if (val === tv && k !== v) return null;
      }
      pi.set(v, tv);
    }
  }
  // π must be a complete permutation of 1..9
  if (pi.size !== 9) return null;
  const vals = new Set(pi.values());
  if (vals.size !== 9) return null;
  for (let d = 1; d <= 9; d++) {
    if (!pi.has(d)) return null;
  }
  return pi;
}

/** Self-mapped digits: π(d) = d. */
function selfMappedDigits(pi: Map<number, number>): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (pi.get(d) === d) out.push(d);
  }
  return out;
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理（对称摆放）', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Check each symmetry type
    for (const sym of ['rot180', 'diag-main', 'diag-anti'] as SymType[]) {
      const pi = derivePermutation(grid, sym);
      if (!pi) continue;

      const selfMapped = selfMappedDigits(pi);
      if (selfMapped.length === 0) continue;

      // For each axis cell (σ(c) = c), eliminate non-self-mapped candidates
      const elims: { cell: number; digit: number }[] = [];
      const axisCells: number[] = [];
      const selfMappedSet = new Set(selfMapped);
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        if (symCell(c, sym) !== c) continue; // not an axis cell
        axisCells.push(c);
        for (const d of digitsOf(grid.candidatesOf(c))) {
          if (!selfMappedSet.has(d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }

      if (elims.length === 0) continue;

      const symLabel = sym === 'rot180' ? '180°旋转' : sym === 'diag-main' ? '主对角线' : '反对角线';
      return {
        strategyId: 'gurth',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...new Set([...axisCells, ...elims.map((e) => e.cell)])],
          candidates: [
            ...axisCells.flatMap((c) =>
              digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
            ),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `葛斯定理：当前盘面已落子呈${symLabel}对称（数字映射 π 自洽且完备）。在对称轴上的格子必须取自映射不变数字 {${selfMapped.join(', ')}}；消去轴上其余候选。`,
          en: `Gurth's Theorem: placed values exhibit ${sym === 'rot180' ? '180° rotation' : sym === 'diag-main' ? 'main-diagonal' : 'anti-diagonal'} symmetry with a consistent digit permutation π. Axis cells must hold self-mapped digits {${selfMapped.join(', ')}}; other candidates are eliminated from axis cells.`,
        },
      };
    }
    return null;
  },
};

// ============================================================
// Exocet (conservative — inactive)
// ============================================================
//
// A full Junior Exocet requires: base pair in one box, two targets in the
// other boxes of the band, companion cells, cross-lines, and S-cell cover
// constraints. Rule 1 (target purge) is sound, but verifying the complete
// pattern has many edge cases. Registered but inactive until the full
// detector is implemented.
export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: 'Exocet', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ============================================================
// SK-Loop (conservative — inactive)
// ============================================================
//
// SK-Loop requires identifying pivot cells that are GIVENS (the grid
// foundation tracks no givens). Registered but inactive.
export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: 'SK-Loop', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ============================================================
// MSLS (conservative — inactive)
// ============================================================
//
// Multi-Sector Locked Sets generalise locked sets across multiple row/column
// sectors. A sound full detector requires careful accounting of digit ×
// sector capacity. Registered but inactive until implemented.
export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区锁定集', en: 'MSLS' },
  difficulty: 1300,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ============================================================
// Fireworks (conservative — inactive)
// ============================================================
//
// Fireworks involve a specific conjugate-link structure across 3 cells in a
// line. The full pattern verification is complex. Registered but inactive.
export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};


