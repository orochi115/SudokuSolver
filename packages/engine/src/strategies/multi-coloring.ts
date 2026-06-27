import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多色染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};