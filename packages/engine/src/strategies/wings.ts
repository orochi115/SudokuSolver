/**
 * T3: wings (XY-Wing / XYZ-Wing / W-Wing).
 *
 * XY-Wing: pivot with {x,y}, two pincer cells {x,z} and {y,z} → eliminate z from peers of both.
 * XYZ-Wing: similar with three candidates at pivot.
 * W-Wing: two strong links of same digit with weak link between them.
 */

import { SIZE, ROW_OF, COL_OF, PEERS_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findXyWing(grid: Grid): Step | null {
  // Scan for bivalue cells as potential pivots/pincers
  const bivalue: number[] = [];
  for (let c = 0; c < SIZE * SIZE; c++) {
    if (grid.get(c) !== 0) continue;
    const ds = digitsOf(grid.candidatesOf(c));
    if (ds.length === 2) bivalue.push(c);
  }
  for (let i = 0; i < bivalue.length; i++) {
    const p = bivalue[i]!;
    const [x, y] = digitsOf(grid.candidatesOf(p));
    for (let j = i + 1; j < bivalue.length; j++) {
      const a = bivalue[j]!;
      if (!PEERS_OF[p]!.includes(a)) continue;
      const da = digitsOf(grid.candidatesOf(a));
      if (da.length !== 2 || (!da.includes(x!) && !da.includes(y!))) continue;
      const z = da.find((d) => d !== x && d !== y) ?? da.find((d) => d !== x) ?? da[0]!;
      for (let k = j + 1; k < bivalue.length; k++) {
        const b = bivalue[k]!;
        if (!PEERS_OF[p]!.includes(b)) continue;
        const db = digitsOf(grid.candidatesOf(b));
        if (db.length !== 2 || !db.includes(y!) || !db.includes(z) || db.includes(x!)) continue;
        // Found XY-Wing with pivot p, pincers a,b; z is common
        const elims: { cell: number; digit: number }[] = [];
        for (const peer of PEERS_OF[a]!) {
          if (peer === p || peer === b) continue;
          if (PEERS_OF[b]!.includes(peer) && grid.hasCandidate(peer, z)) elims.push({ cell: peer, digit: z });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'wings',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [p, a, b],
              candidates: [
                { cell: p, digit: x! },
                { cell: p, digit: y! },
                { cell: a, digit: x! },
                { cell: a, digit: z },
                { cell: b, digit: y! },
                { cell: b, digit: z },
              ],
              links: [],
            },
            explanation: {
              zh: `XY-Wing：枢纽格含 {${x},${y}}，两翼分别含 {${x},${z}} 与 {${y},${z}}，消除 z 在两翼公共可见格。`,
              en: `XY-Wing: pivot {${x},${y}}, pincers {${x},${z}} & {${y},${z}}; eliminate ${z} from peers of both.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function findXyzWing(grid: Grid): Step | null {
  // Similar but pivot has three candidates; one pincer shares two, the other shares one
  // Minimal implementation: reuse XY-Wing logic as placeholder (full XYZ-Wing is a superset)
  return findXyWing(grid);
}

function findWWing(grid: Grid): Step | null {
  // W-Wing: two cells with same strong digit link, connected by weak link of another digit
  // Simplified: scan for two cells with identical single strong candidate and a weak link path
  // For M2 we provide a stub that never triggers (W-Wing is rare and covered by AIC in M3)
  return null;
}

export const wings: Strategy = {
  id: 'wings',
  name: { zh: '翼', en: 'Wings' },
  difficulty: 45,

  apply(_grid: Grid): Step | null {
    // T3 wings disabled for M2 soundness guarantee
    return null;
  },
};
