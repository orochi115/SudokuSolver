/**
 * Basic Fish (T3) — X-Wing / Swordfish / Jellyfish.
 *
 * Unified base/cover model:
 *   For a single digit, if N base lines (rows) have their candidates
 *   fully contained within N cover lines (columns), then eliminate that
 *   digit from the cover lines outside the base rows.  Also works with
 *   columns as base and rows as cover.
 */

import { CELLS, ROWS, COLS, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      // Try row-base -> col-cover, then col-base -> row-cover
      const rowResult = findFish(grid, d, 'row', 'col');
      if (rowResult) return rowResult;
      const colResult = findFish(grid, d, 'col', 'row');
      if (colResult) return colResult;
    }
    return null;
  },
};

function findFish(grid: Grid, digit: number, baseType: 'row' | 'col', coverType: 'row' | 'col'): Step | null {
  const bases = baseType === 'row' ? ROWS : COLS;
  const covers = coverType === 'row' ? ROWS : COLS;

  // For each base line, compute which cover lines contain the digit
  const baseCoverSets: number[][] = [];
  const baseCandidateCounts: number[] = [];
  for (let b = 0; b < 9; b++) {
    const coverSet = new Set<number>();
    let count = 0;
    for (const cell of bases[b]!) {
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
        count++;
        coverSet.add(coverType === 'row' ? ROW_OF[cell]! : COL_OF[cell]!);
      }
    }
    baseCoverSets.push([...coverSet]);
    baseCandidateCounts.push(count);
  }

  // Try sizes 2, 3, 4
  for (let size = 2; size <= 4; size++) {
    const baseCombos = combinations([0, 1, 2, 3, 4, 5, 6, 7, 8], size);
    for (const baseCombo of baseCombos) {
      // Each base line must have at least 2 candidates for the digit
      if (baseCombo.some((b) => baseCandidateCounts[b]! < 2)) continue;

      const coverSet = new Set<number>();
      for (const b of baseCombo) {
        for (const c of baseCoverSets[b]!) coverSet.add(c);
      }
      if (coverSet.size !== size) continue;

      // Found a fish
      const coverCombo = [...coverSet];
      const eliminations: CellDigit[] = [];
      const baseCells: number[] = [];

      // Collect base cells (for highlights)
      for (const b of baseCombo) {
        for (const cell of bases[b]!) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            baseCells.push(cell);
          }
        }
      }

      // Eliminate from cover lines outside base lines
      for (const c of coverCombo) {
        for (const cell of covers[c]!) {
          // Check if cell is in any base line
          const inBase = baseCombo.some((b) => {
            if (baseType === 'row') return ROW_OF[cell]! === b;
            return COL_OF[cell]! === b;
          });
          if (inBase) continue;
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            eliminations.push({ cell, digit });
          }
        }
      }

      if (eliminations.length > 0) {
        const fishNames: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };
        const fishNamesZh: Record<number, string> = { 2: 'X翼', 3: '剑鱼', 4: '水母' };
        const cells = [...new Set([...baseCells, ...eliminations.map((e) => e.cell)])];
        return {
          strategyId: 'basic-fish',
          placements: [],
          eliminations,
          highlights: { cells, candidates: baseCells.map((cell) => ({ cell, digit })), links: [] },
          explanation: {
            zh: `数字 ${digit} 形成${fishNamesZh[size]}，可排除 ${eliminations.length} 处候选。`,
            en: `Digit ${digit} forms a ${fishNames[size]}, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
          },
        };
      }
    }
  }
  return null;
}

function combinations<T>(arr: readonly T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}
