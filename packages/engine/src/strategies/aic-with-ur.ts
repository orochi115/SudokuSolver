/**
 * AIC with UR (P1)
 */

import { ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf, CELLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function allRects(): [number,number,number,number][] {
  const out: [number,number,number,number][] = [];
  for (let r1=0;r1<8;r1++) for (let r2=r1+1;r2<9;r2++) for (let c1=0;c1<8;c1++) for (let c2=c1+1;c2<9;c2++) {
    const bxs = new Set([Math.floor(r1/3)*3+Math.floor(c1/3), Math.floor(r1/3)*3+Math.floor(c2/3), Math.floor(r2/3)*3+Math.floor(c1/3), Math.floor(r2/3)*3+Math.floor(c2/3)]);
    if (bxs.size===2) out.push([r1*9+c1, r1*9+c2, r2*9+c1, r2*9+c2]);
  }
  return out;
}

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含UR的AIC', en: 'AIC with UR' },
  difficulty: 770,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return null;
  },
};
