import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS 链', en: 'ALS Chain' },
  difficulty: 880,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};