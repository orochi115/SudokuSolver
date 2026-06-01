/**
 * Basic Fish (T3) — X-Wing, Swordfish, Jellyfish.
 *
 * Unified base/cover model:
 *   For one digit and N base houses (rows or columns), if all candidates for
 *   that digit in the base houses are confined to exactly N cover houses
 *   (columns or rows), then the digit can be eliminated from any cover house
 *   cell that is NOT in a base house.
 *
 * Size 2 = X-Wing, size 3 = Swordfish, size 4 = Jellyfish.
 * We try both row-base (eliminate from columns) and column-base (eliminate
 * from rows) directions.
 */

import { ROWS, COLS, ROW_OF, COL_OF, SIZE, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

/**
 * Try to find a fish pattern of size `n` for the given digit.
 * baseLines: the houses used as bases (rows or columns).
 * coverLines: the houses used as covers (columns or rows).
 * baseIsRow: true = bases are rows (covers are columns); false = bases are cols.
 */
function tryFishForDigit(
  grid: Grid,
  d: number,
  n: number,
  baseLines: readonly (readonly number[])[],
  coverLines: readonly (readonly number[])[],
  baseIsRow: boolean,
): Step | null {
  const bit = maskOf(d);

  // For each base line, collect cover-line indices where d appears
  const lineToCovers: Map<number, Set<number>> = new Map();
  for (let li = 0; li < 9; li++) {
    const line = baseLines[li]!;
    const covers = new Set<number>();
    for (const cell of line) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
        covers.add(baseIsRow ? COL_OF[cell]! : ROW_OF[cell]!);
      }
    }
    // Only valid base lines have 2..n candidates
    if (covers.size >= 2 && covers.size <= n) {
      lineToCovers.set(li, covers);
    }
  }

  if (lineToCovers.size < n) return null;

  const baseIndices = [...lineToCovers.keys()];
  const combos = combinations(baseIndices, n);

  for (const combo of combos) {
    // Union of cover indices used by all n base lines
    const coverSet = new Set<number>();
    for (const li of combo) {
      for (const ci of lineToCovers.get(li)!) {
        coverSet.add(ci);
      }
    }
    if (coverSet.size !== n) continue;

    // Found a fish! Eliminate d from cover lines outside the base lines.
    const baseSet = new Set(combo);
    const eliminations: { cell: number; digit: number }[] = [];

    for (const ci of coverSet) {
      const coverLine = coverLines[ci]!;
      for (const cell of coverLine) {
        // cell is in cover line ci; skip if it's also in a base line
        const inBase = baseIsRow ? baseSet.has(ROW_OF[cell]!) : baseSet.has(COL_OF[cell]!);
        if (inBase) continue;
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          eliminations.push({ cell, digit: d });
        }
      }
    }

    if (eliminations.length === 0) continue;

    const name = FISH_NAMES[n]!;
    const baseType = baseIsRow ? '行' : '列';
    const coverType = baseIsRow ? '列' : '行';
    const baseTypeEn = baseIsRow ? 'Row' : 'Column';
    const coverTypeEn = baseIsRow ? 'Column' : 'Row';
    const baseStr = combo.map((i) => `${baseType}${i + 1}`).join('、');
    const coverStr = [...coverSet].map((i) => `${coverType}${i + 1}`).join('、');
    const elimStr = eliminations.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}`).join('、');

    // Collect base cells for highlights
    const baseCells: number[] = [];
    for (const li of combo) {
      for (const cell of baseLines[li]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          baseCells.push(cell);
        }
      }
    }

    return {
      strategyId: `basic-fish-${n === 2 ? 'x-wing' : n === 3 ? 'swordfish' : 'jellyfish'}`,
      placements: [],
      eliminations,
      highlights: {
        cells: baseCells,
        candidates: baseCells.map((c) => ({ cell: c, digit: d })),
        links: [],
      },
      explanation: {
        zh: `数字 ${d} 的 ${n} 基础${baseType}（${baseStr}）所有候选数恰好落在 ${n} 个覆盖${coverType}（${coverStr}）中，构成${name.zh}。从覆盖${coverType}的基础外格删除候选数 ${d}。消除格：${elimStr}。`,
        en: `Digit ${d}'s candidates in ${n} base ${baseTypeEn}s (${baseStr}) are all confined to ${n} cover ${coverTypeEn}s (${coverStr}), forming a ${name.en}. Remove ${d} from cover ${coverTypeEn}s outside the base ${baseTypeEn}s. Eliminations: ${elimStr}.`,
      },
    };
  }

  return null;
}

function tryBasicFish(grid: Grid, n: number): Step | null {
  for (let d = 1; d <= SIZE; d++) {
    // Row-based fish (eliminate from columns)
    const step = tryFishForDigit(grid, d, n, ROWS, COLS, true);
    if (step) return step;

    // Column-based fish (eliminate from rows)
    const step2 = tryFishForDigit(grid, d, n, COLS, ROWS, false);
    if (step2) return step2;
  }
  return null;
}

/** Generate all size-k combinations from an array. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first!, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export const xWing: Strategy = {
  id: 'basic-fish-x-wing',
  name: { zh: 'X翼', en: 'X-Wing' },
  difficulty: 40,
  apply: (grid) => tryBasicFish(grid, 2),
};

export const swordfish: Strategy = {
  id: 'basic-fish-swordfish',
  name: { zh: '剑鱼', en: 'Swordfish' },
  difficulty: 40,
  apply: (grid) => tryBasicFish(grid, 3),
};

export const jellyfish: Strategy = {
  id: 'basic-fish-jellyfish',
  name: { zh: '水母', en: 'Jellyfish' },
  difficulty: 40,
  apply: (grid) => tryBasicFish(grid, 4),
};
