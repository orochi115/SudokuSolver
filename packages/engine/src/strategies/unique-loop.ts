import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 983,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};