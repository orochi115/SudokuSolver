/**
 * T3: fish (X-Wing / Swordfish / Jellyfish) with unified base/cover model.
 *
 * Base sets: N rows (or cols) where a digit is confined to N columns (or rows).
 * Cover sets: the N columns (or rows) that cover all occurrences.
 * Eliminations: digit in cover rows/cols but outside base sets.
 */

import { SIZE, ROWS, COLS, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

type Axis = 'row' | 'col';

function findFishForDigit(grid: Grid, digit: number, size: number, baseAxis: Axis): Step | null {
  const lines = baseAxis === 'row' ? ROWS : COLS;
  const coverAxis = baseAxis === 'row' ? 'col' : 'row';
  const coverLines = coverAxis === 'row' ? ROWS : COLS;

  // For each base line, collect the cover lines where digit appears
  const baseToCover: number[][] = [];
  for (let i = 0; i < SIZE; i++) {
    const covers: number[] = [];
    for (let j = 0; j < SIZE; j++) {
      const cell = baseAxis === 'row' ? i * SIZE + j : j * SIZE + i;
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) covers.push(j);
    }
    baseToCover.push(covers);
  }

  // Find combinations of 'size' base lines whose union of cover lines has exactly 'size' members
  const bases = combinations(SIZE, size);
  for (const baseIdxs of bases) {
    const coverSet = new Set<number>();
    for (const b of baseIdxs) for (const c of baseToCover[b]!) coverSet.add(c);
    if (coverSet.size !== size) continue;

    const coverIdxs = [...coverSet];
    // Collect base cells (for highlights)
    const baseCells: number[] = [];
    for (const b of baseIdxs) {
      for (const c of coverIdxs) {
        const cell = baseAxis === 'row' ? b * SIZE + c : c * SIZE + b;
        if (grid.hasCandidate(cell, digit)) baseCells.push(cell);
      }
    }

    // Eliminations: digit in cover lines but outside base lines
    const elims: { cell: number; digit: number }[] = [];
    for (const c of coverIdxs) {
      for (let b = 0; b < SIZE; b++) {
        if (baseIdxs.includes(b)) continue;
        const cell = baseAxis === 'row' ? b * SIZE + c : c * SIZE + b;
        if (grid.hasCandidate(cell, digit)) elims.push({ cell, digit });
      }
    }
    if (elims.length === 0) continue;

    const fishName = size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish';
    return {
      strategyId: 'fish',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: baseCells,
        candidates: baseCells.map((c) => ({ cell: c, digit })),
        links: [],
      },
      explanation: {
        zh: `${fishName}：数字 ${digit} 在 ${size} 个${baseAxis === 'row' ? '行' : '列'}的 ${size} 个${coverAxis === 'row' ? '行' : '列'} 内形成，消除交叉格的候选 ${digit}。`,
        en: `${fishName}: digit ${digit} locked in ${size} ${baseAxis}s covering ${size} ${coverAxis}s; eliminate ${digit} from intersections outside bases.`,
      },
    };
  }
  return null;
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  function rec(start: number) {
    if (cur.length === k) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < n; i++) {
      cur.push(i);
      rec(i + 1);
      cur.pop();
    }
  }
  rec(0);
  return out;
}

export const fish: Strategy = {
  id: 'fish',
  name: { zh: '鱼', en: 'Fish' },
  difficulty: 40,

  apply(_grid: Grid): Step | null {
    // T3 fish disabled for M2 soundness guarantee; will be re-enabled after verification
    return null;
  },
};
