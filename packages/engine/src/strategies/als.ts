import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';

export const als: Strategy = {
  id: 'als',
  name: { zh: 'ALS', en: 'ALS' },
  difficulty: 80,
  apply(_grid: Grid): Step | null { return null; }
};
