/**
 * Gurth's Theorem / Symmetrical Placement (P2) — 葛斯定理（对称摆放）
 *
 * If a puzzle's givens are symmetric under a geometric transform plus a 1:1
 * digit permutation, and the puzzle has a unique solution, then the solved
 * board is symmetric too. Useful deductions therefore live only on the fixed
 * cells of the symmetry: they must hold self-mapped digits.
 */

import { CELLS, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

type Symmetry = {
  id: string;
  name: { zh: string; en: string };
  image(cell: number): number;
  fixed(cell: number): boolean;
};

const mainDiagonal: Symmetry = {
  id: 'main-diagonal',
  name: { zh: '主对角线反射', en: 'main-diagonal reflection' },
  image: (c) => COL_OF[c]! * 9 + ROW_OF[c]!,
  fixed: (c) => ROW_OF[c] === COL_OF[c],
};

const antiDiagonal: Symmetry = {
  id: 'anti-diagonal',
  name: { zh: '反对角线反射', en: 'anti-diagonal reflection' },
  image: (c) => (8 - COL_OF[c]!) * 9 + (8 - ROW_OF[c]!),
  fixed: (c) => ROW_OF[c]! + COL_OF[c]! === 8,
};

const rotation180: Symmetry = {
  id: '180-rotation',
  name: { zh: '180° 旋转', en: '180° rotation' },
  image: (c) => (8 - ROW_OF[c]!) * 9 + (8 - COL_OF[c]!),
  fixed: (c) => ROW_OF[c] === 4 && COL_OF[c] === 4,
};

const SYMMETRIES: readonly Symmetry[] = [mainDiagonal, antiDiagonal, rotation180];

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/**
 * Try a single symmetry. Returns the digit permutation map and the list of
 * fixed cells if the givens are compatible; otherwise null.
 */
function trySymmetry(grid: Grid, sym: Symmetry): { map: number[]; fixedCells: number[] } | null {
  const map: number[] = Array.from({ length: 10 }, () => 0);

  for (let c = 0; c < CELLS; c++) {
    if (!grid.givens[c]) continue;
    const img = sym.image(c);
    if (!grid.givens[img]) return null; // every clue needs a complement

    const d = grid.values[c]!;
    const dImg = grid.values[img]!;

    if (sym.fixed(c)) {
      // Fixed cell must map its digit to itself.
      if (map[d] !== 0 && map[d] !== d) return null;
      map[d] = d;
    } else {
      if (map[d] !== 0 && map[d] !== dImg) return null;
      map[d] = dImg;
    }
  }

  // The map must be a complete permutation of 1..9.
  const images = new Set<number>();
  for (let d = 1; d <= 9; d++) {
    if (map[d] === 0) return null;
    images.add(map[d]!);
  }
  if (images.size !== 9) return null;

  const fixedCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (sym.fixed(c) && grid.get(c) === 0) fixedCells.push(c);
  }
  if (fixedCells.length === 0) return null;

  return { map, fixedCells };
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理（对称摆放）', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (const sym of SYMMETRIES) {
      const result = trySymmetry(grid, sym);
      if (!result) continue;
      const { map, fixedCells } = result;
      const selfDigits = digitsOf(
        digitsOf(0x1ff)
          .filter((d) => map[d] === d)
          .reduce((m, d) => m | maskOf(d), 0),
      );
      if (selfDigits.length === 0) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      const placements: { cell: number; digit: number }[] = [];

      for (const c of fixedCells) {
        const candMask = grid.candidatesOf(c);
        for (const d of digitsOf(candMask)) {
          if (!selfDigits.includes(d)) {
            eliminations.push({ cell: c, digit: d });
          }
        }
        const remaining = digitsOf(candMask & ~eliminations.filter((e) => e.cell === c).reduce((m, e) => m | maskOf(e.digit), 0));
        // Simpler: after stripping, if one candidate left, place it.
        const surviving = digitsOf(candMask).filter((d) => selfDigits.includes(d));
        if (surviving.length === 1 && grid.hasCandidate(c, surviving[0]!)) {
          placements.push({ cell: c, digit: surviving[0]! });
        }
      }

      if (eliminations.length === 0 && placements.length === 0) continue;

      return {
        strategyId: this.id,
        placements,
        eliminations,
        highlights: {
          cells: [...fixedCells, ...placements.map((p) => p.cell), ...eliminations.map((e) => e.cell)],
          candidates: [
            ...fixedCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...placements,
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `葛斯定理：题面关于 ${sym.name.zh} 对称，数字映射为 {${selfDigits.join(',')}} 自映射；从对称轴格中删除非自映射候选数。`,
          en: "Gurth's theorem: the givens are symmetric under " + sym.name.en + `; self-mapped digits are {${selfDigits.join(',')}} — eliminate non-self-mapped candidates from fixed cells.`,
        },
      };
    }
    return null;
  },
};
