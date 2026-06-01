/**
 * Basic Fish (T3) — 基础鱼：X-Wing / Swordfish / Jellyfish.
 *
 * Unified base/cover-set model for a single digit:
 *  - Pick N "base" houses (all rows, or all columns) in which the digit's
 *    candidates are confined to at most N "cover" lines of the perpendicular
 *    orientation.
 *  - If the union of base candidate positions spans exactly N cover lines, the
 *    digit must occupy N of the base∩cover intersections, so it can be
 *    eliminated from those cover lines OUTSIDE the base houses.
 *
 * N=2 → X-Wing, N=3 → Swordfish, N=4 → Jellyfish. One implementation, three
 * named techniques (the foundation for finned/franken fish in M3).
 */

import {
  SIZE,
  ROWS,
  COLS,
  ROW_OF,
  COL_OF,
  cellsWithCandidate,
  combinations,
  cellLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

interface FishOrientation {
  baseHouses: readonly (readonly number[])[];
  /** Cover-line index of a cell (which perpendicular line it sits on). */
  coverOf: (cell: number) => number;
  /** Cells of a cover line that still hold the digit. */
  coverCells: readonly (readonly number[])[];
  zhBase: string;
  enBase: string;
}

function findFish(grid: Grid, id: string, o: FishOrientation): Step | null {
  for (let digit = 1; digit <= SIZE; digit++) {
    // Base houses where the digit appears in 2..N cells (usable as fish base).
    const baseInfo: { houseIdx: number; cells: number[]; covers: number[] }[] = [];
    for (let i = 0; i < o.baseHouses.length; i++) {
      const cells = cellsWithCandidate(grid, o.baseHouses[i]!, digit);
      if (cells.length >= 2) {
        baseInfo.push({ houseIdx: i, cells, covers: cells.map(o.coverOf) });
      }
    }

    for (let n = 2; n <= 4; n++) {
      const eligible = baseInfo.filter((b) => b.cells.length <= n);
      if (eligible.length < n) continue;

      for (const combo of combinations(eligible, n)) {
        const coverSet = new Set<number>();
        for (const b of combo) for (const cv of b.covers) coverSet.add(cv);
        if (coverSet.size !== n) continue;

        // Eliminate the digit from the cover lines, outside the base cells.
        const baseCells = new Set<number>();
        for (const b of combo) for (const c of b.cells) baseCells.add(c);

        const elims: CellDigit[] = [];
        for (const cv of coverSet) {
          for (const c of o.coverCells[cv]!) {
            if (grid.get(c) !== 0) continue;
            if (!grid.hasCandidate(c, digit)) continue;
            if (baseCells.has(c)) continue;
            elims.push({ cell: c, digit });
          }
        }
        if (elims.length === 0) continue;

        const nm = FISH_NAMES[n]!;
        const baseLabels = combo.map((b) => b.houseIdx + 1).join(',');
        return {
          strategyId: id,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...baseCells],
            candidates: [...baseCells].map((c) => ({ cell: c, digit })),
            links: [],
          },
          explanation: {
            zh: `${nm.zh}：数字 ${digit} 在${o.zhBase} ${baseLabels} 中均被限制在相同的 ${n} 条${o.enBase === 'rows' ? '列' : '行'}上，构成 ${n} 阶鱼，可从这些${o.enBase === 'rows' ? '列' : '行'}的其余格中排除 ${digit}（涉及 ${combo.flatMap((b) => b.cells).map(cellLabel).join('、')}）。`,
            en: `${nm.en}: digit ${digit} in ${o.enBase} ${baseLabels} is confined to the same ${n} cover lines, forming a size-${n} fish; ${digit} can be removed from the rest of those lines (base cells ${combo.flatMap((b) => b.cells).map(cellLabel).join(', ')}).`,
          },
        };
      }
    }
  }
  return null;
}

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    // Rows as base, columns as cover.
    const rowBased = findFish(grid, this.id, {
      baseHouses: ROWS,
      coverOf: (cell) => COL_OF[cell]!,
      coverCells: COLS,
      zhBase: '行',
      enBase: 'rows',
    });
    if (rowBased) return rowBased;

    // Columns as base, rows as cover.
    return findFish(grid, this.id, {
      baseHouses: COLS,
      coverOf: (cell) => ROW_OF[cell]!,
      coverCells: ROWS,
      zhBase: '列',
      enBase: 'columns',
    });
  },
};
