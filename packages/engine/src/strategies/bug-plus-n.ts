import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 986,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};