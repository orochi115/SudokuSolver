/**
 * WXYZ-Wing (P1) — WXYZ 翼
 *
 * Classic form: a pivot cell with four candidates {w,x,y,z}, plus three
 * bivalue pincer cells that each see the pivot and are respectively {w,z},
 * {x,z} and {y,z}. Then z must appear in one of the pincers, so cells
 * seeing all three pincers lose z.
 */

import { CELLS, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function commonPeers(cells: number[]): number[] {
  if (cells.length === 0) return [];
  let result = new Set(PEERS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    const next = new Set(PEERS_OF[cells[i]!]!);
    result = new Set([...result].filter((c) => next.has(c)));
  }
  return [...result];
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ-Wing', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 4) continue;
      const [w, x, y, z] = digitsOf(pivotMask).sort((a, b) => a - b) as [number, number, number, number];

      const pincerCandidates: number[] = [];
      for (const c of PEERS_OF[pivot]!) {
        if (grid.get(c) !== 0) continue;
        if (popcount(grid.candidatesOf(c)) === 2) pincerCandidates.push(c);
      }
      pincerCandidates.sort((a, b) => a - b);

      // Need three distinct pincers: {w,z}, {x,z}, {y,z}.
      const pW = pincerCandidates.filter((c) => grid.hasCandidate(c, w) && grid.hasCandidate(c, z) && !grid.hasCandidate(c, x) && !grid.hasCandidate(c, y));
      const pX = pincerCandidates.filter((c) => grid.hasCandidate(c, x) && grid.hasCandidate(c, z) && !grid.hasCandidate(c, w) && !grid.hasCandidate(c, y));
      const pY = pincerCandidates.filter((c) => grid.hasCandidate(c, y) && grid.hasCandidate(c, z) && !grid.hasCandidate(c, w) && !grid.hasCandidate(c, x));

      for (const cw of pW) {
        for (const cx of pX) {
          if (cx === cw) continue;
          for (const cy of pY) {
            if (cy === cw || cy === cx) continue;
            const pincers = [cw, cx, cy];
            const viewers = commonPeers(pincers).filter((c) => c !== pivot && !pincers.includes(c));
            const elims: { cell: number; digit: number }[] = [];
            for (const c of viewers) {
              if (grid.get(c) !== 0) continue;
              if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
            }
            if (elims.length === 0) continue;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, ...pincers, ...elims.map((e) => e.cell)],
                candidates: [
                  { cell: pivot, digit: w }, { cell: pivot, digit: x }, { cell: pivot, digit: y }, { cell: pivot, digit: z },
                  { cell: cw, digit: w }, { cell: cw, digit: z },
                  { cell: cx, digit: x }, { cell: cx, digit: z },
                  { cell: cy, digit: y }, { cell: cy, digit: z },
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ-Wing：枢纽格 ${cellLabel(pivot)}={${w},${x},${y},${z}}，翼格 ${cellLabel(cw)}={${w},${z}}、${cellLabel(cx)}={${x},${z}}、${cellLabel(cy)}={${y},${z}}；${z} 必在某一翼格，消去能看到三翼格的格中的 ${z}。`,
                en: `WXYZ-Wing: pivot ${cellLabel(pivot)}={${w},${x},${y},${z}} with pincers ${cellLabel(cw)}={${w},${z}}, ${cellLabel(cx)}={${x},${z}}, ${cellLabel(cy)}={${y},${z}}; ${z} must be in a pincer, eliminating ${z} from cells seeing all three pincers.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
