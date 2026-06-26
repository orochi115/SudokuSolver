/**
 * P2 Uniqueness Strategies — Gurth's Symmetrical Placement
 *
 * Gurth's Symmetrical Placement:
 *   If a puzzle has a symmetrical layout (180° rotational symmetry is most common),
 *   then the solution must also respect that symmetry. This means:
 *   - Digit d at cell c implies digit mapping(d) at the symmetric cell mapping(c).
 *   - If a cell is its own symmetric counterpart (center cell), it must be filled
 *     with a "self-mapping" digit (one that maps to itself).
 *
 *   For 180° symmetry (most common):
 *   - Cell (r,c) maps to cell (8-r, 8-c)
 *   - Digit d maps to mapping(d) where mapping is a permutation of 1..9
 *
 *   Detection:
 *   1. Verify the puzzle has 180° rotational symmetry (given cells are symmetric)
 *   2. Determine the digit permutation from solved (given) pairs
 *   3. Apply permutation to derive digit eliminations in unsolved cells
 *
 *   Eliminations:
 *   - If cell c has digit d as a candidate, but symmetric cell c' is solved with
 *     digit d', then c must be solved with mapping(d') — eliminate all other digits.
 *   - If both c and c' are unsolved but the permutation is partially known,
 *     restrict candidates accordingly.
 */

import {
  CELLS,
  ROW_OF, COL_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Symmetric cell under 180° rotation. */
function symCell(cell: number): number {
  return 80 - cell;
}

function tryGurth(grid: Grid): Step | null {
  // 1. Check 180° rotational symmetry among given cells
  // A cell is "given" if it was filled at puzzle start. We check by looking at which
  // filled cells have their symmetric counterpart also filled.
  // We approximate "given" by checking if symmetry holds for ALL currently filled cells.
  // (Works for puzzles with rotational symmetry.)

  const filledCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) filledCells.push(c);
  }

  if (filledCells.length === 0) return null;

  // Check if ALL filled cells are symmetric
  for (const c of filledCells) {
    const sym = symCell(c);
    if (grid.get(sym) === 0) return null; // symmetric cell not filled → not symmetric puzzle
  }

  // 2. Build digit permutation from filled cell pairs
  // For each filled cell c with digit d, its symmetric cell sym(c) has digit e.
  // The permutation must map d→e and e→d (or d↔d if self-symmetric).
  const perm = new Array<number>(10).fill(0); // perm[d] = e (0 = unknown)

  for (const c of filledCells) {
    const sym = symCell(c);
    const d = grid.get(c);
    const e = grid.get(sym);
    if (d === 0 || e === 0) continue;

    if (perm[d] !== 0 && perm[d] !== e) return null; // contradiction
    if (perm[e] !== 0 && perm[e] !== d) return null; // contradiction
    perm[d] = e;
    perm[e] = d;
  }

  // Check permutation is consistent
  for (let d = 1; d <= 9; d++) {
    if (perm[d] !== 0) {
      const e = perm[d]!;
      if (perm[e] !== 0 && perm[e] !== d) return null; // inconsistent
    }
  }

  // 3. Apply permutation to find eliminations in unsolved cells
  const elims: { cell: number; digit: number }[] = [];

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue; // already filled
    const sym = symCell(c);

    if (sym === c) {
      // Self-symmetric (center cell): must be a digit that maps to itself
      const selfDigits = [];
      for (let d = 1; d <= 9; d++) {
        if (perm[d] === d) selfDigits.push(d);
      }
      // If permutation is fully determined, eliminate non-self-mapping digits
      if (selfDigits.length > 0 && grid.get(c) === 0) {
        for (const d of digitsOf(grid.candidatesOf(c))) {
          if (!selfDigits.includes(d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
      continue;
    }

    if (grid.get(sym) !== 0) {
      // Symmetric cell is solved with digit e → c must be perm[e]
      const e = grid.get(sym);
      const mappedD = perm[e];
      if (mappedD !== 0) {
        // c must be mappedD → eliminate all others
        for (const d of digitsOf(grid.candidatesOf(c))) {
          if (d !== mappedD) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
    } else if (perm[1] !== 0) {
      // Both cells unsolved but permutation known → restrict candidates
      // Candidates of c must be in {perm[d] : d ∈ candidates of sym}
      const symCands = digitsOf(grid.candidatesOf(sym));
      const allowedForC = new Set(symCands.map((d) => perm[d] ?? 0).filter((x) => x !== 0));
      if (allowedForC.size > 0) {
        for (const d of digitsOf(grid.candidatesOf(c))) {
          if (!allowedForC.has(d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
    }
  }

  if (elims.length === 0) return null;

  // Deduplicate
  const seen = new Set<number>();
  const uniqueElims = elims.filter((e) => {
    const k = e.cell * 10 + e.digit;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (uniqueElims.length === 0) return null;

  const permStr = Array.from({ length: 9 }, (_, i) => `${i + 1}→${perm[i + 1] ?? '?'}`).join(', ');

  return {
    strategyId: 'gurth',
    placements: [],
    eliminations: uniqueElims,
    highlights: {
      cells: [...new Set(uniqueElims.map((e) => e.cell))],
      candidates: uniqueElims,
      links: [],
    },
    explanation: {
      zh: `格思对称占位：题目具有180°旋转对称性，数字置换为 {${permStr}}；根据对称性限制候选数，消去矛盾候选。`,
      en: `Gurth's Symmetrical Placement: puzzle has 180° rotational symmetry with digit permutation {${permStr}}; restrict candidates based on symmetry, eliminate contradictory candidates.`,
    },
  };
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '格思对称占位', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryGurth(grid);
  },
};
