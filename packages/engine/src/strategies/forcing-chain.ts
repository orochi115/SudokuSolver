import { CELLS, ROW_OF, COL_OF, PEERS_OF, HOUSES, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function followNakedSingles(grid: Grid, cell: number, digit: number, maxSteps: number): { placements: [number, number][] } {
  const g = grid.clone();
  g.place(cell, digit);
  const placements: [number, number][] = [[cell, digit]];

  for (let step = 0; step < maxSteps; step++) {
    let progressed = false;
    for (let c = 0; c < CELLS; c++) {
      if (g.get(c) !== 0) continue;
      const mask = g.candidatesOf(c);
      if (popcount(mask) === 1) {
        const d = digitsOf(mask)[0]!;
        g.place(c, d);
        placements.push([c, d]);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return { placements };
}

const MAX_DEPTH = 10;

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid: Grid): Step | null {
    const fmt = (c: number) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const mask = grid.candidatesOf(cell);
      const digits = digitsOf(mask);
      if (digits.length !== 2) continue;

      const d1 = digits[0]!;
      const d2 = digits[1]!;

      const r1 = followNakedSingles(grid, cell, d1, MAX_DEPTH);
      const r2 = followNakedSingles(grid, cell, d2, MAX_DEPTH);

      const r1Placements = new Map<number, number>();
      for (const [c, d] of r1.placements) r1Placements.set(c, d);

      const r2Placements = new Map<number, number>();
      for (const [c, d] of r2.placements) r2Placements.set(c, d);

      for (const [c, d] of r1Placements) {
        const r2d = r2Placements.get(c);
        if (r2d !== undefined && r2d === d && c !== cell) {
          if (grid.get(c) === 0) {
            return {
              strategyId: 'forcing-chain',
              placements: [{ cell: c, digit: d }],
              eliminations: [],
              highlights: {
                cells: [cell, c],
                candidates: [{ cell, digit: d1 }, { cell, digit: d2 }, { cell: c, digit: d }],
                links: [],
              },
              explanation: {
                zh: `强制链：${fmt(cell)}={${d1},${d2}} 两种取法均推出 ${fmt(c)} 为 ${d}，因此填入 ${d}。`,
                en: `Forcing Chain: ${fmt(cell)}={${d1},${d2}} both lead to ${fmt(c)}=${d}, so place ${d}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};