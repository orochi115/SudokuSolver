/**
 * W-Wing (T3).
 *
 * Two bivalue cells with the same pair {X,Y} are bridged by a strong link
 * on one digit (say X). Any cell seeing both bivalue cells cannot be Y.
 */

import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 52,

  apply(grid: Grid): Step | null {
    // Collect all bivalue cells
    const bivalue: { cell: number; candidates: [number, number] }[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const mask = grid.candidatesOf(cell);
      const ds = getDigits(mask);
      if (ds.length === 2) {
        bivalue.push({ cell, candidates: [ds[0]!, ds[1]!] });
      }
    }

    for (let i = 0; i < bivalue.length; i++) {
      for (let j = i + 1; j < bivalue.length; j++) {
        const a = bivalue[i]!;
        const b = bivalue[j]!;

        // Must have the same pair
        if (
          a.candidates[0] !== b.candidates[0] ||
          a.candidates[1] !== b.candidates[1]
        )
          continue;

        const [x, y] = a.candidates;

        // Must not see each other
        if (sees(a.cell, b.cell)) continue;

        // Find a strong link on x between a cell that sees a and a cell that sees b
        const peersA = PEERS_OF[a.cell]!.filter(
          (p) => grid.get(p) === 0 && grid.hasCandidate(p, x),
        );
        const peersB = PEERS_OF[b.cell]!.filter(
          (p) => grid.get(p) === 0 && grid.hasCandidate(p, x),
        );

        for (const pa of peersA) {
          for (const pb of peersB) {
            if (pa === pb) continue;
            // pa and pb must form a strong link on x in some house
            if (!strongLinkOnX(grid, pa, pb, x)) continue;

            // Now a and b are bridged by the strong link on x
            const eliminations: CellDigit[] = [];
            for (let cell = 0; cell < CELLS; cell++) {
              if (cell === a.cell || cell === b.cell) continue;
              if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, y)) continue;
              if (sees(cell, a.cell) && sees(cell, b.cell)) {
                eliminations.push({ cell, digit: y });
              }
            }
            if (eliminations.length > 0) {
              return makeStep(a, b, eliminations, x, y);
            }
          }
        }
      }
    }
    return null;
  },
};

function strongLinkOnX(grid: Grid, a: number, b: number, x: number): boolean {
  if (a === b) return false;
  // Must be in the same house and have only x as common candidate in that house... no, 
  // a strong link means that in some house, a and b are the ONLY cells with candidate x.
  const houses = [ROWS, COLS, BOXES];
  for (const houseSet of houses) {
    for (const house of houseSet) {
      if (!house.includes(a) || !house.includes(b)) continue;
      const xs = house.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, x));
      if (xs.length === 2 && xs.includes(a) && xs.includes(b)) {
        return true;
      }
    }
  }
  return false;
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

function makeStep(
  a: { cell: number; candidates: [number, number] },
  b: { cell: number; candidates: [number, number] },
  eliminations: CellDigit[],
  x: number,
  y: number,
): Step {
  const ra = ROW_OF[a.cell]! + 1;
  const ca = COL_OF[a.cell]! + 1;
  const rb = ROW_OF[b.cell]! + 1;
  const cb = COL_OF[b.cell]! + 1;
  return {
    strategyId: 'w-wing',
    placements: [],
    eliminations,
    highlights: {
      cells: [a.cell, b.cell],
      candidates: [
        { cell: a.cell, digit: a.candidates[0] },
        { cell: a.cell, digit: a.candidates[1] },
        { cell: b.cell, digit: b.candidates[0] },
        { cell: b.cell, digit: b.candidates[1] },
      ],
      links: [],
    },
    explanation: {
      zh: `R${ra}C${ca} 与 R${rb}C${cb} 由强链 ${x} 构成 W 翼，可排除 ${eliminations.length} 处候选 ${y}。`,
      en: `W-Wing between R${ra}C${ca} and R${rb}C${cb} bridged by strong link ${x}, eliminating ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''} ${y}.`,
    },
  };
}
