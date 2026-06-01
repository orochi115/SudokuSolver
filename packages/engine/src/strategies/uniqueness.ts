import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性矩形', en: 'Uniqueness' },
  difficulty: 90,
  apply(_grid: Grid): Step | null { return null; }
};
