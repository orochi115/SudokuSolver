/**
 * Bent Sets — Almost Locked Pair / Triple (T4) — 弯曲集.
 *
 * A bent Almost Locked Set across a line-box intersection:
 *   - Intersection I: the 3 cells where one line meets one box.
 *   - Line-ALS L: ALS cells in the line OUTSIDE I, candidate set ⊆ S.
 *   - Box-ALS B: ALS cells in the box OUTSIDE I, candidate set ⊆ S.
 *
 * Almost Locked Pair (ALP): S = {X,Y}, L = one bivalue cell {X,Y} in the
 *   line outside I, B = one bivalue cell {X,Y} in the box outside I.
 * Almost Locked Triple (ALT): S = {X,Y,Z}, L = 2 cells ⊆ {X,Y,Z} in
 *   line outside I, B = 2 cells ⊆ {X,Y,Z} in box outside I.
 *
 * Fire conditions:
 *   - Box-side: every cell in the line outside (I ∪ L) carries no digit
 *     of S → S in the line is confined to I ∪ L → S can be removed from
 *     every cell in the box outside (I ∪ B).
 *   - Line-side: symmetric.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface BentInfo {
  S: number[]; // digit set
  Sbit: number;
  L: number[]; // line-ALS cells (outside I)
  B: number[]; // box-ALS cells (outside I)
  line: number[]; // line house cells
  box: number[]; // box house cells
  intersection: number[];
}

/** Find all bent (L,B,S,I) configurations for a given line and box. */
function findBentsInLineBox(grid: Grid, line: number[], box: number[]): BentInfo[] {
  const intersection = line.filter((c) => box.includes(c));
  if (intersection.length !== 3) return [];
  const lineOutside = line.filter((c) => !box.includes(c));
  const boxOutside = box.filter((c) => !line.includes(c));
  const result: BentInfo[] = [];

  // ALP: S = {X, Y}, L and B each have one bivalue cell {X, Y}.
  for (let c1 = 0; c1 < lineOutside.length; c1++) {
    for (let c2 = c1 + 1; c2 < lineOutside.length; c2++) {
      const a = lineOutside[c1]!;
      const b = lineOutside[c2]!;
      // Must be on the same digit set
      if (grid.get(a) !== 0 || grid.get(b) !== 0) continue;
      const ma = grid.candidatesOf(a);
      const mb = grid.candidatesOf(b);
      if (ma !== mb) continue; // need same mask for ALP
      if (popcount(ma) !== 2) continue;
    }
  }

  // Easier approach: enumerate S = {X, Y}, find bivalue cells outside I.
  // Then check the rest of the conditions.
  for (let X = 1; X <= 8; X++) {
    for (let Y = X + 1; Y <= 9; Y++) {
      const Sbit = maskOf(X) | maskOf(Y);
      const S = [X, Y];
      // L cells: bivalue {X, Y} cells in lineOutside
      const Lcells = lineOutside.filter((c) => grid.get(c) === 0 && grid.candidatesOf(c) === Sbit);
      // B cells: bivalue {X, Y} cells in boxOutside
      const Bcells = boxOutside.filter((c) => grid.get(c) === 0 && grid.candidatesOf(c) === Sbit);
      // ALP requires exactly 1 L and 1 B
      if (Lcells.length !== 1 || Bcells.length !== 1) continue;
      result.push({ S, Sbit, L: Lcells, B: Bcells, line, box, intersection });
    }
  }

  // ALT: S = {X, Y, Z}, L has 2 cells (subset {X,Y,Z}), B has 2 cells.
  for (let X = 1; X <= 7; X++) {
    for (let Y = X + 1; Y <= 8; Y++) {
      for (let Z = Y + 1; Z <= 9; Z++) {
        const Sbit = maskOf(X) | maskOf(Y) | maskOf(Z);
        const S = [X, Y, Z];
        // L: 2 cells in lineOutside whose union is ⊆ S (and exactly {X,Y,Z} collectively)
        const Lcands: number[][] = [];
        for (let i = 0; i < lineOutside.length; i++) {
          for (let j = i + 1; j < lineOutside.length; j++) {
            const a = lineOutside[i]!;
            const b = lineOutside[j]!;
            if (grid.get(a) !== 0 || grid.get(b) !== 0) continue;
            const m = grid.candidatesOf(a) | grid.candidatesOf(b);
            if ((m & ~Sbit) !== 0) continue;
            if (popcount(m) !== 3) continue;
            Lcands.push([a, b]);
          }
        }
        const Bcands: number[][] = [];
        for (let i = 0; i < boxOutside.length; i++) {
          for (let j = i + 1; j < boxOutside.length; j++) {
            const a = boxOutside[i]!;
            const b = boxOutside[j]!;
            if (grid.get(a) !== 0 || grid.get(b) !== 0) continue;
            const m = grid.candidatesOf(a) | grid.candidatesOf(b);
            if ((m & ~Sbit) !== 0) continue;
            if (popcount(m) !== 3) continue;
            Bcands.push([a, b]);
          }
        }
        // Pair L and B (any combo)
        for (const L of Lcands) {
          for (const B of Bcands) {
            // Disjointness not strictly required but skip shared cells
            if (L.some((c) => B.includes(c))) continue;
            result.push({ S, Sbit, L, B, line, box, intersection });
          }
        }
      }
    }
  }

  return result;
}

function tryBentSets(grid: Grid): Step | null {
  // For each line (row or col), for each box that crosses it.
  for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
    const box = BOXES[boxIdx]!;
    for (let lineIdx = 0; lineIdx < 18; lineIdx++) {
      const line = HOUSES[lineIdx]!;
      const bents = findBentsInLineBox(grid, [...line], [...box]);
      for (const info of bents) {
        const { Sbit, L, B, line, box, intersection } = info;
        const Iset = new Set(intersection);
        const Lset = new Set(L);
        const Bset = new Set(B);

        // Box-side fire: line cells outside (I ∪ L) have no digit of S.
        const lineRestOK = line.every((c) => {
          if (Iset.has(c) || Lset.has(c)) return true;
          if (grid.get(c) !== 0) return true;
          return (grid.candidatesOf(c) & Sbit) === 0;
        });
        // Line-side fire: box cells outside (I ∪ B) have no digit of S.
        const boxRestOK = box.every((c) => {
          if (Iset.has(c) || Bset.has(c)) return true;
          if (grid.get(c) !== 0) return true;
          return (grid.candidatesOf(c) & Sbit) === 0;
        });

        const elims: { cell: number; digit: number }[] = [];
        if (lineRestOK) {
          // Remove S from box cells outside (I ∪ B)
          for (const c of box) {
            if (Iset.has(c) || Bset.has(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of digitsOf(Sbit)) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
        }
        if (boxRestOK) {
          for (const c of line) {
            if (Iset.has(c) || Lset.has(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of digitsOf(Sbit)) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
        }
        if (elims.length === 0) continue;
        return {
          strategyId: 'bent-sets',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...new Set([...intersection, ...L, ...B, ...elims.map((e) => e.cell)])],
            candidates: [...intersection, ...L, ...B].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `弯曲集（几乎锁定候选）：行/列与宫的交叉处 ${intersection.map(cellLabel).join('、')} 配线/宫外各一 ALS（${L.map(cellLabel).join('、')} 与 ${B.map(cellLabel).join('、')}），候选集 {${digitsOf(Sbit).join(',')}}；消去交叉外的对应数字。`,
            en: `Bent Sets (Almost Locked Candidates): intersection ${intersection.map(cellLabel).join(', ')} with line-ALS ${L.map(cellLabel).join(', ')} and box-ALS ${B.map(cellLabel).join(', ')}, digit set {${digitsOf(Sbit).join(',')}}; eliminate these digits from cells outside the intersection (Bent Sets).`,
          },
        };
      }
    }
  }
  return null;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets (ALP/ALT)' },
  difficulty: 540,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryBentSets(grid);
  },
};

// Suppress unused
void CELLS;