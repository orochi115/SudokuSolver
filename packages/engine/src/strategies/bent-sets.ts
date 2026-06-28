import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集（几乎锁定对/三元组）', en: 'Bent Sets (Almost Locked Pair/Triple)' },
  difficulty: 540,
  tieBreak: ['size', 'cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};
