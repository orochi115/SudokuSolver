/**
 * XYZ-Wing (T3).
 *
 * Pivot cell has candidates {X,Y,Z}.
 * Pincer A sees pivot and has candidates {X,Z}.
 * Pincer B sees pivot and has candidates {Y,Z}.
 * Any cell seeing all three (pivot and both pincers) cannot be Z.
 */

import { CELLS, PEERS_OF, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 51,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const mask = grid.candidatesOf(pivot);
      if (popcount(mask) !== 3) continue;
      const ds = getDigits(mask);
      const x = ds[0]!;
      const y = ds[1]!;
      const z = ds[2]!;
      const pivotDigits = new Set([x, y, z]);

      // Find pincers with pairs that are subsets of the pivot's digits
      const pincers: { cell: number; pair: [number, number] }[] = [];
      for (let cell = 0; cell < CELLS; cell++) {
        if (cell === pivot) continue;
        if (grid.get(cell) !== 0) continue;
        const cm = grid.candidatesOf(cell);
        if (popcount(cm) !== 2) continue;
        const pds = getDigits(cm);
        // Pincer must be subset of pivot digits and include z
        if (pds.every((d) => pivotDigits.has(d)) && pds.includes(z)) {
          pincers.push({ cell, pair: [pds[0]!, pds[1]!] });
        }
      }

      for (let i = 0; i < pincers.length; i++) {
        for (let j = i + 1; j < pincers.length; j++) {
          const a = pincers[i]!;
          const b = pincers[j]!;
          if (!sees(a.cell, pivot) || !sees(b.cell, pivot)) continue;
          if (a.cell === b.cell) continue;

          // Both must share z
          if (!a.pair.includes(z) || !b.pair.includes(z)) continue;

          // Each must have a different other digit from pivot
          const aOther = a.pair.find((d) => d !== z);
          const bOther = b.pair.find((d) => d !== z);
          if (!aOther || !bOther || aOther === bOther) continue;

          // Find cells that see all three
          const eliminations: CellDigit[] = [];
          for (let cell = 0; cell < CELLS; cell++) {
            if (cell === pivot || cell === a.cell || cell === b.cell) continue;
            if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, z)) continue;
            if (sees(cell, pivot) && sees(cell, a.cell) && sees(cell, b.cell)) {
              eliminations.push({ cell, digit: z });
            }
          }
          if (eliminations.length > 0) {
            const r = ROW_OF[pivot]! + 1;
            const c = COL_OF[pivot]! + 1;
            return {
              strategyId: 'xyz-wing',
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot, a.cell, b.cell],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: pivot, digit: z },
                  { cell: a.cell, digit: a.pair[0] },
                  { cell: a.cell, digit: a.pair[1] },
                  { cell: b.cell, digit: b.pair[0] },
                  { cell: b.cell, digit: b.pair[1] },
                ],
                links: [],
              },
              explanation: {
                zh: `R${r}C${c} 为 XYZ 轴心，可排除 ${eliminations.length} 处候选 ${z}。`,
                en: `XYZ-Wing pivot at R${r}C${c} eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''} ${z}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

function getDigits(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (mask & (1 << (d - 1))) out.push(d);
  }
  return out;
}

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return PEERS_OF[a]!.includes(b);
}
