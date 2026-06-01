import { ROW_OF, COL_OF, PEERS_OF, HOUSES, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Set' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    return null;
  },
};