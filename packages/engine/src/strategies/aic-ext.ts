import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: 'AIC 含 ALS', en: 'AIC with ALS' },
  difficulty: 760,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: 'AIC 含 UR', en: 'AIC with UR' },
  difficulty: 770,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};