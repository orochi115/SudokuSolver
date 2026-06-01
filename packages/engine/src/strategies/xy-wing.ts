/**
 * XY-Wing (T3) — a short XY-chain with a pivot and two pincers.
 *
 * Pivot cell has candidates {X,Y}.
 * Pincer A sees pivot and has candidates {X,Z}.
 * Pincer B sees pivot and has candidates {Y,Z}.
 * Any cell seeing both pincers cannot be Z.
 */

import { CELLS, PEERS_OF, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Collect all bivalue cells
    const bivalue: { cell: number; candidates: [number, number] }[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const mask = grid.candidatesOf(cell);
      const ds = digitsOf(mask);
      if (ds.length === 2) {
        bivalue.push({ cell, candidates: [ds[0]!, ds[1]!] });
      }
    }

    for (const pivot of bivalue) {
      const [x, y] = pivot.candidates;
      const pincersX = bivalue.filter(
        (p) =>
          p.cell !== pivot.cell &&
          sees(p.cell, pivot.cell) &&
          p.candidates.includes(x),
      );
      const pincersY = bivalue.filter(
        (p) =>
          p.cell !== pivot.cell &&
          sees(p.cell, pivot.cell) &&
          p.candidates.includes(y),
      );

      for (const px of pincersX) {
        for (const py of pincersY) {
          if (px.cell === py.cell) continue;
          if (sees(px.cell, py.cell)) continue;

          const zX = px.candidates.find((d) => d !== x)!;
          const zY = py.candidates.find((d) => d !== y)!;
          if (zX !== zY) continue;
          const z = zX;

          const eliminations: CellDigit[] = [];
          for (let cell = 0; cell < CELLS; cell++) {
            if (cell === px.cell || cell === py.cell || cell === pivot.cell) continue;
            if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, z)) continue;
            if (sees(cell, px.cell) && sees(cell, py.cell)) {
              eliminations.push({ cell, digit: z });
            }
          }
          if (eliminations.length > 0) {
            const r = ROW_OF[pivot.cell]! + 1;
            const c = COL_OF[pivot.cell]! + 1;
            return {
              strategyId: 'xy-wing',
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot.cell, px.cell, py.cell],
                candidates: [
                  { cell: pivot.cell, digit: x },
                  { cell: pivot.cell, digit: y },
                  { cell: px.cell, digit: x },
                  { cell: px.cell, digit: z },
                  { cell: py.cell, digit: y },
                  { cell: py.cell, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `R${r}C${c} 为轴心，${x} 与 ${y} 分别连接两个钳子，可排除 ${eliminations.length} 处候选 ${z}。`,
                en: `Pivot at R${r}C${c} with ${x} and ${y} connects two pincers, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''} ${z}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function digitsOf(mask: number): number[] {
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
