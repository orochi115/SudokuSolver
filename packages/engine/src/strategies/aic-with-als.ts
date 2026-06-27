/**
 * AIC with ALS (P1) — 含 ALS 节点的 AIC
 * Reuses als and aic logic.
 */

import { PEERS_OF, popcount, digitsOf, CELLS, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS { cells: number[]; digits: number[]; digitMask: number; }
function maskDigits(m: number) { return digitsOf(m); }
function findAllAlsLocal(grid: Grid): ALS[] {
  const res: ALS[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const empty = house.filter((c) => grid.get(c) === 0);
    for (let sz = 2; sz <= 3; sz++) {
      for (let i = 0; i < empty.length; i++) for (let j = i+1; j < empty.length; j++) {
        const combo = sz===2 ? [empty[i]!,empty[j]!] : [];
        if (sz===2) {
          let m = 0; for (const c of combo) m |= grid.candidatesOf(c);
          if (popcount(m) === 3) res.push({cells:combo, digits:maskDigits(m), digitMask:m});
        }
      }
    }
  }
  for (let c=0;c<CELLS;c++) if (grid.get(c)===0 && popcount(grid.candidatesOf(c))===2) {
    const m = grid.candidatesOf(c); res.push({cells:[c], digits:maskDigits(m), digitMask:m});
  }
  return res;
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含ALS的AIC', en: 'AIC with ALS' },
  difficulty: 760,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return null;
  },
};
