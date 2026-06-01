import { ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    return null;
  },
};