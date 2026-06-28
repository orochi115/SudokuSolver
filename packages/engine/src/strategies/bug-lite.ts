import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG精简', en: 'BUG Lite' },
  difficulty: 984,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};